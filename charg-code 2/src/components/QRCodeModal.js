import React, { useState, useEffect } from "react";
import { Modal, Button } from "react-bootstrap";
//import AppContext from "../context/AppContext";
import { AlertBlock } from "../components/AlertBlock"
import config from "../app.config.json";

const apiUrl = process.env.REACT_APP_API_URL;

export const QRCodeModal = (props) => {

  //const defaultExchangeBid = 0.00015;
  //const [context] = React.useContext(AppContext);
  //const [show, setShow] = useState(false);
  const [warning, setWarning] = useState('');
  //const [message, setMessage] = useState('');

  const handleClose = () => props.setShow(false);
  //const handleShow = () => setShow(true);

  const amount = props.amountGive; // rates can change...
  //const chgAmount = props.amountGet; // rates can change...

  useEffect(() => {
    /*
    if ( context && context.exchangeBid && rate===defaultExchangeBid ) {
      rateChanged(context.exchangeBid)
    }*/
      const qrDiv = document.getElementById('coin-qrcode-img');
      if (typeof window.qrcode === 'function' && qrDiv) {
          const qr = window.qrcode(4, 'L');
          qr.addData(props.paymentData.address);
          qr.make();
          const qrImgTag = qr.createImgTag(4);
          //console.log(qrDiv, qrImgTag);
          qrDiv.innerHTML = qrImgTag;
      } else {
          //document.getElementById('coin-qrcode-img').innerHTML = props.title;
      }

  },[props.show, props.paymentData.address, props.rates]);

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

  const confirmPayment = () => {
    /*
    context.wsClient.send({
      method: 'confirmPayment',
      data: { paymentId: props.paymentData.address }
    }, res => {
        if (res.result) {
          if (res.result.error) {
            setWarning(res.result.error);
          } else if (res.result.txHash) {
            //console.log('res.result', res.result)
            props.handleAction('confirmed', res.result.txHash);
            handleClose();
          }
        }
    });
    */
    fetch(apiUrl, {
        ...fetchOptions,
        body: JSON.stringify({
          method: 'confirmPayment',
          data: { paymentId: props.paymentData.address, currency: props.currency }
        })
    }).then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch.');
        }
        return response.json();
    }).then(res => {
      if (res.result) {
        if (res.result.error) {
          setWarning(res.result.error);
        } else if (res.result.receipt) {
          //console.log(res.result)
          props.handleAction('confirmed', res.result);
          handleClose();
        }
      }
    }).catch(console.error)
}


  //console.log(props.currency, config.coins, props.paymentData)
  const paymentLink = config.coins[props.currency] && config.coins[props.currency].protocol+"://"+props.paymentData.address+"/amount="+Number(amount).toFixed(5);
  const explorerLink = config.coins[props.currency] && config.coins[props.currency].explorer+props.paymentData.address;
  //`${config.coins[app.currency].protocol}:${result.paymentData.address}?amount=${app.total[service].toFixed(8)}&label=${app.payerHash.substr(-16)}&message=${app.paymentHash.substr(-16)}`;

  return (
    <>

        <Modal show={props.show} onHide={handleClose}>
          <Modal.Header closeButton>
            <Modal.Title> {props.title} </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <>
            <div className="row">
              <div className="col">
              <a target="_blank" rel="noopener noreferrer" href={paymentLink}>
                  <div id="coin-qrcode-img"></div>
              </a>
              </div>
              <div className="col">
                Scan the QR Code or click on it,
                and make a payment to <a target="_blank" rel="noopener noreferrer" href={paymentLink}>this {props.currency} address</a>,<br/> 
                <b><a target="_blank" rel="noopener noreferrer" href={explorerLink}>click here and verify that it is confirmed </a></b>
                and then press <b>"I paid"</b> button
              </div>
            </div>

            </>
          </Modal.Body>
          <Modal.Footer>
            <AlertBlock message={warning} setMessage={setWarning} variant="warning" />
            <Button variant="outline-primary" onClick={handleClose}>
                Close
            </Button>
            <Button variant="outline-primary" 
                onClick={()=>{
                  //if (amountGive > 0 && amountGet > 0 && expire > 0) {
                    //props.handleAction(amountGive, amountGet, expire);
                    confirmPayment();
                    //props.handleAction();
                    //handleClose();
                  //}else{
                    //setWarning('Wrong value');
                  //}
                }}
            >
              I Paid
            </Button>
          </Modal.Footer>
        </Modal>
    </>
  );
}
