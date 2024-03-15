import React, { useContext, useState, useEffect } from "react";
import { Button, Form } from "react-bootstrap";
import AppContext from "../context/AppContext";
//import request from 'request-promise-native';

import { InputSpinner } from "../components/InputSpinner"
import { InputAddress } from "../components/InputAddress"

import { Header } from "./Header";
import { Footer } from "./Footer";

import { AlertBlock } from "../components/AlertBlock"

import { sendTransaction } from "../service/web3Utils";

import config from "../app.config.json";

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

const BridgeBlock = ({ context, setContext }) => {

    const { currentProvider, defaultAccount, balances, currentNetworkId, walletTypes, currentWalletType } = context;
    const currentWallet = currentWalletType && walletTypes.find(wt => wt.type === currentWalletType);

    const { symbol, eth, chg, allowance }
        = (defaultAccount && balances[defaultAccount] && balances[defaultAccount][currentNetworkId]) || {};

    const [transferToAnother, setTransferToAnother] = useState(false);
    const [toAddress, setToAddress] = useState('');

    const [value, setValue] = useState(10);

    const [message, setMessage] = useState('');
    const [warning, setWarning] = useState('');

    const isERC20Net = currentNetworkId === process.env.REACT_APP_ERC20_NETWORK_ID;
    const isNativeNet = currentNetworkId === process.env.REACT_APP_NATIVE_NETWORK_ID;

    const [toNetwork, setToNetwork] = useState(isNativeNet ? process.env.REACT_APP_ERC20_NETWORK_ID : process.env.REACT_APP_NATIVE_NETWORK_ID);

    const fee = toNetwork === process.env.REACT_APP_NATIVE_NETWORK_ID ? 0 :
        toNetwork === process.env.REACT_APP_ERC20_NETWORK_ID ? 100 : 20;

    useEffect(() => {
        if (toNetwork === currentNetworkId) {
            setToNetwork(
                currentNetworkId === process.env.REACT_APP_NATIVE_NETWORK_ID
                    ? process.env.REACT_APP_ERC20_NETWORK_ID : process.env.REACT_APP_NATIVE_NETWORK_ID
            )
        }
    }, [toNetwork, currentNetworkId]);

    const signResult = (result, data) => {
        if (result === "error") {
            setWarning(('The transaction was not signed !\n' + data.message));
            return;
        }
        const message = {};
        if (result==="confirmed" && data.number===0) {
            setContext(
                _context => ({ ..._context, networks: { ..._context.networks }})
            );
            setTimeout(() => setContext(
                _context => ({ ..._context, networks: { ..._context.networks }})
            ), 20000);// in 20 sec on another net
            message.hash = data.receipt.transactionHash;
            message.color = '#317418';
            message.faClass = 'fa fa-check';
            message.info = " on block number " + data.receipt.blockNumber;
        } else if (result==="signed") {
            message.hash = data;
            message.color = '#b3890c';
            message.faClass = 'fa fa-spinner fa-spin';
            message.info = '. Please wait for confirmation ... ';
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
                href={config.networks[currentNetworkId].explorer + '/tx/' + message.hash} 
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

    const handleStart = () => {
        if (!currentProvider || !currentProvider.chargContract) {
            signResult('error', { message: 'Something went wrong, reload your browser please!' })
            return;
        }
        const { web3, chargContract } = currentProvider;
        const amountWei = web3.utils.toWei((+value).toFixed(7), 'ether');

        const agreeText = `I agree to transfer ${value} CHG from ${config.networks[currentNetworkId].networkName}
            to ${config.networks[toNetwork].networkName} where I will get ${(value-fee).toFixed(0)} CHG.
            Account ${defaultAccount}. Transfer started at ${Date.now()}
        `;
        const hash = web3.utils.sha3(agreeText);

        fetch(apiUrl, {
            ...fetchOptions,
            body: JSON.stringify({
                method: 'addSwap',
                data: { text: agreeText }
            })
        }).then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch.');
            }
            return response.json();
        }).then(res => {
             if (res.result) {
                // setPaymentData(res.result);
            }
        }).catch(console.error);

        //web3.personal.sign(web3.utils.fromUtf8(agreeText), defaultAccount).then( signedText => {
        //web3.eth.sign(web3.utils.fromUtf8(agreeText), defaultAccount).then( signedText => {
        //    const hash = web3.utils.sha3(signedText);
        //    console.log({ signedText, hash });

        if (isNativeNet) {
            if (transferToAnother) {
                sendTransaction(
                    chargContract.methods.startSwapTo(toAddress, toNetwork, hash),
                    { from: defaultAccount, value: amountWei },
                    web3,
                    signResult
                );
            } else {
                sendTransaction(
                    chargContract.methods.startSwap(toNetwork, hash),
                    { from: defaultAccount, value: amountWei },
                    web3,
                    signResult
                );
            }
        } else {
            if (transferToAnother) {
                sendTransaction(
                    chargContract.methods.startSwapTo(toAddress, amountWei, toNetwork, hash),
                    { from: defaultAccount },
                    web3,
                    signResult
                );
            } else {
                sendTransaction(
                    chargContract.methods.startSwap(amountWei, toNetwork, hash),
                    { from: defaultAccount },
                    web3,
                    signResult
                );
            }
        }
        //});
    }

    if (!config.networks[currentNetworkId]) {
        return ''; // not supported network
    }

    return (<>
    <AlertBlock message={message} setMessage={setMessage} variant="dark" />
    <AlertBlock message={warning} setMessage={setWarning} variant="warning" />

    <div className="card-deck mb-2 text-center">
        <div className="card mb-12 lg-6 md-12 sm-12 shadow-sm">
            <div className="card-header">
                <h4 className="my-0 font-weight-normal">Bridge</h4>
            </div>
            <div className="card-body">
                
                {(!isERC20Net || Number(allowance) > 0) && (<>
                
                <div className="row">
                    <div className="col">
                        <label>Transfer <b>&nbsp;CHG&nbsp;</b> from <b>&nbsp;{config.networks[currentNetworkId].networkName}&nbsp;</b></label>
                    </div>
                </div>
                <div className="row text-center">
                    <div className="col text-center">
                        <InputSpinner style={{maxWidth:'200px', margin:'auto'}}
                            max = {Math.min(chg || 10, 10000)}
                            value = {value}
                            min={10} step={10} digits={1} onChange={setValue}
                        />
                    </div>
                </div>
                <div className="row">
                    <div className="col">
                        To
                    </div>
                </div>
                <div className="row">
                    <div className="col">
                        {walletTypes && currentWallet && currentWallet.networks.length > 0 ? <>
                            <select className='custom-select' style={{maxWidth:'200px'}}
                                onChange={e => setToNetwork(e.target.value)}
                                value={toNetwork}
                            >
                                {currentWallet.networks.filter(netId => netId !=='' && netId !== currentNetworkId).map(netId => ( 
                                    <option value={netId.toString()} key={netId}>{config.networks[netId].networkName}</option>
                                ))}
                            </select>
                        </> : ''}
                    </div>
                </div>
                <div className="row">
                    <div className="col">
                        <Form.Check type="checkbox" value={transferToAnother} onChange={() => setTransferToAnother(r => !r)} label="transfer to another address" />
                    </div>
                </div>
                {transferToAnother &&
                <div className="row">
                    <div className="col">
                        <InputAddress placeholder="Wallet address" address={toAddress} setAddress={setToAddress} />
                    </div>
                </div>
                }
                </>)}

                <br/>
                <div className="row">
                    <div className="col text-center">
                        {(isERC20Net && Number(allowance)===0) ? (// || context.balances.allowance.lt(10**6)) ? (
                            <Button onClick={handleUnlock} size="md" variant="outline-primary" >
                                Unlock
                            </Button>
                            ):(
                            <Button onClick={()=>handleStart()} size="md" variant="outline-primary" disabled={value - fee <= 0}>
                                Start transfer
                            </Button>
                        )}
                    </div>
                </div>
                <br/>

                { (!isERC20Net || Number(allowance) > 0) && (value - fee) > 0 ? (
                <div className="row">
                    <div className="col">
                        <small>
                            Clicking on <b>&nbsp;'Start transfer'&nbsp;</b> you will deposit and lock <b>&nbsp;{value}&nbsp;</b> CHG coins<br/>
                            on the smart contract of <b>&nbsp;{config.networks[currentNetworkId].networkName}&nbsp;</b> and after validation you will get <br/>
                            <b>&nbsp;{(value - fee).toFixed(0)}&nbsp;</b> CHG coins on <b>&nbsp;{config.networks[toNetwork].networkName}&nbsp;</b>.<br/>
                            It will take 1-10 minutes for you to see your balance on <b>&nbsp;{config.networks[toNetwork].networkName}&nbsp;</b>.<br/>
                            Moving your funds back to <b>&nbsp;{config.networks[currentNetworkId].networkName}&nbsp;</b> (if you later wish to do so)<br/>
                            can require some fee, depending on gas price of the network.
                        </small>
                    </div>
                </div>
                ):(
                    <div className="row">
                        <div className="col">
                            <small>
                                Minimal amount is {fee + 5} CHG
                            </small>
                        </div>
                    </div>
                )}


            </div>
        </div>
        <div className="card mb-12 lg-6 md-12 sm-12 shadow-sm">
            <div className="card-header">
                <h4 className="my-0 font-weight-normal">Balances</h4>
            </div>
            <div className="card-body">
                <div className="row">
                    <div className="col-md-12">
                        <div>
                            <small className="text-muted">{config.networks[currentNetworkId].networkName}</small>
                        </div>
                        <div>
                            <span id="chg-wallet-balance">{chg}</span>
                            <small className="text-muted">CHG</small>
                        </div>
                        <div>
                            <span id="chg-wallet-balance">{eth}</span>
                            <small className="text-muted">{eth ? symbol : ''}</small>
                        </div>
                        <br/>
                        {balances && balances[defaultAccount] && Object.values(balances[defaultAccount])
                        .filter(({ networkId }) => networkId !== currentNetworkId)
                        .map(balance => {
                            const { networkId, networkName, symbol, eth, chg } = balance;
                            if ((!eth && !chg) || (eth === '0' && chg === '0')) return '';
                            return (
                                <div key={networkId} className="row">
                                    <div className="col-sm-1">
                                    </div>
                                    <div className="col-sm-4 text-left">
                                        <small>{networkName}</small>
                                    </div>
                                    <div className="col-sm-3 text-right">
                                        {chg}<small className="text-muted">{chg ? 'CHG' : ''}</small> 
                                    </div>
                                    <div className="col-sm-3 text-right">
                                        {eth}<small className="text-muted">{eth ? symbol : ''}</small> 
                                    </div>
                                </div>
                            )
                        })}
                        <br/>
                        <span>
                            <Button variant="outline-primary" size='sm' onClick={() => setContext(
                                _context => ({ ..._context, networks: { ..._context.networks }})
                            )}>
                                Update
                            </Button>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</>)}

export const Bridge = () => {

    const [context, setContext] = useContext(AppContext);
    const [message, setMessage] = useState('');
    const [warning, setWarning] = useState('');

    const { currentProvider, defaultAccount, currentNetworkId } = context;

    const notSupportedNetwork = !process.env.REACT_APP_SUPPORTED_NETWORKS.split(',').includes(currentNetworkId);

    if (!currentProvider || !currentProvider.web3 || !defaultAccount || defaultAccount.length < 20 ) {
        return (
        <React.Fragment>
            <Header title='Charg Coin Bridge' />
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

                <center>

                </center>

            </main>

        </React.Fragment>
        )
    }else{
        return (
        <React.Fragment>
        <Header title='Charg Bridge' />
            <main role="main" className="inner cover">
                <br/>
                <p className="lead">Using the power of the blockchain, <a target="_blank"  rel="noopener noreferrer" href="https://chgcoin.org/"><b>Charg Coin (CHG)</b></a> facilitates crowdsourced energy distribution.</p>

                {notSupportedNetwork && <h2 className='blinking'>Switch your network to one of supported chains please!</h2> }

                <div id="mobile"></div>

                <BridgeBlock context={context} setContext={setContext}/>

                <AlertBlock message={message} setMessage={setMessage} variant="dark" />
                <AlertBlock message={warning} setMessage={setWarning} variant="warning" />

            </main>
            <Footer/>
        </React.Fragment>
        )
    }
};
