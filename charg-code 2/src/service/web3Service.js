import Web3 from "web3";
import { useState, useEffect } from 'react';

export const web3Service = () => {
    /*
    const [currentProvider, setCurrentProvider] = useState(process.env.NATIVE_PROVIDER);
    const [nativeProvider, setNativeProvider] = useState(process.env.NATIVE_PROVIDER);
    */
    console.log('start web3Service');

    const [current, setCurrent] = useState({});
    const [native, setNative] = useState({});
    const [erc20, setERC20] = useState({});
    
    const [providers, setProviders] = useState({
        current: process.env.NATIVE_PROVIDER,
        native: process.env.NATIVE_PROVIDER,
        erc20: process.env.ERC20_PROVIDER
    });

	useEffect(() => {
        const nativeWeb3 = new Web3(providers.native);
        setNative(nativeWeb3);

        const erc20Web3 = new Web3(providers.erc20);
        setERC20(erc20Web3);

        const init = async() => {
            const web3 = await getCurrentWeb3();
            setCurrent(web3);
        }
		init();
	},[]);

  const getCurrentWeb3 = () => new Promise((resolve, reject) => {
      // Wait for loading completion to avoid race conditions with web3 injection timing.
      window.addEventListener("load", async () => {
        // Modern dapp browsers...
        if (window.ethereum) {
          window.ethereum.autoRefreshOnNetworkChange = false;
          const web3 = new Web3(window.ethereum);
          try {
            // Request account access if needed
            await window.ethereum.enable();
            // Acccounts now exposed
            resolve(web3);
          } catch (error) {
            reject(error);
          }
        } else if (window.web3) {
            // Use Mist/MetaMask's provider.
            const web3 = window.web3;
            console.log("Injected web3 detected.");
            resolve(web3);
        } else { 
            // light wallet ?
            //const provider = new Web3.providers.HttpProvider(providers.current);
            //const web3 = new Web3(provider);
            const web3 = new Web3(providers.current);
            console.log("No web3 instance injected, using Native web3.");
            resolve(web3);
        }
      });
    });
}