import Web3 from "web3";
//const logger = require('../service/logger')();
//import Logger from "../service/logger";

/*
// This function detects most providers injected at window.ethereum
import detectEthereumProvider from '@metamask/detect-provider';
const provider = await detectEthereumProvider();
if (provider) {
  // From now on, this should always be true:
  // provider === window.ethereum
  startApp(provider); // initialize your app
} else {
  console.log('Please install MetaMask!');
}
*/

const loadInjected = (logger, chainChangedCallback, accountChangedCallback) => 
  new Promise((resolve, reject) => {
    //const logger = new Logger();
    //const { logger } = context;
    logger.log('debug', 'loadInjected.start', '');
    window.addEventListener("load", async () => {
    //const runAsync = async () => {

      //console.log('3.2 injected on load ...');

      let web3 = undefined;
      let ethereum = undefined;

      // Modern dapp browsers...
      if (window.ethereum) {
        window.ethereum.autoRefreshOnNetworkChange = false;
        try {
          // Request account access if needed
          // Acccounts now exposed
          //await window.ethereum.enable();
          //const accounts = await window.ethereum.send('eth_requestAccounts');
          // window.web3
          //const accounts = web3.eth.accounts;

          // window.ethereum
          //const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          //console.log(accounts);
          ethereum = window.ethereum;

          // Do this:
          ethereum.on('chainChanged', (networkHexId) => {
            /* handle the chainId */
            //ethereum = window.ethereum;
            //web3 = new Web3(ethereum);
            const networkId = web3.utils.hexToNumberString(networkHexId);
            logger.log('debug', 'chainChanged', {
              wallet: 'injected',
              networkId: networkId,
            })
            chainChangedCallback({ web3, networkId, ethereum, walletType: 'injected' });
          });
          
          ethereum.on('accountsChanged', (accounts) => {
            // Handle the new accounts, or lack thereof.
            // "accounts" will always be an array, but it can be empty.
            logger.log('debug', 'accountsChanged', {
              wallet: 'injected',
              accounts: accounts,
            })
            accountChangedCallback(accounts);
          });

          //ethereum.on('disconnect', h

          //ethereum.isConnected(): 
          web3 = new Web3(ethereum);

          logger.log('debug', 'loadInjected.ethereum', {
            ethereum, web3
          })
  
        } catch (err) {
          //reject(error);
          logger.log('error', 'ethereum.enable', err)
        }
      // Legacy dapp browsers...
      } else if (window.web3) {
        web3 = window.web3;
        logger.log('debug', 'loadInjected.web3', {
          web3
        })
      // Legacy dapp browsers...
      } else if (window.Web3) {
        web3 = window.Web3;
        logger.log('debug', 'loadInjected.web3', {
          web3
        })
      } else {
        //const provider = new Web3.providers.HttpProvider(process.env.NATIVE_PROVIDER);
        //web3.current = new Web3(process.env.NATIVE_PROVIDER);
        logger.log('debug', 'no Web3 injected', {
          info: 'No web3 instance injected'
        })
      }

      if (web3 !== undefined && web3.eth && web3.eth.net) {
        web3.eth.net.getId().then(networkId => 
          resolve({ web3, ethereum, networkId: networkId.toString(), walletType: 'injected' })
        );
      }
    });
    //runAsync();
  });

export default loadInjected;
