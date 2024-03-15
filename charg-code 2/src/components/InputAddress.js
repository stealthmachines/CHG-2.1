import React, { useState } from 'react';
import Web3 from 'web3';
// import QrReader from 'react-qr-scanner';
import { Modal, Button } from "react-bootstrap";

export const InputAddress = ({ address, setAddress, placeholder }) => {
    const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
    const isValidAddress = () => Web3.utils.isAddress(address);
    return (
        <div style={{ padding: '10px', textAlign: 'center' }}>
            <div className="input-group">
                <input
                    onChange={(e) => setAddress(e.target.value)} className="form-control"
                    aria-label={placeholder} placeholder={placeholder} 
                    value={address}
                />
                <div className="input-group-append">
                    <button onClick={() => setShowBarcodeScanner(_prev => !_prev)} className="btn btn-block btn-outline-primary">
                        {isValidAddress() && <img style={{height:'25px'}} src='/images/ok.png' alt='OK'/> }
                        <img style={{height:'25px'}} src='/images/QR.png' alt='Scan QR'/>
                    </button>
                </div>
            </div>
            <Modal show={showBarcodeScanner} onHide={() => setShowBarcodeScanner(false)}>
                <Modal.Header>
                    Scan your address QR code
                </Modal.Header>
                <Modal.Body>
                    <center>
                    {/*showBarcodeScanner && <QrReader
                        delay={500}
                        style={{height: 240, width: 320 }}
                        onError={console.error}
                        onScan={(res) => {
                            if (!res) return;
                            setShowBarcodeScanner(false);
                            setAddress(res.text.replace('ethereum:',''));
                        }}
                    />*/}
                    </center>
                </Modal.Body>
                <Modal.Footer>
                <Button variant="outline-primary" size='sm' onClick={() => setShowBarcodeScanner(false)}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
        </div>
    );
}