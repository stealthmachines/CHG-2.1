import React, { useState, useContext, useEffect } from "react";
import { Modal, Button } from "react-bootstrap";
import AppContext from "../context/AppContext";
import { InputSpinner } from "../components/InputSpinner"
import { AlertBlock } from "../components/AlertBlock"
import config from "../app.config.json";

export const SellOrderModal = (props) => {

  const [context] = useContext(AppContext);
  const [amountGive, setAmountGive] = useState(0);
  const [amountGet, setAmountGet] = useState(0);
  const [expire, setExpire] = useState(new Date(new Date().getTime() + 8640000000).toISOString().slice(0, 10));
  const [warning, setWarning] = useState('');

  const { defaultAccount, balances, currentNetworkId } = context;
  const { chg, chgDeposit } = (balances[defaultAccount] && balances[defaultAccount][currentNetworkId]) || {};

  const baseCoin = currentNetworkId && config.networks[currentNetworkId] ? config.networks[currentNetworkId].symbol : 'ETH';

  const defaultExchangeAsk = props.rates[baseCoin] ? (props.rates[baseCoin]*1.05).toFixed(5) : 'Unknown'; // todo: replace with default rate
  const [rate, setRate] = useState(0);
  
  const handleClose = () => props.setShow(false);

  const rateChanged = (newRate) => {
    if (newRate > 0) {
      setRate(newRate);
      setAmountGet(amountGive * newRate);
    }
  }

  /*
  useEffect(() => {
    if ( context && context.exchangeBid && rate===defaultExchangeAsk ) {
      rateChanged(context.exchangeAsk)
    }
  },[context, rate]);
  */
  useEffect(() => {
    if ( rate === 0 && baseCoin && props.rates && props.rates[baseCoin] ) {
        setRate((props.rates[baseCoin]*1.05).toFixed(5)); 
    }
  },[props.rates, baseCoin, rate]);

  const amountGetChanged = (newGetVal) => {
    setAmountGet(newGetVal);
    if (amountGive > 0) {
      setRate(newGetVal / amountGive);
    } else if (rate > 0) {
      setAmountGive(newGetVal / rate);
    }
  }

  const amountGiveChanged = (newGiveVal) => {
    setAmountGive(newGiveVal);
    if (rate > 0) {
      setAmountGet(newGiveVal * rate);
    } else if (newGiveVal > 0) {
      setRate(amountGet / newGiveVal);
    }
  }
  
  return (
    <>
        <Modal show={props.show} onHide={handleClose}>
          <Modal.Header closeButton>
            <Modal.Title> Add new CHG Sell Order </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <>
              <label>Enter the amount of CHG you wish to sell</label><br/>
              <InputSpinner 
                max = {chgDeposit ? chgDeposit : chg} 
                value = {amountGive} min={0} step={10} digits={1} onChange={amountGiveChanged}
              />
              <label>Enter the amount of {baseCoin} you wish to get</label><br/>
              <InputSpinner 
                max = {10} 
                value = {amountGet} min={0} step={0.001} digits={5} onChange={amountGetChanged}
              />
              <label>Enter CHG / {baseCoin} rate {context ? '(current market '+defaultExchangeAsk+')' : ''}</label><br/>
              <InputSpinner 
                max = {100} min={/*context ? Number(context.exchangeBid).toFixed(5) : */0.00001}
                value = {rate} step={0.00001} digits={7} onChange={rateChanged}
              />
            </>
            <AlertBlock message={warning} setMessage={setWarning} variant="warning" />
          </Modal.Body>
          <Modal.Footer>
            <label>Expire on</label>
            <div style={{ marginRight: 0, marginLeft: 'auto' }}>
              <input
                style={{ backgroundColor: '#2c3d4e', color: '#fff' }}
                type='date'
                value = {expire}
                onChange={e => setExpire(e.target.value)}
              />
            </div>
            <Button variant="outline-primary" onClick={handleClose}>
                Close
            </Button>
            <Button variant="outline-primary" 
                onClick={()=>{
                  if (amountGive > 0 && amountGet > 0) {
                    props.handleAction(amountGive, amountGet, expire);
                    handleClose();
                  }else{
                    setWarning('Wrong value');
                  }
                }}
            >
              Place Sell Order
            </Button>
          </Modal.Footer>
        </Modal>
    </>
  );
}
