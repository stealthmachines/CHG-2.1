// npm install --save fortmatic
import Fortmatic from 'fortmatic';
// Works for web3 1.0 and pre-1.0 versions
import Web3 from 'web3';
//import config from "../app.config.json";
//const logger = require('../service/logger')();
//import Logger from "../service/logger";

const loadProvider = ({ networkId, providerConf }) =>

  new Promise((resolve, reject) => {
    try {
        //const fm = new Fortmatic(process.env.REACT_APP_FORTMATIC_KEY, 'ropsten');
        let chainConfig;
        switch (networkId) {
            case '3': chainConfig = 'ropsten'; break;
            case '4': chainConfig = 'rinkeby'; break;
            case '5': chainConfig = 'goerli'; break;
            default: 
            chainConfig = {
                    rpcUrl: providerConf,
                    chainId: networkId,
            };
        }
        const fortmatic = new Fortmatic(process.env.REACT_APP_FORTMATIC_KEY, chainConfig);
        const web3 = new Web3(fortmatic.getProvider());
        resolve({ web3, walletType: 'fortmatic', fortmatic });
    } catch (err) {
        //logger.log('error', 'loadFortmatic', err)
        reject(err)
    }
});

export default loadProvider;

// Async functions that triggers login modal, if user not already logged in
/*
web3.currentProvider.isFortmatic 

web3.eth.getAccounts((error, accounts) => {
    if (error) throw error;
    console.log(accounts); // ['0x...']
});
*/
/*
Refused to connect to 
'wss://ropsten.infura.io/ws/v3/ad4910185a7c4e69bdf478a50b105416' 
because it violates the following Content Security Policy directive: 
"connect-src 'self' http://127.0.0.1:* 
https://rpc.fuse.io/ https://*.quiknode.pro/ https://sidechain-test.morpher.com/ 
https://connect.pichain.io https://*.elaeth.io/ 
https://core.bloxberg.org/ https://*.matic.today/ 
https://*.matic.network/ https://*.skalenodes.com:*
https://sidechain.morpher.com/ http://localhost:*
https://*.fortmatic.com/ https://api.segment.io/ 
https://api.amplitude.com/ https://api.rollbar.com/ 
https://cognito.us-west-2.amazonaws.com/ 
https://kms.us-west-2.amazonaws.com/ 
https://*.infura.io/ 
https://cognito-identity.us-west-2.amazonaws.com/ 
https://*.alchemyapi.io/ 
https://www.google-analytics.com/ 
https://api.moonpay.io/ https://beefledgerwallet.com/ 
https://node-mainnet.rarible.com/ 
https://node-ropsten.rarible.com/ 
https://kovan2.arbitrum.io/ 
https://bsc-dataseed.binance.org/ 
https://data-seed-prebsc-1-s1.binance.org:8545/ 
https://sokol.poa.network/ https://rpc.xdaichain.com/ 
https://api.moonpay.com https://rpc-mainnet.maticvigil.com 
https://testnet2.matic.network https://alpha.ethereum.matic.network 
https://rpc-mumbai.matic.today https://rpc-mainnet.matic.network 
https://rpc-mainnet.maticvigil.com/v1/0df9f3ce1a0a2ae7273814360d18ed041149d518 
https://rpc-mumbai.maticvigil.com/v1/0df9f3ce1a0a2ae7273814360d18ed041149d518 
https://matic-mainnet--jsonrpc.datahub.figment.io/apikey/73088fa3ab15c735a4efb389a05ebdfc 
https://public-node.testnet.rsk.co https://public-nodes.rsk.co".
*/



/*
const BSCOptions = {
      rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/', 
      chainId: 97 // Smart Chain - Testnet chain id
    }
    // Setting network to Smart Chain - Testnet
    const fm = new Fortmatic('YOUR_TEST_API_KEY', BSCOptions);
*/