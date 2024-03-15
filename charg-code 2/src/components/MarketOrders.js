import React, { useState, useEffect } from "react";
import { Button } from "react-bootstrap";
import { BuyOrderModal } from "./BuyOrderModal"
import { SellOrderModal } from "./SellOrderModal"
import { BuyModal } from "./BuyModal"
import { SellModal } from "./SellModal"
import config from "../app.config.json";
import { sendTransaction } from "../service/web3Utils";

const Row = ({ order, onClick }) => (
    <tr key={order.index} onClick={onClick}>
      <td id={order.orderHash}>
        {Number(order.rate).toFixed(7)}
      </td>
      <td>
        {Number(order.amount).toFixed(2)}
      </td>
    </tr>
);


export const MarketOrders = ({ context, signResult, rates }) => {

    const [buyOrders, setBuyOrders] = useState([]);
    const [sellOrders, setSellOrders] = useState([]);

    const [showBuyOrderModal, setShowBuyOrderModal] = useState(false);
    const [showSellOrderModal, setShowSellOrderModal] = useState(false);
    const [showBuyModal, setShowBuyModal] = useState(false);
    const [showSellModal, setShowSellModal] = useState(false);
    const [currentOrder, setCurrentOrder] = useState(false);

    const { currentProvider, defaultAccount, balances, currentNetworkId, desiredNetworkId, networks } = context;

    const handleBuyOrder = (amountGive, amountGet, expire) => {
        const amountGiveWei = currentProvider.web3.utils.toWei((+amountGive).toFixed(7), 'ether');
        const amountGetWei = currentProvider.web3.utils.toWei((+amountGet).toFixed(7), 'ether');
        const expireTimestamp = new Date(expire).getTime() / 1000;
        if (!currentProvider || !currentProvider.chargContract) {
            signResult('error', { message: 'Something went wrong, reload your browser please!' })
            return;
        }
        sendTransaction(
            currentProvider.chargContract.methods.buyOrder(amountGiveWei, amountGetWei, expireTimestamp),
            { from: defaultAccount },
            currentProvider.web3,
            (result, data) => {
                if (result==="confirmed" && data.number===0) {
                    // update table
                    let orderHash = '?';
                    try {
                        orderHash = data.receipt.logs[0].topics[1];
                    } catch (e) {
                        console.error(e);
                    };
                    setBuyOrders(prev => ([...prev, {
                        orderHash, amountGive, amountGet,
                        expire: (new Date(expire).getTime()/1000).toFixed(0),
                        buyer: defaultAccount
                    }]));
                }
                signResult(result, data);
            }
        )
    }

    const handleSellOrder = (amountGive, amountGet, expire) => {
        const amountGiveWei = currentProvider.web3.utils.toWei((+amountGive).toFixed(7), 'ether');
        const amountGetWei = currentProvider.web3.utils.toWei((+amountGet).toFixed(7), 'ether');
        const expireTimestamp = new Date(expire).getTime() / 1000;
        if (!currentProvider || !currentProvider.chargContract) {
            signResult('error', { message: 'Something went wrong, reload your browser please!' })
            return;
        }
        sendTransaction(
            currentProvider.chargContract.methods.sellOrder(amountGiveWei, amountGetWei, expireTimestamp),
            { from: defaultAccount },
            currentProvider.web3,
            (result, data) => {
                if (result==="confirmed" && data.number===0) {
                    // update table
                    let orderHash = '?';
                    try {
                        orderHash = data.receipt.logs[0].topics[1];
                    } catch (e) {
                        console.error(e);
                    };
                    setSellOrders(prev => ([...prev, {
                        orderHash, amountGive, amountGet,
                        expire: (new Date(expire).getTime()/1000).toFixed(0),
                        seller: defaultAccount
                    }]));
                }
                signResult(result, data);
            }
        );
    }

    const handleBuy = (order, value) => {
        const valueWei = currentProvider.web3.utils.toWei((+value).toFixed(7), 'ether')
        sendTransaction(
            currentProvider.chargContract.methods.buy(order.orderHash),
            { from: defaultAccount, value: valueWei },
            currentProvider.web3,
            signResult
        )
    }

    const handleSell = (order, value) => {
        const valueWei = currentProvider.web3.utils.toWei((+value).toFixed(7), 'ether');
        sendTransaction(
            currentProvider.chargContract.methods.sell(order.orderHash, valueWei),
            { from: defaultAccount },
            currentProvider.web3,
            signResult
        )
    }

    const handleCancelBuyOrder = (order) => {
        sendTransaction(
            currentProvider.chargContract.methods.cancelBuyOrder(order.orderHash),
            { from: defaultAccount },
            currentProvider.web3,
            signResult
        )
    }

    const handleCancelSellOrder = (order) => {
        sendTransaction(
            currentProvider.chargContract.methods.cancelSellOrder(order.orderHash),
            { from: defaultAccount },
            currentProvider.web3,
            signResult
        );
    }

    const updateTables = (trade) => {
        if (trade) {
            const sellOrdersTable = Object.entries(trade.sellOrders || {}).map(([hash, o], i) => ({...o, amount: o.give, index: i}))
                .filter(o=>o.amount>0.001).sort((a, b) => (a.rate > b.rate) ? 1 : (a.rate === b.rate) ? ((a.volume > b.volume) ? 1 : -1) : -1 );
            setSellOrders(sellOrdersTable);

            const buyOrdersTable = Object.entries(trade.buyOrders || {}).map(([hash, o], i) => ({...o, amount: o.get, index: i}))
                .filter(o=>o.amount>0.001).sort((a, b) => (a.rate < b.rate) ? 1 : (a.rate === b.rate) ? ((a.volume > b.volume) ? 1 : -1) : -1 );
            setBuyOrders(buyOrdersTable);
            //console.log('updateTables', { buyOrdersTable, sellOrdersTable})
        }
    }

    let baseCoinName = '?';
    let erc20CoinName = 'CHG';

    if (currentNetworkId && config.networks[currentNetworkId]) {
        baseCoinName = config.networks[currentNetworkId].symbol;
    }

    const isERC20Net = currentNetworkId === process.env.REACT_APP_ERC20_NETWORK_ID;
    const { chg, ethDeposit, chgDeposit }
        = (balances[defaultAccount] && balances[defaultAccount][currentNetworkId]) || {};
 
    useEffect(() => {
        if (currentNetworkId === desiredNetworkId && networks && networks[currentNetworkId] && networks[currentNetworkId].trade) {
            updateTables(networks[currentNetworkId].trade);
        }
    },[currentNetworkId, desiredNetworkId, networks]);

    return (
    <div className="card-deck mb-3 text-center">
        <div className="card mb-6 shadow-sm">
            <div className="card-header">
                <h5 className="my-0 font-weight-normal">Sell Orders</h5>
            </div>
            <div className="card-body">
                <div className="row">
                    <div className="col">
                        <div className="tableFixHead">
                        <table className="table table-hover table-dark">
                            <thead>
                                <tr>
                                <th scope="col">Rate <small className="text-muted">{erc20CoinName}/{baseCoinName}</small></th>
                                <th scope="col">Volume <small className="text-muted">{erc20CoinName}</small></th>
                                </tr>
                            </thead>
                            <tbody id="sell-orders-table">
                                {sellOrders.map(order => (
                                    <Row key={order.orderHash} order={order} 
                                        onClick={()=>{
                                            if (defaultAccount) {
                                                setCurrentOrder(order);
                                                setShowBuyModal(true);
                                            }
                                        }}
                                    />
                                ))}
                            </tbody>
                        </table>                                                                    
                        </div>
                        {defaultAccount && ((isERC20Net && chgDeposit && chgDeposit !== '0') || (!isERC20Net && chg && chg !== '0')) &&
                        <Button variant="outline-primary" size="md" block onClick={()=>setShowSellOrderModal(true)}>
                            New Sell Order
                        </Button>}
                    </div>                            
                </div>
            </div>
        </div>

        <div className="card mb-6 shadow-sm">
            <div className="card-header">
                <h5 className="my-0 font-weight-normal">Buy Orders</h5>
            </div>
            <div className="card-body">

                <div className="row">
                    <div className="col">
                        <div className="tableFixHead">
                        <table className="table table-hover table-dark">
                            <thead>
                                <tr>
                                <th scope="col">Rate <small className="text-muted">{erc20CoinName}/{baseCoinName}</small></th>
                                <th scope="col">Volume <small className="text-muted">{erc20CoinName}</small></th>
                                </tr>
                            </thead>
                            <tbody>
                                {buyOrders.map(order => (
                                    <Row key={order.orderHash} order={order} 
                                        onClick={()=>{
                                            if (defaultAccount) {
                                                setCurrentOrder(order);
                                                setShowSellModal(true);
                                            }
                                        }} 
                                    />
                                ))}
                            </tbody>
                        </table>                                                                    
                        </div>
                    </div>                            
                </div>
                <div className="row">
                    {/*
                    <div className="col">
                        <Button variant="outline-primary" size="md" block onClick={()=>setShowBuyOrderModal(true)}>
                            New Sell Order
                        </Button>
                    </div>                            
                    */}
                    <div className="col">
                        {defaultAccount && ethDeposit &&
                        <Button variant="outline-primary" size="md" block onClick={()=>setShowBuyOrderModal(true)}>
                            New Buy Order
                        </Button>}
                    </div>                            
                </div>

            </div>
        </div>
        <BuyOrderModal
            show = {showBuyOrderModal}
            setShow = {setShowBuyOrderModal}
            rates={rates}
            handleAction = {handleBuyOrder}
        />
        <SellOrderModal
            show = {showSellOrderModal}
            setShow = {setShowSellOrderModal}
            rates={rates}
            handleAction = {handleSellOrder}
        />
        <BuyModal
            show = {showBuyModal}
            setShow = {setShowBuyModal}
            order = {currentOrder}
            value = {0}
            handleBuy = {handleBuy}
            handleCancelSellOrder = {handleCancelSellOrder}
        />
        <SellModal
            show = {showSellModal}
            setShow = {setShowSellModal}
            order = {currentOrder}
            value = {0}
            handleSell = {handleSell}
            handleCancelBuyOrder = {handleCancelBuyOrder}
        />
    </div>
    )
}
