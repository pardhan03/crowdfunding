import { useEffect, useState } from 'react'
import './App.css'
import idl from './idl.json'
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js'
import { AnchorProvider, Program, web3, utils, BN } from '@coral-xyz/anchor'

const programID = new PublicKey(idl.metadata?.address);
const network = clusterApiUrl('devnet');
const opts = {
  preflightCommitment: 'processed'
};

const { SystemProgram } = web3;

const App = () => {
  const [walletAddress, setWalletAddress] = useState(null)
  const [campaigns, setCampaigns] = useState([])

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new AnchorProvider(
      connection,
      window.solana,
      opts.preflightCommitment
    );
    return provider;
  }

  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window
      if (solana) {
        if (solana?.isPhantom) {
          const res = await solana.connect({ onlyIfTrusted: true });
          console.log(`Connected with Public Key: ${res.publicKey.toString()}`);
          setWalletAddress(res.publicKey.toString());
        }
      } else {
        alert('Solana object not found! Get a Phantom wallet');
      }
    } catch (error) {
      console.log(error)
    }
  }

  const connectWallet = async () => {
    const { solana } = window;
    if (solana) {
      try {
        const res = await solana.connect();
        console.log('Wallet connected:', res.publicKey.toString());
        setWalletAddress(res.publicKey.toString());
      } catch (err) {
        console.error('User rejected connection:', err);
      }
    }
  }

  const getAllCampaigns = async() => {
    try {
      const connection = new Connection(network, opts.preflightCommitment);
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      (await Promise.all(await connection.getProgramAccounts(programID))).map(async (campaign) => ({
        ... (await program.account.campaign.fetch(campaign.pubkey)),
        pubkey: campaign.pubkey
      })).then((campaigns) => {
        setCampaigns(campaigns)
      })
    } catch (error) {
      console.log(error)
    }
  }

  const createCampaign = async() =>{
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const [campaign] = await PublicKey.findProgramAddressSync(
        [
          utils.bytes.utf8.encode('CAMPAIGN_DEMO'),
          program?.wallet?.publicKey.toBuffer(),
        ],
        program.programId
      )
      await program.rpc.create('campaing name', 'campain description',{
        accounts: {
          campaign,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        }
      })
      console.log(`Created a new campaing w/ address: ${campaign.toString()}`)
    } catch (error) {
      console.log(`Error creating campaign Account:${error}`)
    }
  }

  const donate = async (publicKey) =>{
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);

      await program.rpc.donate( new BN(0.2 * web3.LAMPORTS_PER_SOL),{accounts: {
          campaign: publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        }})
      console.log('Successfully Donated');
      getAllCampaigns()
    } catch (error) {
      console.log(`Error donating: ${error}`)
    }
  }

  const withdraw = async (publicKey) => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);

      await program.rpc.withdraw( new BN(0.2 * web3.LAMPORTS_PER_SOL),{accounts: {
          campaign: publicKey,
          user: provider.wallet.publicKey,
        }})
      console.log('Successfully Withdraw');
      getAllCampaigns()
    } catch (error) {
      console.log(`Error Withdrawing: ${error}`)
    }
  }

  const renderNotConnectedContainer = () => (
    <button onClick={connectWallet}>Connect to Wallet</button>
  )

  const renderConnectedContainer = () => (
    <div>
      <button onClick={createCampaign}>Creat a Campaign</button>
      <button onClick={getAllCampaigns}>Get All Campaigns...</button>
      <br/>
      {
        campaigns.map((campaign)=>(
          <div>
            <p>Campaign ID:{campaign.pubkey.toString()}</p>
            <p>Balance: {(campaign?.amount_donated/ web3.LAMPORTS_PER_SOL).toString()}</p>
            <p>{campaign?.name}</p>
            <p>{campaign?.description}</p>
            <button onClick={() => donate(campaign?.pubkey)}>Donate</button>
            <button onClick={() => withdraw(campaign?.pubkey)}>Withdraw</button>
            <br/>
          </div>
        ))
      }
    </div>
  )

  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected();
    }
    window.addEventListener('load', onLoad);

    return () => {
      window.removeEventListener('load', onLoad)
    }
  }, []);

  return (
    <div>
      {!walletAddress && renderNotConnectedContainer()}
      {walletAddress && renderConnectedContainer()}
    </div>
  )
}

export default App
