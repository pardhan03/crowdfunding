use anchor_lang::prelude::*;

declare_id!("788yPDauEbiYAxa217kouXD31zx4rc18qC2xNuSbphbL");

#[program]
pub mod crowdfunding {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
