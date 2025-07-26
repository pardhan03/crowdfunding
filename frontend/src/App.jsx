import { useEffect, useState } from 'react'
import './App.css'

const App = () => {
  const [walletAddress, setWalletAddress] = useState(null)

const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window
      if (solana) {
        if(solana?.isPhantom){
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

  const renderNotConnectedContainer = () => (
    <button onClick={connectWallet}>Connect to Wallet</button>
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
    </div>
  )
}

export default App
