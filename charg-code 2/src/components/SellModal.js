import React, { useState } from "react";
import AppContext from "../context/AppContext";
import { Modal, Button } from "react-bootstrap";
import { InputSpinner } from "../components/InputSpinner"
import { AlertBlock } from "../components/AlertBlock"
import config from "../app.config.json";

export const SellModal = (props) => {

    const [value, setValue] = useState(props.value);
    const [warning, setWarning] = useState('');
    const [context] = React.useContext(AppContext);
    const handleClose = () => props.setShow(false);

    const { defaultAccount, balances, currentNetworkId } = context;
    const { chg } = (balances[defaultAccount] && balances[defaultAccount][currentNetworkId]) || {};
  
    const baseCoin = currentNetworkId && config.networks[currentNetworkId] ? config.networks[currentNetworkId].symbol : 'ETH';
  
    return (
      <>
        <Modal show={props.show} onHide={handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>{context.defaultAccount===props.order.buyer ? 'Cancel Order' : 'Sell CHG Coins'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <center>
                <label>You can sell {Number(props.order.amount).toFixed(1)} CHG @ {Number(props.order.rate).toFixed(5)} CHG/{baseCoin} </label><br/>
                <small className="text-muted">{props.order.hash} to {props.order.buyer} expire on {new Date(props.order.expire*1000).toLocaleDateString()}</small><br/>
                <label>Enter the amount in CHG coins you want to sell</label>
                <InputSpinner 
                  max = {Math.min(props.order.amount, chg)} 
                  value = {0/*Math.min(props.order.amount, chg)*/}
                  min={0} step={10} digits={1} onChange={setValue}
                />
                <h5>
                  You will receive : <b style={{padding:'5px'}}>{(value * props.order.rate).toFixed(5)}</b> {baseCoin}
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
                  if (context.defaultAccount===props.order.buyer) {
                    props.handleCancelBuyOrder(props.order);
                    handleClose();
                  } else if (value > 0) {
                    props.handleSell(props.order, value);
                    handleClose();
                  }else{
                    setWarning('Wrong value');
                  }
                }}
            >
              {context.defaultAccount===props.order.buyer ? 'Cancel Order' : 'Sell CHG'}
            </Button>
          </Modal.Footer>
        </Modal>
      </>
    );
}
