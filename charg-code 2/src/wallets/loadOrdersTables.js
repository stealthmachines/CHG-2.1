//import Logger from "../service/logger";
//const logger = new Logger();

const now = Math.round(new Date().getTime() / 1000);

const loadOrdersTables = (chain) =>
  new Promise((resolve, reject) => {
	chain.web3.eth.getBlockNumber().then(blockNumber => {
		// todo: some rpc providers allow limited get past events, so need few requests
		//console.log('getPastEvents', chain.networkId, blockNumber)
		const maxBlockRange = Number(process.env['REACT_APP_MAX_BLOCK_RANGE_'+chain.networkId]);
		let callNum = 0;
		let callsCount = 1;
		const callPromises = [];
		if (!isNaN(maxBlockRange)) {
			// at least 300000 blocks back
			callsCount = (Number(blockNumber) - Number(chain.fromBlock || 1)) / maxBlockRange;
			callNum = 0;
		}
		let fromBlock = callsCount === 1 ? (chain.fromBlock || 1) : Number(blockNumber) - maxBlockRange * (callNum + 1) + 1;
		//console.log({ networkId:chain.networkId, callNum, fromBlock });
		while ((fromBlock >= (chain.fromBlock || 1)) && callNum < Math.min(callsCount, process.env['REACT_APP_MAX_RPC_CALLS'])) { // rpc blocking
			const _fromBlock = fromBlock;
			const _toBlock = callsCount === 1 ? 'latest' : Number(blockNumber) - maxBlockRange * callNum;
			const _callNum = callNum;
			//const _networkId = chain.networkId;
			callPromises.push(new Promise(resolve =>
				setTimeout(() => {
					//console.log({ _networkId, _callNum, _fromBlock, _toBlock });
					resolve(
						chain.chargContract.getPastEvents('allEvents', {
							fromBlock: _fromBlock,
							toBlock: _toBlock
						})
					)},
					_callNum * 2000
				)
			));
			callNum++;
			fromBlock = Number(blockNumber) - maxBlockRange * (callNum + 1) + 1
		}
		//console.log({callPromises});
		Promise.all(callPromises).then(eventsArrays => {
			const events = eventsArrays.flat();
			//console.log({ eventsArrays, events });
			//logger.log('debug', 'getPastEvents.start', {
			//	networkId: chain.networkId,
			//	blockNumber: blockNumber,
			//	eventsCount: events.length
			//})
			const registeredNodes = {};
			const sellOrders = {};
			const buyOrders = {};

			for (let i=0; i < events.length; i++) {
				const txHash = events[i].transactionHash;
				//console.log(chain.networkId, events[i].event, events[i].transactionHash);  
				if (['SellOrder','BuyOrder'].includes(events[i].event)) {
					const { orderHash, amountGive, amountGet, seller, buyer} = events[i].returnValues;
					const expire = Number(events[i].returnValues.expire === undefined ? events[i].returnValues.expires : events[i].returnValues.expire);
					const give = Number(chain.web3.utils.fromWei(amountGive,'ether'));
					const get = Number(chain.web3.utils.fromWei(amountGet,'ether'));
					if ( expire - now < 3600 || give === 0 || get === 0) {
						continue;  // empty or expired orders are ignored
					}
					if (events[i].event === 'SellOrder') {
						const rate = (get/give).toFixed(7);
						sellOrders[orderHash] = {
							give: give,
							get: get,
							rate: rate,
							expire: expire,
							orderHash: orderHash,
							txHash: txHash,
							seller: seller
						};
					} else if (events[i].event === 'BuyOrder') {
						const rate = (give/get).toFixed(7);
						buyOrders[orderHash] = {
							give: give,
							get: get,
							rate: rate,
							expire: expire,
							orderHash: orderHash,
							txHash: txHash,
							buyer: buyer
						};
					}
				}//buy, sell orders
				else if (['Sell','Buy'].includes(events[i].event)) {
					//console.log(events[i].returnValues)
					//const { orderHash, amountGive, amountGet, seller, buyer} = events[i].returnValues;
					const { orderHash, amountGive, amountGet} = events[i].returnValues;
					const give = Number(chain.web3.utils.fromWei(amountGive,'ether'));
					const get = Number(chain.web3.utils.fromWei(amountGet,'ether'));

					//console.log(events[i].event, orderHash, amountGive, amountGet, seller, buyer)

					if (events[i].event === 'Sell') {
						if (orderHash in buyOrders) {
							if (give === 0 || get === 0) {
								delete buyOrders[orderHash];
							} else {
								buyOrders[orderHash].give = give;
								buyOrders[orderHash].get = get;
								//sellOrders[orderHash].rate = (get/give).toFixed(7);  //should not be changed, but ...
							}
						}
					} else if (events[i].event === 'Buy') {
						if (orderHash in sellOrders) {
							if (give === 0 || get === 0) {
								delete sellOrders[orderHash];
							} else {
								sellOrders[orderHash].give = give;
								sellOrders[orderHash].get = get;
								//buyOrders[orderHash].rate = (get/give).toFixed(7);  //should not be changed, but ...
							}
						}
					}
				}//buy, sell actions
				else if (events[i].event === 'CancelBuyOrder') {
					const { orderHash } = events[i].returnValues;
					//console.log('Canceling ' + orderHash)  
					if (orderHash in buyOrders) {
						delete buyOrders[orderHash];
					}
				}
				else if (events[i].event === 'CancelSellOrder') {
					const { orderHash } = events[i].returnValues;
					//console.log('Canceling ' + orderHash)  
					if (orderHash in sellOrders) {
						delete sellOrders[orderHash];
					}
				}
				else if (events[i].event === 'NodeRegistered') {
					//console.log('NodeRegistered', events[i].returnValues)
					const { addr, latitude, longitude, name, location, phone, connector, power } = events[i].returnValues;
					const nodeAddr = addr.toLowerCase();
					//if (!registeredNodes[addr]) {
						registeredNodes[nodeAddr] = { addr, name, location, phone, connector, power };
						registeredNodes[nodeAddr].networkId = chain.networkId;
						registeredNodes[nodeAddr].latitude = (Number(latitude) / (10**7) );
						registeredNodes[nodeAddr].longitude = (Number(longitude) / (10**7) );
					//}
				} else {
					//if (!events[i].event.includes('Deposit') && !events[i].event.includes('Withdraw') && !events[i].event.includes('Service')) {
						// console.log('events[i]', events[i])
					//}
				}
			};
			//console.log(chain.networkId, { sellOrders, buyOrders })
			const tmpOrders = [];
			if (Object.keys(sellOrders).length>0) {
				for ( let hash in sellOrders ){
					tmpOrders.push( sellOrders[ hash ] );
				}
			}
			const exchangeAsk = Math.min.apply(Math, tmpOrders.map( o => o.rate )) || 0.001;
			tmpOrders.length = 0;
			if (Object.keys(buyOrders).length>0) {
				for ( var hash in buyOrders ){
					tmpOrders.push( buyOrders[ hash ] );
				}
			}
			const exchangeBid = Math.max.apply(Math, tmpOrders.map( o => o.rate )) || 0.001;
			//logger.log('debug', 'getPastEvents.end', {
			//	networkId: chain.networkId,
			//	buyOrders, sellOrders, exchangeAsk, exchangeBid
			//})
			//console.log(chain.networkId, registeredNodes)
			resolve ({
				buyOrders, sellOrders, exchangeAsk, exchangeBid, registeredNodes
				//registeredNodes: Object.values(registeredNodes)
			});
		}).catch(err => {
			if (process.env.REACT_APP_DEBUG_LEVEL > 1) {
				console.error('getPastEvents Promise.all', chain.networkId, blockNumber, err)
			}
			reject(err);
		}); // Promise.all
	}).catch(err => {
		if (process.env.REACT_APP_DEBUG_LEVEL > 1) {
			console.error('getPastEvents getBlockNumber', chain.networkId, err)
		}
		reject(err);
	});//

  });

//export default loadOrdersTables;
module.exports = loadOrdersTables;
