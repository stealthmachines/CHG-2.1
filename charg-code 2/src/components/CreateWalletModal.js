import React, { useState } from "react";
import {Modal, Button, Form} from "react-bootstrap";
import {AlertBlock} from "../components/AlertBlock"

export const CreateWalletModal = (props) => {

    const [show, setShow] = useState(false);
    const [warning, setWarning] = useState('');
    const [lwSeed, setLwSeed] = useState(false);
  
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    React.useEffect(() => {
      if (props.show) {
        const _lwSeed = props.keystore.generateRandomSeed();
        console.log(_lwSeed)
        setLwSeed(_lwSeed);
      }
    }, [props.keystore, props.show]);

    console.log(props.keystore, lwSeed)
    // if (props.lwSeed) {
    if (props.keystore && lwSeed) {
      return (
        <>
          <Form>
          <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
              <Modal.Title> Create a New Light Wallet Account </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <>
                  <label style={{padding: '10px'}}>Write this seed phrase on paper and put in a safe place. </label>
                  <center style={{color:'rgb(247, 143, 143)', fontWeight:700, fontSize:'25px'}}>{lwSeed}</center>

                  <Form.Group>
                    <Form.Label style={{padding: '10px'}}>Use strong password to protect your wallet</Form.Label>
                    <Form.Control 
                      type="password" 
                      placeholder="Strong password" 
                      value={props.walletPassword} 
                      onChange={(e)=>props.setWalletPassword(e.target.value)}
                    />
                  </Form.Group>
                  <AlertBlock message={warning} setMessage={setWarning} variant="warning" />
              </>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="outline-primary" onClick={handleClose}>
                  Close
              </Button>
              <Button variant="outline-primary" 
                  onClick={()=>{
                      if (props.walletPassword.length < 6) {
                        setWarning('Use strong password please !');
                      } else {
                        props.handleCreateWallet();
                        handleClose();
                      }
                  }}
              >
                  Create an Account
              </Button>
            </Modal.Footer>
          </Modal>
          </Form>
        </>
      );
    } else if (props.keystore) {
      return (
        <Button onClick={handleShow} size="md" variant="outline-primary">
            Create a new Wallet
        </Button>
      )
    } else {
      return (
        <div>
          {/*
          Not possible to load a wallet, <br/>
          use another browser please
          */}
        </div>
      );
    }
}
