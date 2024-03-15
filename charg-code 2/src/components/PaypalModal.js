import React, { useState, useEffect } from "react";
import { Modal } from "react-bootstrap";
//import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
const apiUrl = process.env.REACT_APP_API_URL;

export const PaypalModal = ({ show, setShow, title, amountGive, amountGet, toAddress, handleAction, currency, networkId, serviceId, time, paymentHash }) => {

  //const [warning, setWarning] = useState('');
  //const [message, setMessage] = useState('');
  const [showWaiting, setShowWaiting] = useState(false);

  const handleClose = () => setShow(false);
  //const handleShow = () => setShow(true);
  //const amount = props.amountGive;

  useEffect(() => {
    // console.log(window.paypal, amountGive, show)
    if (show && typeof window.paypal !== undefined) {
      const value = Number(amountGive).toFixed(2);
      const paypalDiv = document.getElementById('paypal-button-container');
      // console.log(window.paypal)
      window.paypal.Buttons({
        style: {
          layout:  'vertical',
          color:   'blue',
          shape:   'rect',
          //label:   'paypal'
        },
        createOrder: (data, actions) => {
          return actions.order.create({
            purchase_units: [{
              reference_id: toAddress,
              invoice_id: paymentHash, // should be unique
              custom_id: JSON.stringify({
                chg: amountGet,
                networkId,
                serviceId,
                time,
              }),
              description: `Buy ${amountGet} CHG for ${value} USD to ${toAddress}`,
              amount: {
                  chg: amountGet,
                  currency_code: "USD",
                  value: value
              }
            }]
          });
        },
        onApprove: (data, actions) => {
          // This function captures the funds from the transaction.
          return actions.order.capture().then((details) => {
            // This function shows a transaction success message to your buyer.
            setShowWaiting(true);
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

            fetch(apiUrl, {
              ...fetchOptions,
              body: JSON.stringify({
                method: 'confirmPayment',
                data: { paymentId: details.id, currency }
              })
            }).then(response => {
              if (!response.ok) {
                  throw new Error('Failed to fetch.');
              }
              return response.json();
            }).then(res => {
              if (res.result) {
                if (res.result.error) {
                  //setWarning(res.result.error);
                } else if (res.result.receipt) {
                  handleAction('confirmed', res.result);
                  setShow(false);
                }
              }
            }).catch(console.error)
            .finally(() => {
              setShowWaiting(false);
              setShow(false);
            })
          });
        }
      }).render(paypalDiv);
    }
  },[show, amountGive, amountGet, toAddress, currency, handleAction, setShow, networkId, serviceId, time, paymentHash]);

  /*
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
    /*
  }

  /*
  return (
                <PayPalScriptProvider options={{ "client-id": process.env.REACT_APP_PAYPAL_CLIENT_ID }}>
                  <PayPalButtons
                      style={{ layout: "horizontal" }}
                      createOrder={(data, actions) => {
                        console.log({ data })
                          return actions.order.create({
                              purchase_units: [
                                  {
                                      amount: {
                                          value: props.amountGive,
                                      },
                                  },
                              ],
                          }).then((orderId, o) => {
                            // Your code here after create the order
                            console.log({ orderId, o })
                            return orderId;
                          });
                      }}
                      onApprove2={(data, actions) => {
                        console.log({ data })
                        return actions.order.capture().then(() => {
                        // Your code here after capture the order
                      });
                    }}
                  />;
                </PayPalScriptProvider>
  );
  */

  return (
    <Modal show={show} onHide={handleClose}>
    <Modal.Header closeButton>
      <Modal.Title>
        <center>
          {title} {showWaiting && <> {' '} <span className="spinner-border spinner-border-sm"></span> {' please wait ... '}</>}
        </center>
      </Modal.Title>
    </Modal.Header>
    <Modal.Body className='paypal-modal-body'>
      {
        showWaiting
          ? <center><span className="spinner-border spinner-border-sm"></span></center>
          : <div id="paypal-button-container" style={{color: 'white'}}></div>
        }
    </Modal.Body>
    </Modal>
  )
}