// npm i --save @toruslabs/torus-embed
import Torus from "@toruslabs/torus-embed";
import Web3 from "web3";
// const logger = require('../service/logger')();
// import Logger from "../service/logger";

const loadProvider = ({ networkId, providerConf }) => new Promise(async (resolve, reject) => {
    try {
        const torus = new Torus({
            buttonPosition: "top-left", // default: bottom-left
        });
        await torus.init({
            buildEnv: 'production', // default: production
            enableLogging: true, // default: false
            network: {
                host: providerConf, // default: mainnet
                chainId: networkId, // default: 1
                networkName: providerConf, // default: Main Ethereum Network
            },
            showTorusButton: true, // default: true
        });
        // await torus.login(); // 
        await torus.ethereum.enable()
        const web3 = new Web3(torus.provider);
        resolve({ web3, walletType: 'torus', torus });
    } catch (err) {
        //logger.log('error', 'loadTorus', err)
        reject(err)
    }
});

export default loadProvider;

/*
      torus.provider.on('chainChanged', (resp) => {
        console.log(resp, 'chainchanged');
        this.setState({
          chainId: resp,
        });
      });
      torus.provider.on('accountsChanged', (accounts) => {
        console.log(accounts, 'accountsChanged');
        this.setState({
          publicAddress: (Array.isArray(accounts) && accounts[0]) || '',
        });
      });
      const accounts = await web3.eth.getAccounts();
    
  changeProvider = async () => {
    await web3Obj.torus.setProvider({ host: 'mainnet' });
    this.console('finished changing provider');
  }
    await torus.setProvider({
        host: "rinkeby", // default : 'mainnet'
    });
    await torus.setProvider({
        host: "https://ethboston1.skalenodes.com:10062", // mandatory
        chainId: 1, // optional
        networkName: "Skale Network", // optional
    });

  await torus.ethereum.enable(); // does the same thing as `await torus.login();`
  const userInfo = await torus.getUserInfo();
*/