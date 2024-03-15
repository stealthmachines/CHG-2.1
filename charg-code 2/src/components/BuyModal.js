import React, { useState } from "react";
import AppContext from "../context/AppContext";
import { Modal, Button } from "react-bootstrap";
import { InputSpinner } from "../components/InputSpinner"
import { AlertBlock } from "../components/AlertBlock"
import config from "../app.config.json";

export const BuyModal = (props) => {

    const [value, setValue] = useState(props.value);
    const [warning, setWarning] = useState('');
    const [context] = React.useContext(AppContext);
    const handleClose = () => props.setShow(false);

    const { defaultAccount, balances, currentNetworkId } = context;
    const { eth } = (balances[defaultAccount] && balances[defaultAccount][currentNetworkId]) || {};

    const baseCoin = currentNetworkId && config.networks[currentNetworkId] ? config.networks[currentNetworkId].symbol : 'ETH';
    
    return (
      <>
        <Modal show={props.show} onHide={handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>{context.defaultAccount===props.order.seller ? 'Cancel Order' : 'Buy CHG Coins'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <center>
                <label>You can buy {Number(props.order.amount).toFixed(1)} CHG @ {Number(props.order.rate).toFixed(5)} CHG/{baseCoin} </label><br/>
                <small className="text-muted">{props.order.hash} from {props.order.seller} expire on {new Date(props.order.expire*1000).toLocaleDateString()}</small><br/>
                <label>Enter the amount in CHG coins you want to buy</label>
                <InputSpinner 
                  max = {Math.min(eth ? eth / props.order.rate : 0, props.order.amount)} 
                  value = {Math.round(Math.min(value, eth ? (eth/props.order.rate) : 0, props.order.amount))}
                  min={0} step={10} digits={1} onChange={setValue}
                />
                <h5>
                  You will pay : <b style={{padding:'5px'}}>{(value * props.order.rate).toFixed(5)}</b> {baseCoin}
                </h5>
            </center>
            <AlertBlock message={warning} setMessage={setWarning} variant="warning" />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-primary" onClick={handleClose}>
                Close
            </Button>
            <Button variant="outline-primary"
                disabled={!value}  
                onClick={()=>{
                  if (context.defaultAccount === props.order.seller) {
                    props.handleCancelSellOrder(props.order);
                    handleClose();
                  } else if (value > 0) {
                    props.handleBuy(props.order, value * props.order.rate);
                    handleClose();
                  }else{
                    setWarning('Wrong value');
                  }
                }}
            >
              { context.defaultAccount===props.order.seller ? 'Cancel Order' : 'Buy CHG' }
            </Button>
          </Modal.Footer>
        </Modal>
      </>
    );
}
