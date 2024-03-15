import React, { useContext, useState, useEffect, useCallback } from "react";
import AppContext from "../context/AppContext";
import { useParams } from "react-router-dom";
import sha256 from 'js-sha256';
import { Header } from "./Header";
import { Footer } from "./Footer";

//import { TransferModal } from "../components/TransferModal"
import { AlertBlock } from "../components/AlertBlock"

import { InputSpinner } from "../components/InputSpinner"
import { QRCodeModal } from "../components/QRCodeModal"
import { PaypalModal } from "../components/PaypalModal"

import { sendTransaction } from "../service/web3Utils";

import config from "../app.config.json";

const apiUrl = process.env.REACT_APP_API_URL;
const localUrl = process.env.REACT_APP_LOCAL_URL;

const precision = currency => config.coins[currency] && config.coins[currency].precision ? config.coins[currency].precision : 2;

/* move to utils */
const secondsToTime = (secs) => {
    let hours = Math.floor((+secs+1) / (60 * 60));
    let minutes = Math.floor((+secs+1 - hours * 60 * 60)  / 60);
    //let divisor_for_seconds = divisor_for_minutes % 60;
    //let seconds = Math.ceil(divisor_for_seconds);
    return `${hours}h ${minutes > 0 ? minutes + 'm' : '' }`;
}

/*
const httpGet = (url, cb) => {
    if ( typeof XMLHttpRequest !== 'undefined' ) {
        const x = new XMLHttpRequest();
        //xhr.open("POST", url, true);
        //xhr.setRequestHeader('Content-Type', 'application/json');
        //xhr.send(JSON.stringify({
        //    value: value
        //}));
        x.open("GET", url, true);
        x.onreadystatechange = () => {
            if(x.readyState === 4) {
                if ( typeof cb === 'function' ) {
                    cb(x.responseText);
                }
                //var tf = rf+'(\''+fp+'\', x.responseText);';
                //eval(tf);
            }
        };
        x.send(null);
    }
}
*/

export const Service = (props) => {
    let { id, service_id } = useParams();
    const [context, setContext] = useContext(AppContext);

    const [currency, setCurrency] = useState('');
    const [currenciesList, setCurrenciesList] = useState([]);
    const [rates, setRates] = useState({ CHG: 1 }); //rates to CHARG

    const [message, setMessage] = useState('');
    const [warning, setWarning] = useState('');

    const [services, setServices] = useState({});
    const [params, setParams] = useState({});

    const [startedServices, setStartedServices] = useState([]);
    const [supportedServices, setSupportedServices] = useState([]);

    const [paymentHashes, setPaymentHashes] = useState({});

    const [currentService, setCurrentService] = useState(0);
    const [payBtnPending, setPayBtnPending] = useState(false);
    const [showPaypalModal, setShowPaypalModal] = useState(false);
    const [showQRCodeModal, setShowQRCodeModal] = useState(false);
    const [paymentData, setPaymentData] = useState({});
    // const [currentRequestHash, setCurrentRequestHash] = useState('');
    const [currentPaymentHash, setCurrentPaymentHash] = useState('');

    const { currentProvider, defaultAccount, balances, currentNetworkId, logger } = context;
    const { symbol, eth, chg, allowance  } = (balances[defaultAccount] && balances[defaultAccount][currentNetworkId]) || {};
    const isERC20Net = currentNetworkId === process.env.REACT_APP_ERC20_NETWORK_ID;

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

    const preparePaymentData = (serviceId, paymentHash) => {
        setCurrentService(+serviceId);
        //console.log('preparePaymentData setCurrentService(+serviceId)', serviceId, currentService);
        if (!services[serviceId].total) {
            return;
        }
        if (currency === 'USD') {
            setShowPaypalModal(true);
            return;
        }
        try {
            setPayBtnPending(true);
            fetch(apiUrl, {
                ...fetchOptions,
                body: JSON.stringify({
                    method: 'getPaymentData',
                    data: {
                        currency,
                        networkId: currentNetworkId,
                        serviceId: serviceId,
                        paymentHash: paymentHash,
                        toAddress: id,
                        amount: services[serviceId].total.toFixed(8),
                        amountChg: services[serviceId].totalChg.toFixed(8),
                        time: services[serviceId].hours * 60 * 60
                    }
                })
            }).then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch.');
                }
                return response.json();
            }).then(res => {
                if (res.result) {
                    setPaymentData(res.result);
                }
            })
            .finally(() => setPayBtnPending(false))
        } catch (err) {
            logger.log('error', 'getPaymentData', err)
        }
    }

    useEffect(() => {
        if (paymentData.address) {
            setShowQRCodeModal(true)
        }
    },[paymentData.address])

    const getRates = useCallback(() => {
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
        };
        fetch(apiUrl, {
            ...fetchOptions,
            body: JSON.stringify({
                method: 'getRates'
            })
        }).then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch.');
            }
            return response.json();
        }).then(res => {
            if (res.result) {
                setRates(prev => ({ ...prev, ...res.result }));
            }
        }).catch(err => {
            //logger.log('error', 'fetch getRates', err)
        });
    }, []);

    useEffect(() => {
        getRates();
        const ratesInterval = setInterval(getRates, 300000); // update rates every 5 min
        return () => {
            clearInterval(ratesInterval);
        }
    },[getRates])


    useEffect(() => {
        if (id && context.registeredNodes && context.registeredNodes[id.toLowerCase()] && context.networks) {
            const { networkId } = context.registeredNodes[id.toLowerCase()];
            const { web3, chargContract } = context.networks[networkId];
            Object.keys(context.services).forEach(serviceId => {
                chargContract.methods.nodeService(id, serviceId).call().then(({ allowed, rate, maxTime }) => {
                    const service = { allowed, rate, maxTime };
                    service.name = context.services[serviceId];
                    service.totalChg = 0;
                    service.total = 0;
                    service.price = Math.fround((web3.utils.fromWei(service.rate, 'ether') * 3600).toFixed(7)); // price per hour
                    if (service.price > 0) {
                        setServices(prev => ({ ...prev, [serviceId]: service }));
                    }
                }).catch(err => {
                    //logger.log('error', 'nodeService', err)
                });
            })
        }
    }, [id, context.registeredNodes, context.services, context.networks]);

    const { networks } = context || {};
    useEffect(() => {
        const { symbol } = currentProvider || {};
        setServices(prev => {
            const service = { ...prev };
            Object.keys(prev).forEach(serviceId => {
                service[serviceId].totalChg = service[serviceId].hours ? service[serviceId].hours * service[serviceId].price : 0;
                service[serviceId].total = service[serviceId].totalChg * (rates[currency] || 0);
                if (currency !== 'CHG' && currency === symbol && networks[currentNetworkId] && networks[currentNetworkId].trade) { // ETH, BSC etc
                    const bestOrder = getBestSellOrder(service[serviceId].totalChg, networks[currentNetworkId].trade.sellOrders);
                    if (bestOrder.orderHash) {
                        service[serviceId].total = service[serviceId].totalChg * bestOrder.rate;
                    }
                }
            });
            return service;
        });
    }, [currency, rates, setServices, currentProvider, networks, currentNetworkId ]);

    useEffect(() => {

        const _services = []; // always allow to charg
        const params = new URLSearchParams(window.location.search);
        const charg_id = params.get("charg_id"); // the charging station id
        const park_id = params.get("park_id"); // the parking place id
        const wifi_id = params.get("wifi_id"); // mac or ip
        if (charg_id !== null) {
            setParams(prev => ({ ...prev, 0: charg_id}));
            localStorage.setItem('param_0', charg_id);
            _services.push('0');
        }
        if (park_id !== null) {
            setParams(prev => ({ ...prev, 1: park_id}));
            localStorage.setItem('param_1', park_id);
            _services.push('1');
        }
        if (wifi_id !== null) {
            setParams(prev => ({ ...prev, 2: wifi_id}));
            localStorage.setItem('param_2', wifi_id);
            _services.push('2');
        }
        if (_services.length > 0) {
            setSupportedServices(_services);
            return;
        }
        // if no service id in request then try to fetch supported services from the device
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
        };
        const controller = new AbortController();
        const controllerId = setTimeout(() => {
            controller.abort();
            // if no response from the local device then try to call via vpn
            fetch(apiUrl, {
                ...fetchOptions,
                body: JSON.stringify({
                    method: 'getServices',
                    data: { node: id }
                })
            }).then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch services from the device.');
                }
                return response.json();
            }).then(response => {
                if (!response.result) {
                    throw new Error('Bad response when fetching services from the device.');
                } else {
                    setSupportedServices(response.result);
                }
            }).catch(err => {
                setWarning('Connection error ...\n');
                console.error('Failed to connect to vpn-router', {err});
            });
        }, 5000); // try for 5 sec, may be it is http and direct connection...

        // unfortunately direct connection will not work if https is used
        fetch(localUrl + '/api/getServices', { signal: controller.signal }).then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch services from the device.');
            }
            return response.json();
        }).then(response => {
            clearTimeout(controllerId);
            if (!Array.isArray(response)) {
                throw new Error('Bad response when fetching services from the device.');
            } else {
                setSupportedServices(response);
            }
        }).catch(err => {
            // try to get via vpn ?
            console.error('Failed to connect to router', {err});
        });
    }, [id])

    useEffect(() => {

        if (process.env['REACT_APP_MAX_BLOCK_RANGE_'+context.currentNetworkId]) {
            // skip if getPastEvents limited
            return;
        }
        const { chargContract } = context.currentProvider || {}; //context.networks[currentNetworkId];
        if (!chargContract || !context.defaultAccount || !id) return;

        chargContract.getPastEvents('ServiceOn', {
            filter: { nodeAddr: id, payer: context.defaultAccount },
            fromBlock: 1, //context.currentProvider.fromBlock,
            toBlock: 'latest'
        }).then((events) => {
            const now = Math.round(Date.now() / 1000);
            //logger.log('debug', 'getPastEvents ServiceOn', { now, events })
            // const startedArray = events.filter(e => e.returnValues.payer === context.defaultAccount).map(e => e.returnValues);
            const startedArray = events.filter(e => Number(e.returnValues.finished) > now - 12*60*60).map(e => e.returnValues);
            /*
            const startedArray = events.reduce((r, e) => {
                if (Number(e.returnValues.finished) > now) {
                    r.push(e.returnValues);
                }
                return r;
            }, []);
            */
            chargContract.getPastEvents('ServiceOff', {
                //filter: {myIndexedParam: [20,23], myOtherIndexedParam: '0x123456789...'}, // Using an array means OR: e.g. 20 or 23
                filter: { nodeAddr: id, payer: context.defaultAccount },
                fromBlock: 1, //context.currentProvider.fromBlock,
                toBlock: 'latest'
            }).then((events) => {
                const stoppedArray = events.map(e => e.returnValues.paymentHash);
                setStartedServices(startedArray.filter(s => !stoppedArray.includes(s.paymentHash)));
            });
        }).catch(err => {
            console.error('error', 'getPastEvents', err)
            //logger.log('error', 'getPastEvents', err)
        });
    }, [id, context.defaultAccount, context.currentProvider, context.currentNetworkId]);

    /*
    useEffect(() => {
        if (client_id) {
            localStorage.setItem('client_id', client_id);
        }
    }, [client_id]);
    */

    const node = context && context.registeredNodes ? context.registeredNodes[id.toLowerCase()] : null;

    // console.log({id, node}, context.registeredNodes);

    useEffect(() => {
        if (!node) return;
        const { symbol } = currentProvider || {};
        if (currentNetworkId === node.networkId && !currenciesList.includes('CHG')) {
            setCurrenciesList(prev => [ 'CHG', ...prev ]);
            setCurrency('CHG');
        } else if (currentNetworkId !== node.networkId && currenciesList.includes('CHG')) {
            setCurrenciesList(prev => [ ...prev.filter(
                // remove CHG if the station is not registered here
                c => c !== 'CHG'
            )]);
        }
        const nonEvmCurrencies = process.env.REACT_APP_NON_EVM_CURRENCIES.split(',');
        if (symbol && symbol !== 'CHG' && !currenciesList.includes(symbol)) {
            setCurrenciesList(prev => [ ...prev.filter(
                // need to clear symbols from previous chain
                c => (c === 'CHG' && currentNetworkId === node.networkId) || nonEvmCurrencies.includes(c)
            ), symbol ]);
        }
        // switched to native
        if (symbol === 'CHG') {
            // todo, clear previous EVM currency here
        }
        for (const c in rates) {
            if (!currenciesList.includes(c) && nonEvmCurrencies.includes(c)) {
                setCurrenciesList(prev => [ ...prev, c ]);
            }
        }
    },[currentNetworkId, currenciesList, node, rates, currentProvider]);

    useEffect(() => {
        if (!currenciesList.includes(currency) && currenciesList.length > 0) {
            setCurrency(currenciesList[0]);
        }
    },[currency, currenciesList]);

    /*
    useEffect(() => {
        console.log('Service rendered');
        return () => {
            console.log('Service destroyed');
        }
    }, []);
    */

    const signResult = (result, data, serviceId) => {
        let confirmedMessage = '';
        let timerId = null;
        let secondsWaiting = 0;
        logger.log('debug', 'signResult', { result, data });
        //console.log({ currentService, serviceId });
        window.scrollTo(0, 0);
        if (result === "error") {
            setWarning(('The transaction was not signed !\n' + data.message));
            return;
        }
        const _message = {};
        if (result==="confirmed" && data.number===0) {
            _message.hash = data.receipt.transactionHash;
            _message.color = '#317418';
            _message.faClass = 'fa fa-check';
            _message.info = data.receipt.blockNumber ? " on block number " + data.receipt.blockNumber : '';
            // now try to start on the device
            //const _currentRequestHash = currentRequestHash|| localStorage.getItem('currentRequestHash');
            const _currentRequestHash = localStorage.getItem('currentRequestHash');

            const param = params[serviceId] !== undefined ? params[serviceId] : localStorage.getItem('param_'+serviceId);
            //console.log({ param, params, currentService, serviceId });
            if (_currentRequestHash && serviceId !== undefined) {
                timerId = setInterval(() => {
                    setMessage(<>{confirmedMessage}<br/>{'Waiting the device response: '}{++secondsWaiting}</>);
                },  1000); // update every 1 sec

                const controller = new AbortController();
                const controllerId = setTimeout(async () => {
                    controller.abort();
                    // if no response from the local device then try to call via vpn
                    let confirmedByDevice = false;
                    let attempts = 5;
                    let response;

                    while (!confirmedByDevice && --attempts > 0) {
                        response = await fetch(apiUrl, {
                            ...fetchOptions,
                            body: JSON.stringify({
                                method: 'startService',
                                data: { hash: _currentRequestHash, networkId: node.networkId, param }
                            })
                        });
                        logger.log('debug','device-vpn response', { response });
                        if (!response.ok) {
                            continue;
                        }
                        response = await response.json();
                        //console.log({response});
                        if (response.result && !response.result.error) {
                            confirmedByDevice = true;
                            setWarning('');
                            setMessage(<>{confirmedMessage} {' - Service started! ' + param}</>);
                            //if (currentService === 2) {
                                // internet connected
                                //Object.defineProperty(window.location, 'replace', {
                                //    writable: true,
                                //    value: { assign: 'https://google.com' }
                                //})
                            //}
                            break;
                        }
                    }
                    clearInterval(timerId);
                    if (!confirmedByDevice) {
                        setMessage(<>{confirmedMessage} {' - Device error!'}</>);
                        setWarning(response.result ? response.result.error : 'Unknown device error');
                    }
                }, 5000); // try for 5 sec, may be it is http and direct connection...

                // unfortunately direct connection will not work if https is used
                fetch(localUrl + '/api/startService?hash='+_currentRequestHash+'&param='+param, { signal: controller.signal }).then(response => {
                    logger.log('debug','device response', { response });
                    if (!response.ok) {
                        clearInterval(timerId);
                        setWarning(('Failed to start the service on the station! Try to connect and start later...\n'));
                    }
                    return response.json();
                }).then(response => {
                    logger.log('debug','device json response', { response });
                    clearInterval(timerId);
                    clearTimeout(controllerId);
                    if (response.error) {
                        setMessage(<>{confirmedMessage} {' - Device error!'}</>);
                        setWarning(response.result.error);
                    } else {
                        setMessage(<>{confirmedMessage} {' - Service started! ' + param}</>);
                        //if (currentService === 2) {
                            // internet connected
                            //window.location.replace = "'https://google.com'";
                        //}
                    }
            }).catch(err => {
                    // try to start via vpn ?
                    logger.log('error', 'Failed to connect to router', {err});
                });
            }
            setContext(
                _context => ({ ..._context, networks: { ..._context.networks }})
            );
        } else if (result==="signed") {
            setContext(
                _context => ({ ..._context, networks: { ..._context.networks }})
            );
            setTimeout(() => setContext(
                _context => ({ ..._context, networks: { ..._context.networks }})
            ), 20000);// in 20 sec on another net
            _message.hash = data;
            _message.color = '#b3890c';
            _message.faClass = 'fa fa-spinner fa-spin';
            _message.info = data.message || '. Please wait for confirmation ... ';
        } else {
            return;
        }
        confirmedMessage =
        <>
            <i className={_message.faClass}></i>
            The transaction is
            <b>&nbsp;<a
                target='_blank' rel='noOpener noReferrer'
                style={{color: _message.color}}
                href={config.networks[node.networkId].explorer + '/tx/' + _message.hash} 
            >{result}</a></b>{_message.info}
            {result==='signed' ? <span className="spinner-border spinner-border-sm"></span> : null}
        </>;
        setMessage(confirmedMessage);
    }

    const getBestSellOrder = (amountChg, sellOrders) => {
        let bestOrder = {
            rate: Infinity,
            expire: Infinity
        };
        for (const hash in sellOrders) {
            if (amountChg <= sellOrders[hash].give) {
                if (
                    (bestOrder.rate > sellOrders[hash].rate) ||
                    ((bestOrder.rate >= sellOrders[hash].rate) && (bestOrder.expire > sellOrders[hash].expire))
                ) {
                    bestOrder = sellOrders[hash];
                }
            }
        }
        return bestOrder;
    }

    const handleUnlock = () => {
        sendTransaction(
            currentProvider.chgTokenInstance.methods.approve(currentProvider.chargContract._address,"10000000000000000000000000000"),
            { from: defaultAccount },
            currentProvider.web3,
            signResult
        );
    }

    const prepareService = async (requestHash, serviceId) => {
        try {
            const param = params[+serviceId] !== undefined ? params[+serviceId] : localStorage.getItem('param_'+serviceId) || '0';
            if (+serviceId === 2 && param === '0') {
                // todo: fetch MAC from https://wifi.chgcoin.org/api/getNode
                // need MAC address for Wifi
                setWarning(
                    <>
                        You need to connect to <b>Charg-WiFi</b> in order to start internet!
                        <br/><a href='https://wifi.chgcoin.org/'>Click here to continue...</a>
                    </>
                );
                return false;
            }
            setCurrentService(+serviceId);
            //console.log('prepareService setCurrentService(+serviceId)', serviceId, currentService);
            const response = await fetch(apiUrl, {
                ...fetchOptions,
                body: JSON.stringify({
                    method: 'prepareService',
                    data: { hash: requestHash, nodeAddr: id, serviceId: serviceId.toString(), networkId: node.networkId, param }
                })
            });
            //console.log('after prepare fetch', serviceId, { currentService });
            if (!response.ok) {
                setWarning('Bad device response');
                return false;
            }
            const parsed = await response.json();
            logger.log('debug','device-vpn-prepare json response', { parsed, serviceId });

            if (!parsed.result || parsed.result.error) {
                setWarning('Device error! ' + parsed.result ? parsed.result.error : 'Unknown');
                return false;
            }
            // looks everything is ok, return true
            return true;
        } catch(err) {
            logger.log('error','device-prepare', { err });
            setWarning('Device error! ' + err.message);
            return false;
        };
    }
    const handleStart = async (serviceId) => {
        const isNativeNet = currentNetworkId === process.env.REACT_APP_NATIVE_NETWORK_ID;
        const { web3, chargContract } = currentProvider || {}; //context.networks[currentNetworkId];

        setCurrentService(+serviceId);
        //console.log('handleStart setCurrentService(+serviceId)', serviceId, currentService);

        setWarning(''); // clear the previous warning message
        const signedText = `I agree to start ${services[serviceId].hours} hours of ${services[serviceId].name} for ${services[serviceId].totalChg} CHG [node: ${id}, chain ${currentNetworkId}, ts:${Date.now()}]`;
        const requestHash = sha256(signedText);
        const paymentHash = '0x'+sha256(requestHash);
        //chargContract.methods.serviceActions(paymentHash).call().then(console.log);
        localStorage.setItem(paymentHash, requestHash);
        localStorage.setItem('currentRequestHash', requestHash);
        //setCurrentRequestHash(requestHash);
        setCurrentPaymentHash(paymentHash);
        setPaymentHashes(prev => ({ ...prev, [paymentHash]: requestHash }) );

        const nodeReady = await prepareService(requestHash, serviceId);
        if (!nodeReady) {
            return;
        }

        if (currency === 'CHG' && currentNetworkId === node.networkId) {
            let value = 0;
            if (isNativeNet) {
                value = web3.utils.toWei(services[serviceId].total.toFixed(10), 'ether');
            }
            const orderHash = '0x0';
            sendTransaction(
                isNativeNet
                ? chargContract.methods.serviceOn(id, serviceId, paymentHash )
                : chargContract.methods.serviceOn(id, serviceId, services[serviceId].hours * 3600, paymentHash, orderHash ),
                { from: defaultAccount, value },
                web3,
                (result, data) => signResult(result, data, +serviceId)
            );
        } else if (currency === symbol && currentNetworkId === node.networkId) {
            if (isNativeNet) {
                logger.log('error', 'Something is wrong', { currency, symbol, currentNetworkId });
                return;
            }
            // cross pay, search for the best order
            const value = web3.utils.toWei(services[serviceId].total.toFixed(10), 'ether');
            const bestOrder = getBestSellOrder(services[serviceId].totalChg, context.networks[currentNetworkId].trade.sellOrders);
            if (bestOrder.orderHash === undefined) {
                logger.log('error', 'No order!', { currentNetworkId });
                return;
                // use different mechanism here
            }
            sendTransaction(
                chargContract.methods.serviceOn(id, serviceId, services[serviceId].hours * 3600, paymentHash, bestOrder.orderHash ),
                { from: defaultAccount, value },
                web3,
                (result, data) => signResult(result, data, +serviceId)
            );
        } else {
            preparePaymentData(serviceId, paymentHash);
        }
    };

    /* todo stop - check if authorized to stop
    const handleStop = (paymentHash) => {
        const { web3, chargContract } = currentProvider; //context.networks[currentNetworkId];
        const requestHash = paymentHashes[paymentHash] || localStorage.getItem(paymentHash);
        if (requestHash) {
            // check if we are connected to charg-wifi
            fetch('http://192.168.217.1:217/api/get?action=stop&hash='+requestHash).then(response => {
                console.log({response})
                if (!response.ok) {
                    throw new Error('Failed to fetch from router.');
                }
                return response.json();
            }).then(response => {
                console.log({response})
            }).catch(err => {
                console.error('Failed to connect to router', {err})
            });
            return;
        };
        sendTransaction(
            chargContract.methods.serviceOff(paymentHash),
            { from: defaultAccount },
            web3,
            signResult
        );
    }
    */

    const handleRun = (paymentHash, serviceId) => {
        const requestHash = paymentHashes[paymentHash] || localStorage.getItem(paymentHash);
        if (!requestHash) {
            logger.log('error', 'No request hash ', { paymentHash });
            return;
        };
        const param = params[+serviceId] !== undefined ? params[+serviceId] : localStorage.getItem('param_'+serviceId) || '0';
        // check if we are connected to charg-wifi
        fetch(localUrl + '/api/startService?hash='+requestHash+'&param='+param).then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch from router.');
            }
            return response.json();
        }).then(response => {
            logger.log('debug', 'Run from row response', { response })
        }).catch(err => {
            logger.log('error', 'Connect to device', err)
        });
    }

    if (!node) return '';
    const notSupportedNetwork = !process.env.REACT_APP_SUPPORTED_NETWORKS.split(',').includes(currentNetworkId);
    const servicesToShow = service_id === undefined ? supportedServices : [service_id];

    return (
    <>
        <Header title={'Welcome to ' + node.name} />
        <div>
            <div>
                <div className="card">
                    <div className="card-body">
                        <div>Location : <span style={{maxWidth: '350px', margin: 'auto', wordWrap: 'break-word', fontSize:'16px'}}>{node.location}</span></div>
                        <div>Phone : <a href={'tel:'+node.phone}>{node.phone}</a></div>
                        <div>Connector : <span id='node-connector'>{node.connector}</span> Power : <span id='node-power'>{node.power}</span> </div>
                    </div>
                </div>
                <br/>
                {notSupportedNetwork && <h2 className='blinking'>Switch your network to one of supported chains please!</h2> }
                {currentNetworkId !== node.networkId && <h4 className='blinking'>{`Switch to ${config.networks[node.networkId].networkName} if you want to pay in CHG!`}</h4> }
                <AlertBlock message={message} setMessage={setMessage} variant="dark" />
                <AlertBlock message={warning} setMessage={setWarning} variant="warning" />
                <div className="card-deck mb-3 text-center">
                    {servicesToShow.map(serviceId => services[serviceId] &&
                    <div key={serviceId} className="card mb-4 shadow-sm charg-block" style={{ margin: 'auto', padding: '7px', maxWidth:'400px' }}>
                        <div className="card-header">
                            <h4 className="my-0 font-weight-normal">{services[serviceId].name}</h4>
                        </div>
                        <div className="card-body">

                            <h3 className="card-title pricing-card-title">
                                <span>{services[serviceId].price}</span>
                                <small className="currency text-muted">CHG</small>
                                <small className="text-muted">/ hour</small>
                            </h3>

                            <div className="form-group text-center">
                                <InputSpinner
                                    placeholder="Time (hours)"
                                    max = {24}
                                    value = {services[serviceId].hours}
                                    min={0} step={0.5} digits={1} onChange={hours => {
                                        const totalChg = hours * services[serviceId].price;
                                        let total = totalChg * (rates[currency] || 0);
                                        if (currency !== 'CHG' && currency === symbol && currentNetworkId === node.networkId) { // ETH, BSC etc
                                            const { sellOrders } = context.networks[currentNetworkId].trade || {};
                                            const bestOrder = getBestSellOrder(services[serviceId].totalChg, sellOrders);
                                            logger.log('debug', 'bestOrder', { bestOrder, total });  
                                            if (bestOrder.orderHash) {
                                                total = totalChg * Number(bestOrder.rate);
                                            }
                                        }
                                        setServices(prev => ({ ...prev, [serviceId]: { ...services[serviceId], hours, totalChg, total }}))
                                    }}
                                />
                            </div>
                            <h2 className="card-title pricing-card-title">
                                <span>{services[serviceId].total.toFixed(precision(currency))}</span>
                                <small className="currency text-muted">{currency}</small>
                                <small className="text-muted"></small>
                            </h2>
                            { isERC20Net && (Number(allowance)===0) ? (// || context.balances.allowance.lt(10**6)) ? (
                            <button type="button" className="btn btn-lg btn-block btn-outline-primary" onClick={handleUnlock}>
                                Unlock
                            </button>
                            ):(
                            <button
                                type="button"
                                className="btn btn-lg btn-block btn-outline-primary"
                                onClick={() => handleStart(serviceId)}
                                disabled={
                                    !services[serviceId].total
                                    || payBtnPending
                                    || (currency === 'CHG' && !currentProvider)
                                    || (currency === 'CHG' && services[serviceId].totalChg && services[serviceId].totalChg > chg)
                                    || (currency !== 'CHG' && currency === symbol && services[serviceId].total && services[serviceId].total > eth)
                                }
                            >
                                Start {services[serviceId].name}
                            </button>
                            )}
                        </div>
                    </div>
                    )}
                </div>

                {false && startedServices.length > 0 && // todo ...
                <div className="card-deck mb-3 text-center">
                    {servicesToShow.map(serviceId => services[serviceId] &&
                    <div key={serviceId} className="card mb-4 shadow-sm charg-block" style={{ margin: 'auto', maxWidth:'400px' }}>
                        {startedServices.filter(s => s.serviceId === serviceId.toString()).length > 0 &&
                        <div className="card-body">
                        {startedServices.filter(s => s.serviceId === serviceId.toString()).map(s => {
                            return (
                            <div className="row" style={{padding: '10px'}} key={s.paymentHash}>
                                <div className="col">
                                    {services[serviceId].name} {secondsToTime(s.serviceTime) /* add 5 sec */}
                                </div>
                                <div className="col">
                                    <div className="row">
                                        <div className="col">
                                            {(paymentHashes[s.paymentHash] || localStorage.getItem(s.paymentHash)) &&
                                                <button type="button" className="btn btn-sm btn-block btn-outline-primary" onClick={() => handleRun(s.paymentHash, serviceId)}>
                                                    Start
                                                </button>
                                            }
                                        </div>
                                        {/*
                                        <div className="col">
                                            <button type="button" className="btn btn-sm btn-block btn-outline-primary" onClick={() => handleStop(s.paymentHash)}>
                                                Stop
                                            </button>
                                        </div>
                                        */}
                                    </div>
                                </div>
                            </div>
                        )})}
                        </div>
                        }
                    </div>
                    )}
                </div>
                }
                <select className='custom-select' style={{maxWidth:'200px'}}
                    onChange={e=> setCurrency(e.target.value)}
                    value={currency}>
                    {currenciesList.map(c => (
                        <option value={c} key={c}>{c}</option>
                    ))}
                </select>
            </div>
        </div>
        {services[currentService] &&
        <PaypalModal
            show={showPaypalModal} setShow={setShowPaypalModal} toAddress={id}
            paymentData={paymentData}
            networkId={node.networkId}
            serviceId={currentService}
            paymentHash={currentPaymentHash}
            time={services[currentService].hours * 3600}
            amountGive={services[currentService].total}
            amountGet={services[currentService].totalChg}
            title={`Start ${services[currentService].hours} Hr(s) ${services[currentService].name}`}
            currency={currency} disabled={false}
            handleAction={(result, data) => signResult(result, data, currentService)}
        />}
        {services[currentService] &&
        <QRCodeModal
            show={showQRCodeModal} setShow={setShowQRCodeModal} toAddress={id}
            paymentData={paymentData}
            networkId={node.networkId}
            serviceId={currentService}
            paymentHash={currentPaymentHash}
            time={services[currentService].hours * 3600}
            amountGive={services[currentService].total}
            amountGet={services[currentService].totalChg}
            title={`Start ${services[currentService].hours}hr ${services[currentService].name}`}
            currency={currency} disabled={false}
            handleAction={(result, data) => signResult(result, data, currentService)}
        />}
        <Footer/>
    </>
)};
