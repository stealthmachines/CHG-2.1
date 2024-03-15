import WalletLink from 'walletlink'
import Web3 from 'web3';
// const logger = require('../service/logger')();
// import Logger from "../service/logger";
// const logger = new Logger();

const APP_NAME = process.env.REACT_APP_NAME;
const APP_LOGO_URL = 'https://chgcoin.org/charg-coin.png';

const loadProvider = ({ networkId, providerConf }) =>
  new Promise((resolve, reject) => {
    try {
        // console.log('load WalletLink for networkId', networkId, httpProvider)
        // Initialize WalletLink
        const walletLink = new WalletLink({
          appName: APP_NAME,
          appLogoUrl: APP_LOGO_URL,
          darkMode: true
        })
        //console.log(walletLink)
        // Initialize a Web3 Provider object
        const ethereum = walletLink.makeWeb3Provider(providerConf, networkId)
        //console.log(ethereum)
        
        if (!ethereum.isWalletLink) {
          throw new Error('Failed to connect!');
        };
  
        // Initialize a Web3 object
        const web3 = new Web3(ethereum)
        resolve({ web3, ethereum, walletType: 'walletlink' });
    } catch (err) {
      // logger.log('error', 'loadCoinbase', err)
      reject(err)
    }
});

export default loadProvider;