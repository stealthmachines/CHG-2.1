import React, { useState, useEffect, useCallback } from 'react';
import { getNetworkName } from './wallets/utils';
import { BrowserRouter as Router, Route, Switch, Redirect } from "react-router-dom";
// import { GoogleApiWrapper } from 'google-maps-react';

import { Home } from "./pages/Home";
import { Bridge } from "./pages/Bridge";
import { Service } from "./pages/Service";
import { Market } from "./pages/Market";
import { Setup } from "./pages/Setup";
import { Stats } from "./pages/Stats";
import { Explorer } from "./pages/Explorer";
import { Affiliate } from "./pages/Affiliate";
import Register from "./pages/Register";

//import { SignModal } from "./components/SignModal"

import loadNetworks, { initChain } from "./loadNetworks";

import loadInjected from "./wallets/loadInjected";

import loadPortis from "./wallets/loadPortis";
import loadWalletLink from "./wallets/loadWalletLink";
import loadFortmatic from "./wallets/loadFortmatic";
import loadTorus from "./wallets/loadTorus";

import AppContext from "./context/AppContext";
import config from "./app.config.json";

import Logger from "./service/logger";
// import WsClient from "./service/ws-client";

// import "./App.css";
const LOS_ANGELES_CENTER = [34.0522, -118.2437];

const loadProvider = {
    injected: loadInjected,
    portis: loadPortis,
    torus: loadTorus,
    fortmatic: loadFortmatic,
    walletLink: loadWalletLink,
}

const supportedNetworks = process.env.REACT_APP_SUPPORTED_NETWORKS.split(',');

const App = (props) => {

    const [context, setContext] = useState({
        currentProvider: null,
        registeredNodes: {},
        geolocation: LOS_ANGELES_CENTER, // initial geo location
        logger: new Logger(),
        // wsClient: new WsClient(),
        rates: {},
        balances: {},
        services: {
            0: 'Charg',
            1: 'Parking',
            2: 'Wifi'
        },
        walletTypes: [{ 
            type: '', name: 'Not connected', networks: []
        }, {
            type: 'walletlink', name: 'Coinbase Wallet', networks: supportedNetworks // TODO .env wallet specific
        }, {
            type: 'portis', name: 'Portis Wallet', networks: supportedNetworks
        }, { 
            type: 'fortmatic', name: 'Fortmatic Wallet', networks: supportedNetworks
        }, { 
            type: 'torus', name: 'Torus Wallet', networks: supportedNetworks
        }],
        desiredNetworkId: process.env.REACT_APP_ERC20_NETWORK_ID,
        currentNetworkId: process.env.REACT_APP_ERC20_NETWORK_ID,
        currentNetworkName: '',
        desiredWalletType: '',
        currentWalletType: '',
    });

    const { logger, currentProvider, currentWalletType, desiredWalletType, networks, defaultAccount, desiredNetworkId, currentNetworkId, injected } = context;

    const updateWeb3Provider = useCallback( async (web3ProviderName) => {
        try {
            const web3Provider = await loadProvider[web3ProviderName](networks[desiredNetworkId]);
            const withContracts = await initChain(web3Provider);
            const { networkId, walletType } = web3Provider;
            setContext(_context => ({
                ..._context,
                currentProvider: withContracts,
                currentWalletType: walletType,
                desiredWalletType: walletType,
                currentNetworkId: networkId,
                desiredNetworkId: networkId,
                currentNetworkName: getNetworkName(networkId)
            }));
        } catch (err) {
            logger.log('error', 'updateProvider-' + web3ProviderName, err)
            setContext(_context => ({
              ..._context,
                desiredWalletType: _context.currentWalletType,
                desiredNetworkId: _context.currentNetworkId || _context.desiredNetworkId,
            }));
        }
    }, [desiredNetworkId, logger, networks]);

    const updateInjectedWeb3Provider = useCallback( async () => {
        // switch network
        // to 0x hex first
        if (desiredNetworkId !== currentNetworkId) {
            const chainIdHex = '0x' + Number(desiredNetworkId).toString(16);
            const { ethereum } = injected;
            try {
                await ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: chainIdHex }],
                });
            } catch (switchError) {
                // This error code indicates that the chain has not been added to MetaMask.
                if (switchError.code === 4902) {
                    try {
                        const { networkName, symbol, httpProvider, explorer } = config.networks[desiredNetworkId];
                        await ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [{
                                chainId: chainIdHex,
                                chainName: networkName,
                                nativeCurrency: {
                                    name: symbol,
                                    symbol: symbol, // 2-6 characters long
                                    decimals: 18
                                },
                                rpcUrls: [httpProvider],
                                blockExplorerUrls: [explorer]
                                //iconUrls: [] // Currently ignored.
                            }]
                        });
                    } catch (err) {
                        logger.log('error', 'wallet_addEthereumChain', err);
                    }
                } else {
                    logger.log('error', 'wallet_switchEthereumChain', switchError);
                    if (currentWalletType === 'injected') {
                        setContext(_context => ({
                            ..._context,
                            desiredNetworkId: _context.currentNetworkId
                        }))
                    }
                }
            }
        } else if (currentWalletType === 'injected') {
            /*
            initChain({ ...injected }).then(injected =>
                setContext(_context => ({
                    ..._context,
                    currentProvider: injected,
                    currentWalletType: 'injected',
                    desiredWalletType: 'injected',
                    currentNetworkId: injected.networkId,
                    desiredNetworkId: injected.networkId,
                    currentNetworkName: getNetworkName(injected.networkId)
                }))
            ).catch(err => {
                logger.log('error', 'initChain.injected', err)
            });
            */
        }
    }, [injected, currentNetworkId, currentWalletType, desiredNetworkId, logger]);

    const chainChangedCallback = useCallback(({ web3, networkId, ethereum }) => {
        logger.log('debug', 'chainChangedCallback', {
            networkId, web3, ethereum
        })
        const walletType = 'injected';
        initChain({ web3, networkId, ethereum, walletType }).then(withContracts =>
            setContext(_context => ({
                ..._context,
                currentProvider: withContracts,
                currentWalletType: 'injected',
                desiredWalletType: 'injected',
                currentNetworkId: networkId,
                desiredNetworkId: networkId,
                currentNetworkName: getNetworkName(networkId)
            }))
        ).catch(err => {
            logger.log('error', 'initChain.injected', err)
        });
    }, [logger]);
    
    const accountChangedCallback = useCallback( (accounts) => {
        // another wallet can be selected, so we can't set accounts
        //if (currentWalletType === 'injected') {
            if (accounts && accounts.length > 0) {
                //setContext(_context => ({ ..._context, defaultAccount: accounts[0].toLowerCase() }));
                setContext(_context => ({ ..._context, defaultAccount: accounts[0] }));
            }
            //const injected = { ...context.injected };
            //setContext(_context => ({ ..._context, injected, current: injected }))
        //}
    }, []);

    useEffect(() => {
        // load networks from env config
        loadNetworks().then(_networks => {
            //logger.log('debug', 'loadNetworks', {
            //    networks
            //})
            // collect registered nodes
            let registeredNodes = {};
            for (const networkId in _networks) {
                const { trade } = _networks[networkId];
                if (trade && trade.registeredNodes) {
                    registeredNodes = { ...registeredNodes, ...trade.registeredNodes };
                }
            }
            setContext(_context => ({ ..._context, networks: _networks, registeredNodes }));
        }).finally (() => {
            // Load other networks
            //logger.log('debug', 'loadNetworks.finally');
        });
    },[]);

    useEffect(() => {
        // try to load injected on start
        loadInjected(logger, chainChangedCallback, accountChangedCallback).then(loadedInjected => {
            let walletName = 'Injected Wallet';
            if (loadedInjected.ethereum.isMetaMask) {
                walletName = 'Metamask Wallet';
            } else if (loadedInjected.ethereum.isWalletLink) {
                walletName = 'Coinbase Wallet';
            }
            initChain(loadedInjected).then(withContracts =>
                setContext(_context => {
                    const newContext = { ..._context, injected: withContracts };
                    if (!_context.walletTypes.find(wt => wt.type === 'injected')) {
                        newContext.walletTypes = [
                            ..._context.walletTypes.filter(wt => wt.type !== '' && wt.name !== walletName),
                            { type: 'injected', name: walletName, networks: supportedNetworks }
                        ];
                        if (!_context.currentWalletType) {
                            newContext.currentProvider = withContracts;
                            newContext.currentWalletType = 'injected';
                            newContext.desiredWalletType = 'injected';
                            newContext.currentNetworkId = withContracts.networkId;
                            newContext.desiredNetworkId = withContracts.networkId;
                            newContext.currentNetworkName = getNetworkName(withContracts.networkId);
                        }
                    }
                    return newContext;
                })
            ).catch( err => {
                logger.log('error', 'loadInjected.initChain', err);
            });
        }).catch (err => {
            logger.log('error', 'loadInjected', err);
        }).finally (() => {
            logger.log('debug', 'loadInjected.finally');
        });

        const loader = document.querySelector(".loader-container");
        if (loader) {
            loader.remove();
        }
    },[chainChangedCallback, accountChangedCallback, logger]);

    useEffect(() => {
        if (!currentProvider || !currentProvider.web3.eth) return;
        const getAccounts = async () => {
            try {
                const accounts = await currentProvider.web3.eth.getAccounts();
                logger.log('debug', 'getAccounts.web3', {
                    accounts
                })
                if (accounts && accounts.length > 0) {
                    setContext(_context => ({ ..._context, defaultAccount: accounts[0] }));
                } else if (currentProvider.ethereum) {
                    const accounts = await currentProvider.ethereum.enable();
                    logger.log('debug', 'getAccounts.ethereum', {
                        accounts
                    })
                    if (accounts && accounts.length > 0) {
                        setContext(_context => ({ ..._context, defaultAccount: accounts[0] }));
                    }
                } else {
                    const accounts = currentProvider.eth.accounts;
                    logger.log('debug', 'getAccounts.eth', {
                        accounts
                    })
                    if (accounts && accounts.length > 0) {
                        setContext(_context => ({ ..._context, defaultAccount: accounts[0] }));
                    }
                }
            } catch (err) {
                logger.log('error', 'getAccounts', err)
            };
        };
        getAccounts();
    }, [currentProvider, logger]);

    
    useEffect(() => {
        const needChangeNet = desiredNetworkId !== currentNetworkId;
        const needChangeWallet = desiredWalletType !== currentWalletType;

        logger.log('debug', 'walletChange', {
            currentWalletType,
            desiredWalletType,
            currentNetworkId,
            desiredNetworkId,
        })

        if (needChangeWallet || needChangeNet) {
            if (desiredWalletType === 'injected') {
                updateInjectedWeb3Provider();
            } else {
                updateWeb3Provider(desiredWalletType);
            }
        }
    }, [desiredNetworkId, currentNetworkId, currentWalletType, desiredWalletType, logger, updateInjectedWeb3Provider, updateWeb3Provider]);

    useEffect(() => {
        // account changed
        if (!defaultAccount || !networks) return;
        const getBalances = async () => {
            // read balances
            for (const networkId in networks) {
                const { web3, networkName, symbol, chgTokenInstance, chargContract } = networks[networkId];

                const balances = { networkId, networkName, symbol };
                const isNativeNet = networkId === process.env.REACT_APP_NATIVE_NETWORK_ID;
                const isERC20Net = networkId === process.env.REACT_APP_ERC20_NETWORK_ID;
                try {
                    if (isNativeNet) {
                        // Native POA Charg Token
                        balances.chgWei = await web3.eth.getBalance(defaultAccount);
                        balances.ethWei = ''; // charg coin is base here
                        const chg = Number(web3.utils.fromWei(balances.chgWei, 'ether'));
                        balances.chg = chg > 0 ? chg.toFixed(1) : '0';
                        balances.eth = '';
                        balances.ethDeposit = ''; // no trade on native
                        balances.chgDeposit = '';
                    } else if (isERC20Net) {
                        // Original ERC20 CHG token
                        try {
                            const [ ethWei, chgWei, allowance, ethDepositWei, chgDepositWei ] = await Promise.all([
                                web3.eth.getBalance(defaultAccount),
                                chgTokenInstance.methods.balanceOf(defaultAccount).call(),
                                chgTokenInstance.methods.allowance(defaultAccount, chargContract._address).call(),
                                chargContract.methods.ethBalance(defaultAccount).call(),
                                chargContract.methods.coinBalance(defaultAccount).call()
                            ]);
                            balances.ethWei = ethWei;
                            const eth = Number(web3.utils.fromWei(balances.ethWei, 'ether'));
                            balances.eth = eth > 0 ? eth.toFixed(3) : '0';

                            balances.chgWei = chgWei;
                            const chg = Number(web3.utils.fromWei(balances.chgWei, 'ether'));
                            balances.chg = chg > 0 ? chg.toFixed(1) : '0';

                            balances.allowance = allowance;

                            balances.ethDepositWei = ethDepositWei;
                            const ethDeposit = Number(web3.utils.fromWei(balances.ethDepositWei, 'ether'));
                            balances.ethDeposit = ethDeposit > 0 ? ethDeposit.toFixed(3) : '';

                            balances.chgDepositWei = chgDepositWei;
                            const chgDeposit = Number(web3.utils.fromWei(balances.chgDepositWei, 'ether'));
                            balances.chgDeposit = chgDeposit > 0 ? chgDeposit.toFixed(1) : '';

                        } catch (err) {
                            logger.log('error', 'getBalances.Promise.all ' + networkId, err);
                        }

                    } else {
                        balances.ethWei = await web3.eth.getBalance(defaultAccount);
                        balances.chgWei = await chargContract.methods.balanceOf(defaultAccount).call();
                        const eth = Number(web3.utils.fromWei(balances.ethWei, 'ether'));
                        const chg = Number(web3.utils.fromWei(balances.chgWei, 'ether'));
                        balances.eth = eth > 0 ? eth.toFixed(3) : '0';
                        balances.chg = chg > 0 ? chg.toFixed(1) : '0';
                        balances.ethDepositWei = await chargContract.methods.ethBalance(defaultAccount).call();
                        const ethDeposit = Number(web3.utils.fromWei(balances.ethDepositWei, 'ether'));
                        balances.ethDeposit = ethDeposit > 0 ? ethDeposit.toFixed(3) : '';
                        balances.chgDeposit = '';
                    }
                    setContext(_context => ({
                        ..._context,
                        balances: {
                            ..._context.balances,
                            [defaultAccount]: {
                                ..._context.balances[defaultAccount],
                                [networkId]: balances
                            }
                        }
                    }));
                } catch (err) {
                    logger.log('error', 'getBalances '+networkId, err);
                }
            }
        }
        getBalances();
    }, [defaultAccount, networks, logger]);

    if ( typeof context === undefined ) {
      return <div>Loading...</div>;
    }

    return (
      <div className="App">
        <AppContext.Provider value={[context, setContext]}>
            <Router>
            <Switch>
                <Route exact path="/" component={Home}/>
                <Route exact path="/bridge" component={Bridge}/>
                <Route exact path="/market" component={Market}/>
                <Route exact path="/exchange" component={Market}/>
                <Route exact path="/stats" component={Stats}/>
                <Route exact path="/explorer" component={Explorer}/>
                <Route exact path="/affiliate" component={Affiliate}/>
                <Route exact path="/register" component={Register}/>
                <Route exact path="/setup" component={Setup}/>
                <Route exact path="/service/:id" component={Service}/>
                <Route exact path="/service/:id/:service_id" component={Service}/>
                <Route exact path="/service/:id/:service_id/:client_id" component={Service}/>
                <Redirect from="*" to="/" />
            </Switch>
            </Router>
        </AppContext.Provider>
      </div>
    );
    
}

export default App;

/*
export default GoogleApiWrapper(
    (props) => ({
      apiKey: process.env.REACT_APP_MAP_KEY // props.apiKey
    }
))(App)
*/