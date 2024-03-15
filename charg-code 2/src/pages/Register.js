import React, { useContext, useEffect, useState } from "react";
// import GoogleMapReact from 'google-map-react';
import { GoogleApiWrapper, Map, Marker } from 'google-maps-react';

import AppContext from "../context/AppContext";
// import request from 'request-promise-native';

import { Header } from "./Header";
import { Footer } from "./Footer";

import { AlertBlock } from "../components/AlertBlock"
import { InputSpinner } from "../components/InputSpinner"

import { sendTransaction } from "../service/web3Utils";

import config from "../app.config.json";

const Register = (props) => {
    const [context, setContext] = useContext(AppContext);
    const [message, setMessage] = useState('');
    const [warning, setWarning] = useState('');
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [phone, setPhone] = useState('');
    const [connector, setConnector] = useState('');
    const [power, setPower] = useState('');

    const [latitude, setLatitude] = useState(context.geolocation[0]);
    const [longitude, setLongitude] = useState(context.geolocation[1]);

    const [chargRate, setChargRate] = useState(20);
    const [parkRate, setParkRate] = useState(2);
    const [wifiRate, setWifiRate] = useState(5);

    //const [geoLocation, setGeoLocation] = React.useState(LOS_ANGELES_CENTER);
    const [mapCenter, setMapCenter] = React.useState(context.geolocation);
    const [mapZoom, setMapZoom] = React.useState(12);

    const { currentProvider, defaultAccount, balances, currentNetworkId } = context;

    const { chgWei }
        = (defaultAccount && balances[defaultAccount] && balances[defaultAccount][currentNetworkId]) || { chgWei: 0 };

    const changeLocation = (marker, map, loc) => {
        setLongitude(loc.latLng.lng());
        setLatitude(loc.latLng.lat());
    }

    const doRegister = async () => {
        // check if enough balance
        setContext(_context => ({ ..._context, networks: { ..._context.networks }})); // this will update balances, TODO
        const minBalanceWei = await currentProvider.chargContract.methods.minCoinsBalance().call();
        const minBalance = Number(currentProvider.web3.utils.fromWei(minBalanceWei, 'ether'));
        const nodeBalance = Number(currentProvider.web3.utils.fromWei(chgWei, 'ether'));
        if (nodeBalance < minBalance) {
            setWarning(`The current account balance is ${nodeBalance.toFixed(1)} CHG. To register the node at least ${minBalance.toFixed(1)} CHG required!\n`);
            return;
        }
        const latitudeMul = (latitude * 10**7).toFixed(0);
        const longitudeMul = (longitude * 10**7).toFixed(0);
        const chargRateWei = currentProvider.web3.utils.toWei(Math.fround(chargRate / 3600).toFixed(17), 'ether');
        const parkRateWei = currentProvider.web3.utils.toWei(Math.fround(parkRate / 3600).toFixed(17), 'ether');
        const wifiRateWei = currentProvider.web3.utils.toWei(Math.fround(wifiRate / 3600).toFixed(17), 'ether');
        sendTransaction(
            currentProvider.chargContract.methods.registerNode(latitudeMul, longitudeMul, name, location, phone, connector, power, chargRateWei, parkRateWei, wifiRateWei),
            { from: defaultAccount, gas: 15000000 },
            //{ from: defaultAccount, maxFeePerGas: '0x100000000000' },
            currentProvider.web3,
            signResult
        );
    }

    const signResult = (result, data) => {
        if (result === "error") {
            setWarning(('The transaction was not signed !\n' + data.message));
            return;
        }
        const message = {};
        if (result==="confirmed" && data.number===0) {
            // TODO check if that was register action
            setContext(_context => {
                const { registeredNodes } = _context;
                registeredNodes[defaultAccount] = {
					addr: defaultAccount,
                    networkId: currentNetworkId,
                    latitude,
                    longitude,
                    name,
                    location,
                    phone,
                    connector,
                    power
                };
                return { ..._context, registeredNodes }
            });
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

    useEffect(() => {
        if (typeof navigator !== "undefined" && typeof navigator.geolocation !== "undefined") {
            navigator.geolocation.getCurrentPosition( loc => {
                const curLocation = [loc.coords.latitude, loc.coords.longitude];
                setLatitude(loc.coords.latitude);
                setLongitude(loc.coords.longitude);
                //setGeoLocation(curLocation);
                setContext(prev => ({ ...prev, geolocation: curLocation}))
                setMapCenter(curLocation);
                setMapZoom(17)
            }, error => {
                if (error.code === 1) {
                    console.error("Error: PERMISSION_DENIED: User denied access to their location");
                } else if (error.code === 2) {
                    console.error("Error: POSITION_UNAVAILABLE: Network is down or positioning satellites cannot be reached");
                } else if (error.code === 3) {
                    console.error("Error: TIMEOUT: Calculating the user's location too took long");
                } else {
                    console.error("Unexpected error code")
                }
            })
        } else {
            console.log("Your browser does not support the HTML5 Geolocation API, so this demo will not work.")
        }
    }, [setContext]);

    useEffect(() => {
        if (context.registeredNodes.hasOwnProperty(context.defaultAccount)) {
            const _node = context.registeredNodes[context.defaultAccount];
            setName(_node.name);
            setLocation(_node.location);
            setPhone(_node.phone);
            setConnector(_node.connector);
            setPower(_node.power);
            setLatitude(_node.latitude);
            setLongitude(_node.longitude);
        }
    }, [context.registeredNodes, context.currentNetworkId, context.defaultAccount]);

    const notSupportedNetwork = !process.env.REACT_APP_SUPPORTED_NETWORKS.split(',').includes(context.currentNetworkId); // TODO .env !!!

    if (!context.defaultAccount || context.defaultAccount.length < 20 ) {
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
            </main>

            <Footer/>
        </React.Fragment>
        )
    }else{
        return (
        <React.Fragment>
        <Header title='Register Node Station' />
            <main role="main" className="inner cover">
                <br/>
                <p className="lead">Using the power of the blockchain, <a target="_blank"  rel="noopener noreferrer" href="https://chgcoin.org/"><b>Charg Coin (CHG)</b></a> facilitates crowdsourced energy distribution.</p>

                {notSupportedNetwork && <h2 className='blinking'>Switch your network to one of supported chains please!</h2> }

                <div id="mobile"></div>

                <AlertBlock message={message} setMessage={setMessage} variant="dark" />
                <AlertBlock message={warning} setMessage={setWarning} variant="warning" />

                <div className="row">
                    <div className="col-sm-6">
                        <div className="card">
                            <div className="card-body">
                                <h5 style={{minWidth: '100%'}}> Enter node parameters and select location</h5>
                                <hr/>

                                <div className="form-group">
                                    <div className="input-group">
                                        <h5 style={{minWidth: '30%'}}> Name : </h5>
                                        <input type="text" className="form-control" aria-label="Node Name" placeholder="Node Name" value={name} onChange={e => setName(e.target.value)}/>
                                    </div>
                                    <div className="input-group">
                                        <h5 style={{minWidth: '30%'}}> Location : </h5>
                                        <input type="text" className="form-control" id="input-register-node-location" aria-label="Location Address" placeholder="Location Address"  value={location} onChange={e => setLocation(e.target.value)}/>
                                    </div>
                                    <div className="input-group">
                                        <h5 style={{minWidth: '30%'}}> Phone : </h5>
                                        <input type="text" className="form-control" id="input-register-node-phone" aria-label="Phone" placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)}/>
                                    </div>
                                    <div className="input-group">
                                        <h5 style={{minWidth: '30%'}}> Connector : </h5>
                                        <input type="text" className="form-control" id="input-register-node-connector" aria-label="Connector Type" placeholder="Connector Type" value={connector} onChange={e => setConnector(e.target.value)}/>
                                    </div>

                                    <div className="input-group">
                                        <h5 style={{minWidth: '30%'}}> Power : </h5>
                                        <input type="text" className="form-control" id="input-register-node-power" aria-label="Charg station power" placeholder="Charg station power" value={power} onChange={e => setPower(e.target.value)}/>
                                    </div>
        
                                    <div className="input-group">
                                        <h5 style={{minWidth: '30%', paddingTop: '15px'}}> Charg : </h5>
                                        <InputSpinner
                                            placeholder="CHG/Hour Cost"
                                            max = {10000}
                                            value = {chargRate}
                                            min={0} step={1} digits={3} onChange={setChargRate}
                                        />
                                        <h5 className="text-muted" style={{paddingTop: '15px'}}>CHG/Hour</h5>
                                    </div>

                                    <div className="input-group">
                                        <h5 style={{minWidth: '30%', paddingTop: '15px'}}> Park : </h5>
                                        <InputSpinner
                                            placeholder="CHG/Hour Cost"
                                            max = {10000}
                                            value = {parkRate}
                                            min={0} step={1} digits={3} onChange={setParkRate}
                                        />
                                        <h5 className="text-muted" style={{paddingTop: '15px'}}>CHG/Hour</h5>
                                    </div>
            
                                    <div className="input-group">
                                        <h5 style={{minWidth: '30%', paddingTop: '15px'}}> WiFi : </h5>
                                        <InputSpinner
                                            placeholder="CHG/Hour Cost"
                                            max = {10000}
                                            value = {wifiRate}
                                            min={0} step={1} digits={3} onChange={setWifiRate}
                                        />
                                        <h5 className="text-muted" style={{paddingTop: '15px'}}>CHG/Hour</h5>
                                    </div>
                                    <button type="button" className="btn btn-block btn-outline-primary" onClick={doRegister}>
                                        {context.registeredNodes.hasOwnProperty(context.defaultAccount) ? 'Update Registration' : 'Register'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-sm-6">
                        <div className="card">
                            <div className="card-body">
                                <p id="location-info" style={{minWidth: '100%'}}>
                                    Move the <img src='//maps.google.com/mapfiles/ms/icons/green-dot.png' alt='?'/> marker to the place where your station is located
                                </p>

                                <div className="input-group" style={{height: '450px', paddingTop: '10px'}}>
                                    <Map
                                        google={props.google}
                                        zoom={mapZoom}
                                        mapType='hybrid'
                                        initialCenter={{
                                            lat: mapCenter[0],
                                            lng: mapCenter[1]
                                        }}
                                    >
                                        <Marker
                                            draggable={true}
                                            onDragend={changeLocation}
                                            position={{lat: latitude, lng: longitude}}
                                            //onClick={console.log}
                                            name={name}
                                            icon={{
                                                url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
                                                //anchor: new props.google.maps.Point(32,32),
                                                //scaledSize: new props.google.maps.Size(64,64)
                                            }}
                                        />
                                    </Map>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </main>
            <Footer/>
        </React.Fragment>
        )
    }
};

export default GoogleApiWrapper(
    (props) => ({
      apiKey: process.env.REACT_APP_MAP_KEY // props.apiKey
    }
))(Register)
