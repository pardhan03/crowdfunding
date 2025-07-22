use anchor_lang::prelude::*;

declare_id!("AbG9qdJLptqrh9nfBs72n9GbmcjTwdSJto6bGEjGBBg2");

#[program]
pub mod crowdfunding {
    use super::*;

    pub fn create(ctx: Context<Create>, name:String, description:String) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;
        campaign.name = name;
        campaign.description = description;
        campaign.amount_donated = 0;
        campaign.admin = *ctx.accounts.user.key; // admin will be who has create the campaign
        Ok(())
    }

    // in this function we have to withdraw the amount from the campaign account and add to the user that want to withdraw
     pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;
        let user = &mut ctx.accounts.user;

        require!(campaign.admin != *user.key, CampaignError::Unauthorized);

        let rent_balance = Rent::get()?.minimum_balance(campaign.to_account_info().data_len());

        require!(
            **campaign.to_account_info().lamports.borrow() - rent_balance >= amount,
            CampaignError::InsufficientFunds
        );

        **campaign.to_account_info().try_borrow_mut_lamports()? -= amount;
        **user.to_account_info().try_borrow_mut_lamports()? += amount;

        Ok(())
    }

    // in this function we will transfer the amount from the user account to the campaign account
    //In the Donate function the way we will the transfer the funds will be different from the way did in the withdraw function
    // we need to start by creating a system instruction

    // in this function we build a transfer instruction from the user's wallet to the campaign account
    // Solana knows the user gave permission because the user is marked as a Signer
    // This means the user must sign the transaction in their wallet (like Phantom)
    // If the user doesn’t sign, the program will not be able to execute the transfer
    // invoke() will only work if the user account matches the signer and is authorized

    pub fn donate(ctx:Context<Donate>, amount: u64) -> Result<()> {
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.user.key(), // from account
            &ctx.accounts.campaign.key(), // account
            amount // lamports
        );
        anchor_lang::solana_program::program::invoke(
            &ix, // instruction
            // both user and campaign account info
            &[
                ctx.accounts.user.to_account_info(),
                ctx.accounts.campaign.to_account_info(),
            ]
        );
        (&mut  ctx.accounts.campaign).amount_donated += amount;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Create<'info> {
    // to make a program PDA(program derive access) we need to pass seed
    // Using seeds Solana will use a hash function to determine the address of a new program derive account.
    #[account(init, payer = user,
        space = 8 + 32 + 4 + 100 + 4 + 200 + 8,
        seeds=[b"CAMPAIGN".as_ref(), user.key().as_ref()],
        bump
    )]
    pub campaign: Account<'info, Campaign>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    pub campaign: Account<'info, Campaign>,
    #[account(mut)]
    pub user: Signer<'info>
}

#[derive(Accounts)]
pub struct Donate<'info> {
    pub campaign: Account<'info, Campaign>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>
}

#[account]
pub struct Campaign{
    pub admin: Pubkey,
    pub name: String,
    pub description: String,
    pub amount_donated: u64,
}

#[error_code]
pub enum CampaignError {
    #[msg("Only the admin can withdraw from this campaign.")]
    Unauthorized,

    #[msg("Not enough funds to withdraw.")]
    InsufficientFunds,
}