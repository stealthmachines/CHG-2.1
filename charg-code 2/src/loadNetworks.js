import net from 'net';
import Web3 from 'web3';
//import { getNetworkName } from './wallets/utils';
import config from "./app.config.json";

/*
import ChargCoinServiceContract from "./contracts/NativeTokenBridge.json";
import AnyChgCoinServiceContract from "./contracts/EthERC20TokenBridge.json";
import AnyChgCoinServiceContract from "./contracts/ChargCoinContract.json";
//import AnyChgCoinServiceContract from "./contracts/EthERC20ChargService.json";
import AnyChgCoinServiceContract from "./contracts/ChargService.json";
*/
import ChargCoinContract from './contracts/ChargCoinContract.json';
import EthChgCoinServiceContract from './contracts/EthChgCoinService.json';
import ChargCoinServiceContract from './contracts/ChargCoinService.json';
import AnyChgCoinServiceContract from './contracts/AnyChgCoinService.json';

import loadOrdersTables from './wallets/loadOrdersTables';

const apiUrl = process.env.REACT_APP_API_URL;

const fetchOptions = {
  method: 'POST', // *GET, POST, PUT, DELETE, etc.
  mode: 'cors', // no-cors, cors, *same-origin
  cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
  credentials: 'same-origin', // include, *same-origin, omit
  headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json' 
  },
  redirect: 'follow', // manual, *follow, error
  referrer: 'no-referrer', // no-referrer, *client
}

//const logger = require('./service/logger')();
//import Logger from "./service/logger";
//const logger = new Logger();


export const initChain = async (chain) => {
  //logger.log('debug', 'initChain.start', {
  //  ...chain
  //});
  const supportedNetworks = process.env.REACT_APP_SUPPORTED_NETWORKS.split(',');
  if (process.env.REACT_APP_DEBUG_LEVEL > 8) {
    console.log('initChain.start', { ...chain });
  }
  chain.initCount = chain.initCount + 1;
  if (!chain.web3) {
    chain.web3 = new Web3(chain.providerConf, net);
  }
  if (!chain.networkId) {
    const networkId = await chain.web3.eth.net.getId();
    chain.networkId = networkId.toString();
    if (chain.networkId !== chain.networkIdEnv) {
      if (process.env.REACT_APP_DEBUG_LEVEL > 1) {
        console.error('Wrong environment: web3.eth.net.getId() <> networkIdEnv', chain.networkId, chain.networkIdEnv);
      }
    }
  }
  const { networkName, symbol, explorer } = config.networks[chain.networkId] || {};
  chain.networkName = networkName || 'Unknown ' + chain.networkId;
  chain.symbol = symbol || '???';
  chain.explorer = explorer || '';
  const isNativeNet = chain.networkId === process.env.REACT_APP_NATIVE_NETWORK_ID;
  const isERC20Net = chain.networkId === process.env.REACT_APP_ERC20_NETWORK_ID;

  //if (!supportedNetworks.includes(chain.networkId)) {
    //logger.log('error', 'notSupportedChain', {
    //  message: 'Not supported network: ' + chain.networkId + '  ' + chain.networkName
    //})
    //throw new Error('Not supported network: ' + chain.networkId);
    //return;
  //}

  //console.log('initChain', chain.networkId);
  if (isNativeNet) {
    // Native POA Charg Token
    chain.chargContractDeployed = ChargCoinServiceContract.networks[chain.networkId];
    //console.log(ChargCoinServiceContract.networks) 
    chain.chargContract = new chain.web3.eth.Contract(
      ChargCoinServiceContract.abi,
      chain.chargContractDeployed && chain.chargContractDeployed.address,
    );
    //chain.bridgeBalance = await chain.web3.eth.getBalance(chain.chargContractDeployed.address);
    //chain.web3.eth.getBalance(chain.chargContractDeployed.address).then(balance => chain.bridgeBalance = balance);
  } else if (isERC20Net) {
    // Original ERC20 CHG token
    const chgTokenDeployed = ChargCoinContract.networks[chain.networkId];
    chain.chgTokenInstance = new chain.web3.eth.Contract(
      ChargCoinContract.abi,
      chgTokenDeployed && chgTokenDeployed.address,
    );
    //console.log( "ERC20 Token addr", chain.chgTokenInstance._address);
    // Bridge/Service on ethereum
    chain.chargContractDeployed = EthChgCoinServiceContract.networks[chain.networkId];
    chain.chargContract = new chain.web3.eth.Contract(
      EthChgCoinServiceContract.abi,
      chain.chargContractDeployed && chain.chargContractDeployed.address,
    );
    //console.log("ERC20 Bridge/Service", chain.networkId, chain.chargContractDeployed.address);
    //chain.bridgeBalance = await chain.chgTokenInstance.methods.balanceOf(chain.chargContractDeployed.address).call();
    //chain.chgTokenInstance.methods.balanceOf(chain.chargContractDeployed.address).call().then(balance => chain.bridgeBalance = balance);
    // loadOrdersTables(chain).then(trade => chain.trade = trade);
  } else if (supportedNetworks.includes(chain.networkId)) {
    // BSC, Fusion and others
    chain.chargContractDeployed = AnyChgCoinServiceContract.networks[chain.networkId];
    chain.chargContract = new chain.web3.eth.Contract(
      AnyChgCoinServiceContract.abi,
      chain.chargContractDeployed && chain.chargContractDeployed.address,
    );
    //console.log("Any Bridge/Service", chain.networkId, chain.chargContractDeployed.address);
    //chain.bridgeBalance = await chain.chargContract.methods.totalSupply().call();
    //chain.chargContract.methods.totalSupply().call().then(balance => chain.bridgeBalance = balance);
    // loadOrdersTables(chain).then(trade => chain.trade = trade);
  }
  if (supportedNetworks.includes(chain.networkId)) {
    try {
      let response = await fetch(apiUrl, {
        ...fetchOptions,
        body: JSON.stringify({
          method: 'getOrders',
          data: { networkId: chain.networkId }
        })
      });
      if (!response.ok) {
        throw new Error('Failed to fetch getOrders.');
      }
      response = await response.json();
      //console.log(response.result)
      if (response.result) {
        chain.trade = response.result;
      }
      /* todo: resolve from api first and then update with chain data
      const fromChain = await loadOrdersTables(chain);
      if (fromChain.buyOrders) {
        chain.trade.buyOrders = {...chain.trade.buyOrders, ...fromChain.buyOrders};
      }
      if (fromChain.sellOrders) {
        chain.trade.sellOrders = {...chain.trade.sellOrders, ...fromChain.sellOrders};
      }
      if (fromChain.registeredNodes) {
        chain.trade.registeredNodes = {...chain.trade.registeredNodes, ...fromChain.registeredNodes};
      }
      */
    } catch (err) {
      if (process.env.REACT_APP_DEBUG_LEVEL > 1) {
        console.error('fetch ordersTables error: '+chain.networkId, err);
      }
    }

    if (!chain.trade) {
      try {
        chain.trade = await loadOrdersTables(chain);
      } catch (err) {
        if (process.env.REACT_APP_DEBUG_LEVEL > 1) {
          console.error('loadOrdersTables error: '+chain.networkId, err);
        }
      }
    }

    try {
      const contractNetworkId = await chain.chargContract.methods.networkId().call();
      if (contractNetworkId !== chain.networkId) {
        if (process.env.REACT_APP_DEBUG_LEVEL > 1) {
          console.error('Wrong network id deployed: '+ contractNetworkId+ ' != ' +chain.networkId + '  ' + chain.name);
        }
        //logger.log('error', 'wrongIdDeployed', {
        //  message: 'Wrong network id deployed: '+ contractNetworkId+ ' != ' +chain.networkId + '  ' + chain.name
        //})
      }
    } catch (err) {
      if (process.env.REACT_APP_DEBUG_LEVEL > 1) {
        console.error('Get Network Id '+chain.networkId, err);
      }
    }
  }
  //console.log('initChain.end', { ...chain });
  return chain;
}

const loadNetworks = () => new Promise((resolve, reject) => {
    const chainPromises = [];
    //const provider = new Web3.providers.HttpProvider(process.env.NATIVE_PROVIDER);
    // window.addEventListener("load", async () => {
      const networks = {};
      process.env.REACT_APP_SUPPORTED_NETWORKS.split(',').forEach(networkIdEnv => {
        const providerConf = process.env[`REACT_APP_CHAIN_${networkIdEnv}`];
        //console.log(i, process.env[`REACT_APP_CHAIN_${i}_PROVIDER`])
        if (!providerConf) {
          console.error('No provider', networkIdEnv);
          return;
        };
        try {
          const chain = {};
          chain.providerConf = providerConf;
          chain.networkIdEnv = networkIdEnv;
          chain.fromBlock = process.env[`REACT_APP_CHAIN_${networkIdEnv}_FROM_BLOCK`]  || 1;
          chain.gasPrice = process.env[`REACT_APP_CHAIN_${networkIdEnv}_GAS_PRICE`]  || 10000000000;
          chain.initCount = 0;
          chainPromises.push(initChain(chain));
        } catch (err) {
          if (process.env.REACT_APP_DEBUG_LEVEL > 1) {
            console.error('loadNetworks initChain', err)
          }
          //logger.log('error', 'getChain', err);
        }
      });

      Promise.all(chainPromises).then(chains => {
        chains.forEach(chain => networks[chain.networkId] = chain);
        //console.log('networks loaded', networks)
        resolve(networks);
      })
  });


export default loadNetworks;
