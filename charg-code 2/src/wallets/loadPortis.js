// npm install @portis/web3
import Portis from '@portis/web3';
import Web3 from 'web3';
//const logger = require('../service/logger')();
//import Logger from "../service/logger";

const loadProvider = ({ networkId, providerConf }) =>
  new Promise((resolve, reject) => {
    try {
        let config;
        switch (networkId) {
            case '3': config = 'ropsten'; break;
            case '4': config = 'rinkeby'; break;
            case '5': config = 'goerli'; break;
            default: 
                config = {
                    nodeUrl: providerConf,
                    chainId: networkId,
                };
        }
        //console.log('load Portis for networkId', config, networkId, httpProvider)
        const portis = new Portis(process.env.REACT_APP_PORTIS_KEY, config);
        const web3 = new Web3(portis.provider);
        resolve({ web3, walletType: 'portis', portis });

    } catch (err) {
        // logger.log('error', 'loadPortis', err)
        reject(err)
    }
});

export default loadProvider;

/*
changeNetwork(newNetwork: string | object, isGasRelayEnabled: ?boolean) => void
portis.changeNetwork('ropsten', true);
const customNode = {
  nodeUrl: 'https://awesomenode.com',
  chainId: 127,
};
portis.changeNetwork(customNode);

onLogin(handler) => void	(walletAddress: string, email: string, reputation: object) => void	Triggers when a user logs in.
onLogout(handler) => void	() => void	Triggers when a user logs out.
onActiveWalletChanged(handler) => void	(newWalletAddress: string) => void	Triggers when a user changes their active wallet.
onError(handler) => void
portis.onLogin((walletAddress, email, reputation) => {
  console.log(walletAddress, email, reputation);
});
portis.onActiveWalletChanged(walletAddress => {
  console.log('Active wallet address:', walletAddress);
});
*/


/*
Network	Description	Default Gas Relay Hub
mainnet	Ethereum - main network	0xD216153c06E857cD7f72665E0aF1d7D82172F494
ropsten	Ethereum - ropsten network	0xD216153c06E857cD7f72665E0aF1d7D82172F494
rinkeby	Ethereum - rinkeby network	0xD216153c06E857cD7f72665E0aF1d7D82172F494
goerli	Ethereum - goerli network	0xD216153c06E857cD7f72665E0aF1d7D82172F494
ubiq	UBQ - main network	-
thundercoreTestnet	TT - test network	-
orchid	RootStock - main network	-
orchidTestnet	RootStock - test network	-
kovan	Ethereum - kovan network	0xD216153c06E857cD7f72665E0aF1d7D82172F494
classic	Ethereum Classic - main network	-
sokol	POA - test network	-
core	POA - main network	-
xdai	xDai - main network	0xD216153c06E857cD7f72665E0aF1d7D82172F494
thundercore	TT - main network	-
fuse	Fuse - main network	-
lightstreams	Lightstreams - main network	-
matic	MATIC - main network	-
maticMumbai	MATIC - mumbai test network	-
maticAlpha	MATIC - alpha network	-
maticTestnet	MATIC - test network	-
*/