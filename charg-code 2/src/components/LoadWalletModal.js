import React from "react";
import { Modal, Button, Form } from "react-bootstrap";
//import { AlertBlock } from "../components/AlertBlock"

export const LoadWalletModal = props =>
<Form>
  <Modal show={props.show} onHide={props.handleClose}>
    <Modal.Header closeButton>
      <Modal.Title> Load your Light Wallet with a recovery phrase </Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <>
          <Form.Group controlId="exampleForm.ControlTextarea1">
            <Form.Label>Enter secret seed phrase</Form.Label>
            <Form.Control as="textarea" rows="2"
              value={props.walletSeed} 
              onChange={(e)=>props.setWalletSeed(e.target.value)}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label style={{padding: '10px'}}>Enter password of your wallet</Form.Label>
            <Form.Control 
              type="password" 
              placeholder="Password of your wallet" 
              value={props.walletPassword} 
              onChange={(e)=>props.setWalletPassword(e.target.value)}
            />
          </Form.Group>
      </>
    </Modal.Body>
    <Modal.Footer>
      <Button variant="outline-primary" onClick={props.handleClose}>
          Close
      </Button>
      <Button variant="outline-primary" 
          onClick={()=>{
            props.handleSubmit();
            props.handleClose();
          }}
      >
          Open Wallet
      </Button>
    </Modal.Footer>
  </Modal>
</Form>
