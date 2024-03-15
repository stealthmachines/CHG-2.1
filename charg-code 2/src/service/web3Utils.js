// import Web3 from "web3";
// import config from "../app.config.json";

export const sendTransaction = (transaction, options, web3, callback) => {
    let finished = false;
    try {
      options.gas = 3000000;
      options.type = 0; // for building a legacy transaction https://github.com/ethers-io/ethers.js/issues/1728
      web3.eth.getGasPrice().then(gasPrice => {
        if (!options.gasPrice || gasPrice > options.gasPrice) {
            //options.gasPrice = gasPrice;
        };
        transaction.estimateGas(options).then(gasAmount => {
            if (options && options.gas && gasAmount >= options.gas) {
                callback('error', { message: `Gas estimation error: ${gasAmount} > ${options.gas}` });
                return;
            };
            options.gas = gasAmount;
            transaction.send(options)
            .on('transactionHash', (hash) => {
                callback('signed', hash);
                const readIntervalHandler = setInterval(() => {
                    if (finished) {
                        clearInterval(readIntervalHandler);
                        return;
                    }
                    web3.eth.getTransactionReceipt(hash).then(receipt => {
                        if (receipt) {
                            finished = true;
                            clearInterval(readIntervalHandler);
                            //if (receipt.status === true) 
                            callback('confirmed', {
                                number: 0, //receipt.transactionIndex
                                receipt: receipt
                            })
                        }
                    });
                }, 5000); // read status every 5 sec
            })
            .on('confirmation', (confirmNumber, receipt) => {
                if (finished) return;
                finished = true;
                callback('confirmed', {
                    number: confirmNumber,
                    receipt: receipt
                })
            })
            .on('error', (error) => {
                if (finished) return;
                finished = true;
                callback('error', error);
            })
        });
      });
    } catch (e) {
        callback('error', e);
        console.error(e);   
    }
}