import { useEffect, useState } from 'react'
import './App.css'
import idl from './idl.json'
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js'
import { AnchorProvider, Program, web3, utils, BN } from '@coral-xyz/anchor'

const programID = new PublicKey(idl.metadata?.address);
const network = clusterApiUrl('devnet');
const opts = {
  preflightCommitment: 'processes'
};

const { SystemProgram } = web3;

const App = () => {
  const [walletAddress, setWalletAddress] = useState(null)

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

  const renderNotConnectedContainer = () => (
    <button onClick={connectWallet}>Connect to Wallet</button>
  )

  const renderConnectedContainer = () => (
    <button onClick={createCampaign}>Creat a Campaign</button>
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
