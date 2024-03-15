import React, { useContext, useState, useEffect } from "react";
import GoogleMapReact from 'google-map-react';
import AppContext from "../context/AppContext";
import { Header } from "./Header";
import { Footer } from "./Footer";
import config from "../app.config.json";

const now = Math.round(Date.now() / 1000);

// InfoWindow component
const InfoWindow = (props) => {
  const { place, connected } = props;
  const infoWindowStyle = {
    position: 'relative',
    borderRadius: '10%',
    border: '2px solid #c8d9ea',
    bottom: 90,
    left: '-45px',
    width: 150,
    backgroundColor: '#212c38',
    boxShadow: '0 2px 7px 1px rgba(0, 255, 255, 0.3)',
    padding: 1,
    fontSize: 14,
    zIndex: 100,
  };

  /* // feedback
    <div style={{ fontSize: 14 }}>
    <span style={{ color: 'grey' }}>
        {4.5}{' '}
    </span>
    <span style={{ color: 'orange' }}>
        {String.fromCharCode(9733).repeat(Math.floor(4))}
    </span>
    <span style={{ color: 'lightgrey' }}>
        {String.fromCharCode(9733).repeat(5 - Math.floor(4))}
    </span>
    </div>
  */

  return (
    <div style={infoWindowStyle}>
      <div style={{ fontSize: 16 }}>
        <a href={'/service/'+place.addr}>{place.name}</a>
      </div>
      <div style={{ fontSize: 14, color: '#c8d9ea' }}>
        <a
            target='_blank' rel='noOpener noReferrer'
            href={config.networks[place.networkId].explorer + '/address/' + place.addr}
        >
            {config.networks[place.networkId].networkName}
        </a>
      </div>
      <div style={{ fontSize: 14, color: 'light-orange' }}>
        {place.connector} - {place.power}
      </div>
      <div style={{ fontSize: 14, color: '#c8d9ea' }}>
        <a href={'tel:'+place.phone}>{place.phone}</a>
      </div>
      <div style={{ fontSize: 14, color: '#c8d9ea' }}>
        {connected ? (<a href={'/service/'+place.addr}>Welcome!</a>) : ''}
      </div>
    </div>
  );
};

// Marker component
const Marker = (props) => {
  // const [context] = useContext(AppContext);
  const connected = props.place.updated && now-props.place.updated < 600
  const markerStyle = {
    //border: '3px solid ' + (props.place.networkId === context.currentNetworkId ? 'rgb(100 255 80)' : 'yellow'),
    border: '3px solid ' + ( connected ? 'rgb(100 255 80)' : 'yellow'),
    borderRadius: '30%',
    height: 30,
    width: 30,
    backgroundColor: '#212c38',
    //backgroundColor: props.show ? 'red' : 'blue',
    cursor: 'pointer',
    animation: 'blinkingText 2.8s infinite',
    zIndex: 10,
  };
  return (
    <>
      <div style={markerStyle}>
        <img style={{width:'100%'}} src='/images/logo.png' alt='CHG'/>
      </div>
      {props.show && <InfoWindow place={props.place} connected={connected} />}
    </>
  );
};



export const Home = () => {

    const [context, setContext] = useContext(AppContext);
    const [registeredNodes, setRegisteredNodes] = useState([]);
    const [mapCenter, setMapCenter] = useState(context.geolocation);
    const [mapZoom, setMapZoom] = useState(5);

    useEffect(() => {
        if (typeof navigator !== "undefined" && typeof navigator.geolocation !== "undefined") {
            navigator.geolocation.getCurrentPosition( loc => {
                const curLocation = [loc.coords.latitude, loc.coords.longitude];
                //setGeoLocation(curLocation);
                setContext(prev => ({ ...prev, geolocation: curLocation}))
                setMapCenter(curLocation)
                setMapZoom(11)
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
        const [lat, lon] = context.geolocation;
        const nodesSorted = Object.values(context.registeredNodes)
            .map(node => {
                // simplified for now, just to sort, TODO better calc to show in table
                node.distance = (node.latitude - lat)**2 + (node.longitude - lon)**2;
                return node;
            }).sort((a, b) => (a.distance > b.distance) ? 1 : -1)
        setRegisteredNodes(nodesSorted);
    }, [context.registeredNodes, context.geolocation]);

    // onChildClick callback can take two arguments: key and childProps
    const onChildClickCallback = (key, childProps, onTableClick=false) => {
        const index = registeredNodes.findIndex(e => e.addr === key);
        //console.log('onChildClickCallback', key, childProps, onTableClick, index)
        const newNodesState = [...registeredNodes];
        //console.log(index, key, childProps);
        if (onTableClick) {
            setMapCenter([newNodesState[index].latitude, newNodesState[index].longitude]);
            setMapZoom(14);
            // newNodesState[index].show = true;
        } else {
            newNodesState[index].show = !newNodesState[index].show;
            setRegisteredNodes(newNodesState);
        }
    };


    return (
    <>
        <Header title='Energy is Money' />
        <main role="main" className="inner cover">
            <br/>
            <p className="lead">Using the power of the blockchain, <a target="_blank" rel="noopener noreferrer" href="https://chgcoin.org/"><b>Charg Coin (CHG)</b></a> facilitates crowdsourced energy distribution.</p>

            <br/>
            <p> 
                This decentralized cross-chain application will help you to start any service with powerful <a target="_blank" rel="noopener noreferrer" href="https://chgcoin.org/"><b>Charg Network</b></a>.
                You can use it with any legacy Web3 browser, like <a target="_blank" rel="noopener noreferrer" href="https://wallet.coinbase.com/"><b>Coinbase Wallet</b></a> or <a target="_blank" rel="noopener noreferrer" href="https://www.myetherwallet.com/"> <b>MyEtherWallet</b></a> 
                &nbsp; as well as with browser extensions like <a target="_blank" rel="noopener noreferrer" href="https://metamask.io"><b>Metamask</b></a> or <a target="_blank" rel="noopener noreferrer" href="https://chrome.google.com/webstore/detail/nifty-wallet/jbdaocneiiinmjbjlgalhcelgbejmnid"><b>Nifty Wallet</b></a>
                &nbsp; and sure with remote wallets like <a target="_blank" rel="noopener noreferrer" href="https://portis.io/"> <b>Portis</b></a> or <a target="_blank" rel="noopener noreferrer" href="https://fortmatic.com/"> <b>Fortmatic</b></a> and many others.
            </p>
            <div id="mobile"></div>

            {(!context || !context.defaultAccount) ?
            <center>
                <p>If you want to sell or buy CHG Coins you need to connect to you blockchain wallet.</p>
                <br/>
            </center>
            : '' 
            }

            <div className="card mb-12 shadow-sm charg-block">
                <div className="card-body">
                    {
                    <GoogleMapReact 
                        zoom={mapZoom}
                        bootstrapURLKeys={{ key: process.env.REACT_APP_MAP_KEY }}
                        options={map => ({ mapTypeId: map.MapTypeId.HYBRID })}
                        //defaultCenter={context.geolocation}
                        //defaultCenter={mapCenter}
                        center={mapCenter}
                        onChildClick={onChildClickCallback}
                        style={{height:'400px'}}
                    >
                        {registeredNodes.map(station => (
                            <Marker
                                key={station.addr}
                                id={station.addr}
                                addr={station.addr}
                                lat={station.latitude}
                                lng={station.longitude}
                                show={station.show}
                                place={station}
                            />
                        ))}
                    </GoogleMapReact>
                    }
                </div>
            </div>

            <div className="card mb-12 shadow-sm charg-block">
                <div className="card-body">
                    <div className="row">
                        <div className="col">
                            <div className="tableFixHead">
                            <table className="table table-hover table-dark">
                                <thead>
                                    <tr>
                                    <th scope="col">Name</th>
                                    <th scope="col">Location</th>
                                    <th scope="col">Phone</th>
                                    <th scope="col">Connector</th>
                                    <th scope="col">Power</th>
                                    </tr>
                                </thead>
                                <tbody id="nodes-list-table">
                                    {registeredNodes.map(station => (
                                        <tr key={station.addr} onClick={()=>onChildClickCallback(station.addr, station, true)}>
                                        <td>{station.name}</td>
                                        <td>{station.location}</td>
                                        <td>{station.phone}</td>
                                        <td>{station.connector}</td>
                                        <td>{station.power}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            </div>
                            <button type="button" className="btn btn-block btn-outline-primary">
                                Register your node
                            </button>
                        </div>                            
                    </div>
                </div>
            </div>
        </main>
        <Footer/>
    </>
    )
};
