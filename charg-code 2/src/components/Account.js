import React, { useState, useContext } from 'react';
import { Modal, Button, Spinner, ListGroup, Form } from "react-bootstrap";
import QRCode from 'qrcode.react';

import AppContext from "../context/AppContext";
import { AlertBlock } from "../components/AlertBlock"
import config from "../app.config.json";


const SwitchNetworkModal = ({ show, setShow }) => {

    const [context, setContext] = useContext(AppContext);
    const [warning, setWarning] = useState('');

    const { currentNetworkId, desiredNetworkId, walletTypes, currentWalletType } = context || {};
    const currentWallet = currentWalletType && walletTypes.find(wt => wt.type === currentWalletType);

    const switchNetwork = (netId) => {
        setContext(_context => ({..._context,
            desiredNetworkId: netId
        }))
    };

    return (
    <Form>
        <Modal show={show} onHide={() => setShow(false)}>
            <Modal.Header closeButton>
                <p>Switch to:</p>
            </Modal.Header>
            <Modal.Body>
                {walletTypes && currentWallet && currentWallet.networks.length > 0 ?
                <ListGroup>
                        {currentWallet.networks.map(netId =>
                        <ListGroup.Item key={netId} action disabled={netId === desiredNetworkId} onClick={() => switchNetwork(netId)} >
                            <span className='ml-2 mr-2'>
                                {netId === desiredNetworkId ?
                                    currentNetworkId === desiredNetworkId
                                        ? <span className='dot dot-green'/> : <Spinner animation="border" size="sm" />
                                : <span className='dot'/>}
                            </span>
                            <span className='ml-5'>{config.networks[netId].networkName}</span>
                        </ListGroup.Item>)}
                </ListGroup> : 'Connect your wallet please'}
                <AlertBlock message={warning} setMessage={setWarning} variant="warning" />
            </Modal.Body>
            <Modal.Footer>
                <Button variant="outline-primary" onClick={() => setShow(false)}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    </Form>
    )
}


const SelectWalletModal = ({ show, setShow }) => {

    const [context, setContext] = useContext(AppContext);
    const [warning, setWarning] = useState('');
    const [clipboardTitle, setClipboardTitle] = useState('Copy Address');
    const { defaultAccount, walletTypes, currentWalletType, desiredWalletType, currentNetworkId, networks } = context || {};
    //const currentWallet = currentWalletType && walletTypes.find(wt => wt.type === currentWalletType);

    const switchWallet = (newType) => {
        setContext(_context => ({..._context,
            defaultAccount: '',
            desiredWalletType: newType
        }))
    };

    const addToAssets = async () => {
        const { currentNetworkId, currentProvider, logger } = context;
        if (!currentProvider || !currentProvider.ethereum) {
            return;
        }
        let tokenAddress;
        if (currentNetworkId === process.env.REACT_APP_ERC20_NETWORK_ID) {
            tokenAddress = currentProvider.chgTokenInstance._address;
        } else {
            tokenAddress = currentProvider.chargContract._address;
        }
        const tokenSymbol = 'CHG';
        const tokenDecimals = 18;
        const tokenImage = 'https://chgcoin.org/charg-coin.png';
        try {
          // wasAdded is a boolean. Like any RPC method, an error may be thrown.
          const wasAdded = await currentProvider.ethereum.request({
            method: 'wallet_watchAsset',
            params: {
              type: 'ERC20', // Initially only supports ERC20, but eventually more!
              options: {
                address: tokenAddress, // The address that the token is at.
                symbol: tokenSymbol, // A ticker symbol or shorthand, up to 5 chars.
                decimals: tokenDecimals, // The number of decimals in the token
                image: tokenImage, // A string url of the token logo
              },
            },
          });

          if (wasAdded) {
            logger.log('debug', 'addAsset.done', {
                currentProvider
            })
          } else {
            logger.log('debug', 'addAsset.not', {
                currentProvider
            })
          }
        } catch (err) {
            logger.log('error', 'addAsset.error', err)
        }
    }

    const getExplorer = (netId) => {
        if (defaultAccount) {
            const chain = config.networks[netId];
            if (chain && chain.explorer) {
                return chain.explorer + '/address/' + defaultAccount;
            };
        };
        return '#';
    }

    return (
    <Form>
        <Modal show={show} onHide={() => setShow(false)}>
            <Modal.Header closeButton>
                {defaultAccount ? <small>{defaultAccount}</small> : <p>Not connected</p>}
            </Modal.Header>
            <Modal.Body>
                <center>
                    {defaultAccount && <QRCode value={'ethereum:' + defaultAccount} />}
                </center>
                <div className='row'>
                    <div className="col-sm-2">
                    </div>
                    <div className="text-left">
                        Connect to:
                    </div>
                </div>
                <ListGroup defaultActiveKey="#">
                    {networks && networks[currentNetworkId] && walletTypes ? walletTypes.filter(({ type }) => type ).map(({ type, name }) =>
                    <ListGroup.Item key={type} action onClick={() => switchWallet(type)}>
                        <span className='ml-4 mr-4'>
                            {type === desiredWalletType ?
                                currentWalletType === desiredWalletType
                                    ? <span className='dot dot-green'/> : <Spinner animation="border" size="sm" />
                            : <span className='dot'/>}
                        </span>
                        <span className='ml-4'>{name}</span>
                    </ListGroup.Item>) :  <div className='loader-container'><div className='loader'></div></div>}
                </ListGroup>
                {/*balances && balances[defaultAccount] &&
                    <div className='row'>
                        <div className="col-sm-2">
                        </div>
                        <div className="col-sm-4 text-left">
                            CHG Balances:
                        </div>
                        <div className="col-sm-4 text-right">
                            <Button variant="outline-primary" size='sm' onClick={() => setContext(
                                _context => ({ ..._context, networks: { ..._context.networks }})
                            )}>
                                Update
                            </Button>
                        </div>
                    </div>
                */}
                {/*balances && balances[defaultAccount] && Object.values(balances[defaultAccount])
                //.filter(({ networkId }) => networkId !== nativeNetworkId && networkId !== currentNetworkId)
                .map(balance => {
                    const { networkId, networkName, symbol, eth, chg } = balance;
                    if ((!eth && !chg) || (eth === '0' && chg === '0')) return '';
                    return (
                        <div key={networkId} className="row">
                            <div className="col-sm-2">
                            </div>
                            <div className="col-sm-4 text-left">
                                <small>{networkName}</small>
                            </div>
                            <div className="col-sm-4 text-right">
                                <small>{chg}</small>
                            </div>
                        </div>
                    )
                }) */}
                <AlertBlock message={warning} setMessage={setWarning} variant="warning" />
            </Modal.Body>
            <Modal.Footer>
                <center>
                <Button variant="outline-primary" size='sm' onClick={() => {
                    navigator.clipboard.writeText(defaultAccount).then(() => {
                       setClipboardTitle('Address Copied!');
                       setTimeout(() => setClipboardTitle('Copy Address'), 10000);
                    }).catch(err => {
                       console.error('Clipboard error', err);
                    });
                    //var content = document.getElementById('textArea');
                    //content.select();
                    //Document.execCommand('copy')
                }}>
                    {clipboardTitle}
                </Button>
                <Button variant='outline-primary' size='sm' target='_blank' rel='noopener noreferrer' href={getExplorer(currentNetworkId)}>
                    View in Explorer
                </Button>

                <Button variant="outline-primary" size='sm' onClick={() => addToAssets()}>
                    Add CHG to assets
                </Button>
                <Button variant="outline-primary" size='sm' onClick={() => setShow(false)}>
                    Close
                </Button>
                </center>
            </Modal.Footer>
        </Modal>
    </Form>
    )
}

export const AccountButton = () => {
    const [context] = useContext(AppContext);
    const [showSwitchNetworkModal, setShowSwitchNetworkModal] = useState(false);
    const [showSelectWalletModal, setShowSelectWalletModal] = useState(false);

    const { defaultAccount, currentNetworkId, desiredNetworkId, currentNetworkName } = context || {};

    const shortAddr = defaultAccount ? defaultAccount.substr(0, 5) + '...' + defaultAccount.substr(-3) : 'Connect'; 

    return (<>
        {defaultAccount &&
        <Button variant='outline-primary' size='sm' className='ml-2 btn-round' onClick={() => setShowSwitchNetworkModal(true)}>
            {currentNetworkId === desiredNetworkId && <span className='mr-2 dot dot-green'/>}
            {currentNetworkName ? currentNetworkName : 'Unknown'}
        </Button>}
        <Button variant='outline-primary' size='sm' className='mr-4 ml-2 btn-round' onClick={() => setShowSelectWalletModal(true)}>
            {defaultAccount && <span className='mr-2 dot dot-green'/>}
            {shortAddr}
        </Button>
        <SwitchNetworkModal show={showSwitchNetworkModal} setShow={setShowSwitchNetworkModal} />
        <SelectWalletModal show={showSelectWalletModal} setShow={setShowSelectWalletModal} />
    </>)
}


