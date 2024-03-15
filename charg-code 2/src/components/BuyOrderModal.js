import React, { useState, useCallback, useEffect } from "react";
import { Modal, Button } from "react-bootstrap";
import AppContext from "../context/AppContext";
import { InputSpinner } from "../components/InputSpinner"
import { AlertBlock } from "../components/AlertBlock"
import config from "../app.config.json";

export const BuyOrderModal = (props) => {

  const [context] = React.useContext(AppContext);
  const [amountGive, setAmountGive] = useState(0);
  const [amountGet, setAmountGet] = useState(0);
  const [expire, setExpire] = useState(new Date(new Date().getTime() + 8640000000).toISOString().slice(0, 10));
  const [warning, setWarning] = useState('');

  const { defaultAccount, balances, currentNetworkId } = context;
  const { ethDeposit } = (balances[defaultAccount] && balances[defaultAccount][currentNetworkId]) || {};

  const baseCoin = currentNetworkId && config.networks[currentNetworkId] ? config.networks[currentNetworkId].symbol : 'ETH';
  const defaultExchangeBid = props.rates[baseCoin] ? (props.rates[baseCoin]*0.95).toFixed(5) : 'Unknown'; // todo: replace with default rate

  const [rate, setRate] = useState(0);

  const handleClose = () => props.setShow(false);

  const rateChanged = useCallback((newRate) => {
    setRate(newRate);
    setAmountGive(newRate > 0 ? amountGet * newRate : 0);
  }, [amountGet]);

  useEffect(() => {
    if ( rate === 0 && baseCoin && props.rates && props.rates[baseCoin] ) {
      setRate((props.rates[baseCoin]*0.95).toFixed(5));
    }
  },[props.rates, rate, baseCoin]);

  /*
  const rateChanged = (newRate) => {
    setRate(newRate);
    setAmountGive(newRate > 0 ? amountGet * newRate : 0);
  }
  */
  /*
  useEffect(() => {
    if ( context && context.exchangeBid && rate===defaultExchangeBid ) {
      rateChanged(context.exchangeBid)
    }
  },[context, rate, rateChanged]);
  */
  const amountGetChanged = (newGetVal) => {
    setAmountGet(newGetVal);
    setAmountGive(rate > 0 ? newGetVal * rate : 0);
  }

  const amountGiveChanged = (newGiveVal) => {
    setAmountGive(newGiveVal);
    setRate(amountGet>0 ? newGiveVal/amountGet : 0);
  }

  return (
    <>
        <Modal show={props.show} onHide={handleClose}>
          <Modal.Header closeButton>
            <Modal.Title> Add new CHG Buy Order </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <>
              <label>Enter the amount of CHG you wish to buy</label><br/>
              <InputSpinner 
                max = {ethDeposit ? ethDeposit / rate : 0} 
                value = {amountGet} min={0} step={10} digits={1} onChange={amountGetChanged}
              />
              <label>Enter the amount of {baseCoin} you will pay</label><br/>
              <InputSpinner 
                max = {ethDeposit ? ethDeposit : 0} 
                value = {amountGive} min={0} step={0.001} digits={5} onChange={amountGiveChanged}
              />
              <label>Enter CHG / {baseCoin} rate {context ? '(current market '+defaultExchangeBid+')' : ''}</label><br/>
              <InputSpinner 
                max = {100/*context ? Number(context.exchangeAsk).toFixed(5) : 0.00001*/} min={0.00001}
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
              Place Buy Order
            </Button>
          </Modal.Footer>
        </Modal>
    </>
  );
}
