import React, {useState} from "react";
import {Modal, Button} from "react-bootstrap";
import {InputSpinner} from "../components/InputSpinner"
import {AlertBlock} from "../components/AlertBlock"

export const BridgeTransferModal = (props) => {

    const [show, setShow] = useState(false);
    const [value, setValue] = useState(props.value);
    const [warning, setWarning] = useState('');
  
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    return (
      <>
        <Button onClick={handleShow} size="lg" block variant="outline-primary" disabled={props.disabled}>
            {props.action}
        </Button>
  
        <Modal show={show} onHide={handleClose}>
          <Modal.Header closeButton>
            <Modal.Title> {props.action} </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <>
                <label style={{padding: '10px'}}>{props.description}</label>
                <InputSpinner min={props.min} max={props.max} step={props.step} digits={props.digits} value={value} onChange={setValue}/>
            </>

            <div className="row">
                <div className="col">
                    <small>Validations Required: </small>
                </div>
                <div className="col text-right">
                    <span>{props.bridgeData.validationsRequired}</span>
                    <small className="text-muted"></small>
                </div>
            </div>

              <div className="row">
                  <div className="col">
                      <small>Gas Price: </small>
                  </div>
                  <div className="col text-right">
                      <span>{Number(props.bridgeData.gasPrice).toFixed(1)}</span>
                      <small className="text-muted">GWei</small>
                  </div>
              </div>

            <div className="row">
                <div className="col">
                    <small>Transfer Fee: </small>
                </div>
                <div className="col text-right">
                    <span>{Number(props.bridgeData.fullPrice).toFixed(2)}</span>
                    <small className="text-muted">CHARG</small>
                </div>
            </div>

            <h3 className="card-title pricing-card-title">
            <div className="row">
                <div className="col">
                    <small>Total: </small>
                </div>
                <div className="col text-right">
                    <span>{(Number(props.bridgeData.fullPrice) + Number(value)).toFixed(2)}</span>
                    <small className="text-muted">CHARG</small>
                </div>
            </div>
            </h3>

            <AlertBlock message={warning} setMessage={setWarning} variant="warning" />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-primary" onClick={handleClose}>
                Close
            </Button>
            <Button variant="outline-primary" 
                onClick={()=>{
                  if (value > 0) {
                    props.handleAction(props.action, props.currency, value, props.bridgeData.fullPrice);
                    handleClose();
                  }else{
                    setWarning('Wrong value');
                  }
                }}
            >
                {props.action}
            </Button>
          </Modal.Footer>
        </Modal>
      </>
    );
}
