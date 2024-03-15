import React, { useContext, useState, useCallback } from 'react';
import Web3 from 'web3';

//import request from 'request-promise-native';

import AppContext from '../context/AppContext';

import { Header } from './Header';
import { Footer } from './Footer';

import { Button } from "react-bootstrap";
import { MarketOrders } from "../components/MarketOrders"
import { TransferModal } from "../components/TransferModal"
import { AlertBlock } from "../components/AlertBlock"

import { InputSpinner } from "../components/InputSpinner"
import { InputAddress } from "../components/InputAddress"
import { QRCodeModal } from "../components/QRCodeModal"
import { PaypalModal } from "../components/PaypalModal"

import { sendTransaction } from "../service/web3Utils";

import config from "../app.config.json";

const apiUrl = process.env.REACT_APP_API_URL;

const isValidAddress = address => Web3.utils.isAddress(address);

export const Market = () => {

    const [context, setContext] = useContext(AppContext);

    const [message, setMessage] = useState('');
    const [warning, setWarning] = useState('');

    const [payBtnPending, setPayBtnPending] = useState(false);

    const [currency, setCurrency] = useState('BTC');

    const [showPaypalModal, setShowPaypalModal] = useState(false);
    const [showQRCodeModal, setShowQRCodeModal] = useState(false);
    const [paymentData, setPaymentData] = useState({});

    // native sales - TODO : move away from this file
    const [toAddress, setToAddress] = useState('');
    const [amountGive, setAmountGive] = useState(0);
    const [amountGet, setAmountGet] = useState(0);
    const [rates, setRates] = useState({}); //rates to CHARG

    const { currentProvider, defaultAccount, balances, currentNetworkId, logger } = context;
    const { symbol, eth, chg, ethDeposit, chgDeposit, allowance }
        = (balances[defaultAccount] && balances[defaultAccount][currentNetworkId]) || {};

    const notSupportedNetwork = ! process.env.REACT_APP_SUPPORTED_NETWORKS.split(',').includes(currentNetworkId);

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

    const preparePaymentData = () => {
        if (amountGive === 0) {
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
                    data: { currency, amount: Number(amountGive).toFixed(5), chgAmount: Number(amountGet).toFixed(2), toAddress: defaultAccount || toAddress }
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
            }).finally(() => setPayBtnPending(false)).catch(console.error)
            /*
            context.wsClient.send({
                method: 'getPaymentData',
                data: { currency, amount: Number(amountGive).toFixed(5), chgAmount: Number(amountGet).toFixed(2), toAddress: defaultAccount }
            }, res => {
                console.log(res);
                if (res.result) {
                    setPaymentData(res.result);
                }
            })
            */
        } catch (err) {
            logger.log('error', 'getPaymentData', err)
        }
    }

    React.useEffect(() => {
        if (paymentData.address) {
            setShowQRCodeModal(true)
        }
    },[paymentData.address])

    /*
    const getRatesWs = useCallback(() => {
        if (!context.wsClient) return;
        context.wsClient.send({ method: 'getRates' }, res => {
            if (res.result) {
                console.log('getRatesWs', res.result);
                //setRates(res.result);
            }
        })
    }, [context.wsClient]);

    const subscribeRatesWs = useCallback(() => {
        if (!context.wsClient) return;
        /*
        context.wsClient.send({ subscribe: 'ratesChanged' }, res => {
            if (res.result) {
                console.log('ratesChanged', res.result);
                //setRates(res.result);
            }
        });
        context.wsClient.send({ subscribe: 'ordersChanged' }, res => {
            if (res.result) {
                console.log('ordersChanged', res.result);
            }
        })
    }, [context.wsClient]);
    */

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
                setRates(res.result);
            }
        }).catch(err => {
            if (process.env.REACT_APP_DEBUG_LEVEL > 1) {
                console.error('fetch getRates error:', err);
            }
        })
    }, []);

    React.useEffect(() => {
        getRates();
        const ratesInterval = setInterval(getRates, 5 * 60 * 1000); // update rates every 5 min
        return () => {
            clearInterval(ratesInterval);
        }
    },[getRates])

    /*
    React.useEffect(() => {
        getRatesWs();
        const ratesInterval = setInterval(getRatesWs, 1 * 60 * 1000); // update rates every 1 min
        return () => {
            clearInterval(ratesInterval);
        }
    },[getRatesWs])

    React.useEffect(() => {
        subscribeRatesWs();
    },[subscribeRatesWs])
    */

    React.useEffect(() => {
        setAmountGive( amountGet * (rates[currency] || 0));
    },[amountGet, currency, rates])

    const NativeBlockGet = () => (
        <div className="card mb-6 shadow-sm ">
            <div className="card-header">
                <h4 className="my-0 font-weight-normal"> CHG Amount </h4>
            </div>
            <div className="card-body">
    
                <h3 className="card-title pricing-card-title">
                    <div className="row">
                        <div className="col">
                            <span>{amountGet}</span>
                            <small className="text-muted">CHG</small>
                        </div>
                    </div>
                </h3>

                <h3 className="card-title pricing-card-title">
                    <div className="row">
                        <div className="col">
                            <small>The amount of CHARG you wish to buy: </small>
                        </div>
                        <div className="col">
                        <InputSpinner 
                            max = {10000} 
                            value = {amountGet} min={0} step={10} digits={1} onChange={setAmountGet}
                        />
                        </div>    
                    </div>
                    {!defaultAccount && 
                        <div className="row">
                            <div className="col">
                            <InputAddress placeholder="Wallet address" address={toAddress} setAddress={setToAddress} />
                            </div>
                        </div>
                    }
                    </h3>
            </div>
        </div>
    );
    
    const NativeBlockGive = () => (
        <div className="card mb-6 shadow-sm ">
            <div className="card-header">
                <h4 className="my-0 font-weight-normal">{currency} Amount </h4>
            </div>
            <div className="card-body">
                <h3 className="card-title pricing-card-title">
                    <div className="row">
                        <div className="col">
                            <small>The amount of {currency} you will pay: </small>
                        </div>
                        <div className="col">
                            <span id="eth-wallet-balance">{Number(amountGive).toFixed(currency === 'USD' ? 2 : 5)}</span>
                            <small className="text-muted">{currency}</small>
                        </div>
                    </div>
                </h3>
                <h3 className="card-title pricing-card-title">
                    <div className="row">
                        <div className="col">
                            <Button
                                onClick={()=>preparePaymentData()}
                                size="md" block variant="outline-primary"
                                disabled={payBtnPending || amountGive === 0 || (!defaultAccount && !isValidAddress(toAddress))}>
                                {'Pay in '+currency}
                            </Button>
                            <PaypalModal
                                show={showPaypalModal} setShow={setShowPaypalModal} toAddress={defaultAccount || toAddress}
                                paymentData={paymentData} amountGive={amountGive} amountGet={amountGet}
                                title={'Buy '+amountGet+' CHG for '+Number(amountGive).toFixed(2)+' '+currency}
                                currency={currency} handleAction={signResult} disabled={false}
                            />
                            <QRCodeModal
                                show={showQRCodeModal} setShow={setShowQRCodeModal} toAddress={defaultAccount || toAddress}
                                paymentData={paymentData} amountGive={amountGive} amountGet={amountGet}
                                title={'Buy '+amountGet+' CHG for '+Number(amountGive).toFixed(5)+' '+currency}
                                currency={currency} handleAction={signResult} disabled={false}
                            />
                        </div>
                        <div className="col">
                            <select className='custom-select' style={{maxWidth:'200px'}}
                                onChange={e=>setCurrency(e.target.value)}
                                value={currency}>
                                {process.env.REACT_APP_NON_EVM_CURRENCIES.split(',').map(c => ( 
                                    <option value={c} key={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </h3>
    
            </div>
        </div>
    )

    const signResult = (result, data) => {
        logger.log('debug', 'signResult', { result, data });
        if (result === "error") {
            setWarning(('The transaction was not signed !\n' + data.message));
            return;
        }
        const message = {};
        if (result==="confirmed" && data.number===0) {
            setContext(
                _context => ({ ..._context, networks: { ..._context.networks }})
            );
            message.hash = data.receipt.transactionHash;
            message.color = '#317418';
            message.faClass = 'fa fa-check';
            message.info = data.receipt.blockNumber ? " on block number " + data.receipt.blockNumber : '';
        } else if (result==="signed") {
            message.hash = data;
            message.color = '#b3890c';
            message.faClass = 'fa fa-spinner fa-spin';
            message.info = data.message || '. Please wait for confirmation ... ';
        } else {
            return;
        }
        setMessage(
        <>
            <i className={message.faClass}></i>
            The transaction is 
            <b>&nbsp;<a 
                target='_blank' rel='noopener noreferrer'
                style={{color: message.color}}
                href={config.networks[defaultAccount ? currentNetworkId : process.env.REACT_APP_NATIVE_NETWORK_ID].explorer + '/tx/' + message.hash} 
            >{result}</a></b>{message.info}
            {result==='signed' ? <span className="spinner-border spinner-border-sm"></span> : null}
        </>
        );
    }

    const handleUnlock = () => {
        sendTransaction(
            currentProvider.chgTokenInstance.methods.approve(currentProvider.chargContract._address,"10000000000000000000000000000"),
            { from: defaultAccount },
            currentProvider.web3,
            signResult
        );
    }

    const doTransfer = (action, _currency, value) => {
        
        if (value <= 0) {
            setWarning('Wrong amount value provided !');
            return;
        }
        
        if (!defaultAccount || defaultAccount.length < 20) {
            setWarning('Your digital wallet is not connected  !');
            return;
        }

        const valueWei = currentProvider.web3.utils.toWei(value,'ether');
        switch(action.toLowerCase()) {
            case 'deposit':
                switch(_currency.toUpperCase()) {
                    case 'CHG':
                        sendTransaction(
                            currentProvider.chargContract.methods.depositCoins(valueWei),
                            { from: defaultAccount },
                            currentProvider.web3,
                            signResult
                        );
                        break;
                    case 'ETH':
                        sendTransaction(
                            currentProvider.chargContract.methods.depositEther(),
                            { from: defaultAccount, value: valueWei },
                            currentProvider.web3,
                            signResult
                        );
                        break;
                    default:
                }
                break;
            case 'withdraw':
                switch(_currency.toUpperCase()) {
                    case 'CHG':
                        sendTransaction(
                            currentProvider.chargContract.methods.withdrawCoins(valueWei),
                            { from: defaultAccount },
                            currentProvider.web3,
                            signResult
                        );
                        break;
                    case 'ETH':
                        sendTransaction(
                            currentProvider.chargContract.methods.withdrawEther(valueWei),
                            { from: defaultAccount },
                            currentProvider.web3,
                            signResult
                        );
                        break;
                    default:
                }
                break;
            default:
        }
    }

    if (!currentProvider || !currentProvider.web3 || !defaultAccount || defaultAccount.length < 20 ) {
        return (
        <React.Fragment>
            <Header title='Charg Coin Market' />
            <main role="main" className="inner cover">
                <br/>
                <p className="lead">Using the power of the blockchain, <a target="_blank"  rel="noopener noreferrer" href="https://chgcoin.org/"><b>Charg Coin (CHG)</b></a> facilitates crowdsourced energy distribution.</p>
                <div id="mobile"></div>
                <p> 
                This decentralized cross-chain application will help you to start any service with powerful <a target="_blank" rel="noopener noreferrer" href="https://chgcoin.org/"><b>Charg Network</b></a>.
                You can use it with any legacy Web3 browser, like <a target="_blank" rel="noopener noreferrer" href="https://wallet.coinbase.com/"><b>Coinbase Wallet</b></a> or <a target="_blank" rel="noopener noreferrer" href="https://www.myetherwallet.com/"> <b>MyEtherWallet</b></a> 
                &nbsp; as well as with browser extensions like <a target="_blank" rel="noopener noreferrer" href="https://metamask.io"><b>Metamask</b></a> or <a target="_blank" rel="noopener noreferrer" href="https://chrome.google.com/webstore/detail/nifty-wallet/jbdaocneiiinmjbjlgalhcelgbejmnid"><b>Nifty Wallet</b></a>
                &nbsp; and sure with remote wallets like <a target="_blank" rel="noopener noreferrer" href="https://portis.io/"> <b>Portis</b></a> or <a target="_blank" rel="noopener noreferrer" href="https://fortmatic.com/"> <b>Fortmatic</b></a> and many others.
                </p>

                <div className="card-deck mb-3 text-center">
                    <NativeBlockGet context={context}/>
                    <NativeBlockGive context={context}/>
                </div>
                <AlertBlock message={message} setMessage={setMessage} variant="dark" />
                <AlertBlock message={warning} setMessage={setWarning} variant="warning" />
            </main>

            <Footer/>
        </React.Fragment>
        )
    }else{
        const isERC20Net = currentNetworkId === process.env.REACT_APP_ERC20_NETWORK_ID;
        const isNativeNet = currentNetworkId === process.env.REACT_APP_NATIVE_NETWORK_ID;

        if (isNativeNet) {
            return (
                <>
                <Header title='Charg Coin Sales' />
                <main role="main" className="inner cover">
                    <br/>
                    <p className="lead">Using the power of the blockchain, <a target="_blank"  rel="noopener noreferrer" href="https://chgcoin.org/"><b>Charg Coin (CHG)</b></a> facilitates crowdsourced energy distribution.</p>
                    <div id="mobile"></div>
                    <div className="card-deck mb-3 text-center">
                        <NativeBlockGet context={context}/>
                        <NativeBlockGive context={context}/>
                    </div>
                    <AlertBlock message={message} setMessage={setMessage} variant="dark" />
                    <AlertBlock message={warning} setMessage={setWarning} variant="warning" />
                </main>
                <Footer/>
                </>
            )
        }

        //erc20 or other
        return (
        <React.Fragment>
            <Header title='Charg Coin Exchange' />
            <main role="main" className="inner cover">
                <br/>
                <p className="lead">Using the power of the blockchain, <a target="_blank"  rel="noopener noreferrer" href="https://chgcoin.org/"><b>Charg Coin (CHG)</b></a> facilitates crowdsourced energy distribution.</p>

                {notSupportedNetwork && <h2 className='blinking'>Switch your network to one of supported chains please!</h2> }

                <div id="mobile"></div>

                <div className="card-deck mb-3 text-center">

                    <div className="card mb-6 shadow-sm">
                        <div className="card-header">
                            <h4 className="my-0 font-weight-normal">CHG Balance</h4>
                        </div>
                        <div className="card-body">

                            <h4 className="card-title pricing-card-title">
                                <div className="row">
                                    <div className="col">
                                        <span>Wallet: </span>
                                    </div>
                                    <div className="col">
                                        <span id="chg-wallet-balance">{chg}</span>
                                        <small className="text-muted">CHG</small>
                                    </div>
                                </div>
                            </h4>
                            {chgDeposit &&
                            <h4 className="card-title pricing-card-title">
                                <div className="row">
                                    <div className="col">
                                        <span>Deposit: </span>
                                    </div>
                                    <div className="col">
                                        <span id="chg-market-balance">{chgDeposit}</span>
                                        <small className="text-muted">CHG</small>
                                    </div>
                                </div>
                            </h4>}

                            {isERC20Net &&
                            <div className="row">
                                <div className="col">
                                    { (Number(allowance)===0) ? (// || context.balances.allowance.lt(10**6)) ? (
                                        <Button onClick={handleUnlock} size="md" variant="outline-primary" disabled={isNativeNet} block>
                                            Unlock
                                        </Button>
                                    ):(
                                        <TransferModal 
                                            action="Deposit" currency="CHG" handleAction={doTransfer} disabled={!chg}
                                            description="Enter the amount of CHG you wish to deposit for trading on the Charg Market"
                                            min={0} max={chg} step={10} digits={0} value={0} 
                                        />
                                    )}
                                </div>                            
                                <div className="col">
                                    <TransferModal 
                                        action="Withdraw" currency="CHG" handleAction={doTransfer} disabled={!chgDeposit}
                                        description="Enter the amount of CHG you wish to withdraw from the Charg Market"
                                        min={0} max={chgDeposit} step={10} digits={0} value={chgDeposit} 
                                    />
                                </div>
                            </div>}

                        </div>
                    </div>

                    <div className="card mb-6 shadow-sm ">
                        <div className="card-header">
                            <h4 className="my-0 font-weight-normal">{symbol} Balance</h4>
                        </div>
                        <div className="card-body">

                            <h4 className="card-title pricing-card-title">
                                <div className="row">
                                    <div className="col">
                                        <span>Wallet: </span>
                                    </div>
                                    <div className="col">
                                        <span id="eth-wallet-balance">{eth}</span>
                                        <small className="text-muted">{symbol}</small>
                                    </div>
                                </div>
                            </h4>
                            {ethDeposit &&
                            <h4 className="card-title pricing-card-title">
                                <div className="row">
                                    <div className="col">
                                        <span>Deposit: </span>
                                    </div>
                                    <div className="col">
                                        <span id="eth-market-balance">{ethDeposit}</span>
                                        <small className="text-muted">{symbol}</small>
                                    </div>
                                </div>
                            </h4>}

                            <div className="row">
                                <div className="col">
                                    <TransferModal 
                                        action="Deposit" currency="ETH" handleAction={doTransfer} disabled={!eth || eth === '0'}
                                        description={`Enter the amount of ${symbol} you wish to deposit for trading on the Charg Market`} 
                                        min={0.0} max={eth} step={0.01} digits={3} value={0} 
                                    />
                                </div>                            
                                <div className="col">
                                    <TransferModal 
                                        action="Withdraw" currency="ETH" handleAction={doTransfer} disabled={!ethDeposit}
                                        description={`Enter the amount of ${symbol} you wish to withdraw from the Charg Market`}
                                        min={0.0} max={ethDeposit} step={0.01} digits={3} value={ethDeposit || 0}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <AlertBlock message={message} setMessage={setMessage} variant="dark" />
                <AlertBlock message={warning} setMessage={setWarning} variant="warning" />
                
                <MarketOrders context={context} signResult={signResult} rates={rates} />

            </main>
            <Footer/>
        </React.Fragment>
        )
    }
};
