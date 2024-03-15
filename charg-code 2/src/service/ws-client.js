class WsClient {

    constructor (account='') {
        this.send = this.send.bind(this);
        this.waitForConnection = this.waitForConnection.bind(this);
        this.connect = this.connect.bind(this);

        this.callbacks = {};

        this.account = account;
        const settingName = 'ws-client';
        this.client = localStorage.getItem(settingName);
        if (!this.client) {
            this.client = Math.random().toString(16).substr(2, 35);
            //hash = clientId.split('').map(v=>v.charCodeAt(0)).reduce((a,v)=>a+((a<<7)+(a<<3))^v).toString(16);
            localStorage.setItem(settingName, this.client);
        }
        this.connect();
    }

    send (request, callback) {
        //console.log('ws-client send', request)
        this.waitForConnection(() => {
            if (typeof request === 'object' && typeof callback === 'function') {
                //callback();
                request.cb = Math.random().toString(16).substr(2, 35);
                this.callbacks[request.cb] = callback;
            }
            //console.log('waitForConnection', request)
            this.ws.send(JSON.stringify(request));
        }, 10000, 10);  // try to connect 10 times every 10 sec
    };

    waitForConnection(callback, interval, tryCount) {
        if (this.ws.readyState === 1) {
            callback();
        } else {
            const that = this;
            // optional: implement backoff for interval here
            if (--tryCount > 0) {
                setTimeout(() => {
                    that.waitForConnection(callback, interval, tryCount);
                }, interval);
            }
        }
    };

    connect() {
        try {
            this.ws = new WebSocket(process.env.REACT_APP_WS_CLIENT_URL);

            this.ws.onopen = e => {
                // console.log('on open', e);
                /*
                try {
                    this.send(JSON.stringify({ level: 'debug', event: 'connected', client: this.client, account: this.account }));
                } catch (err) {
                    console.error(err)
                }
                */
            };

            this.ws.onmessage = e => {
                try {
                    const obj = JSON.parse(e.data);
                    console.log('ws-client', obj);
                    if (obj.cb && typeof this.callbacks[obj.cb] === 'function') {
                        this.callbacks[obj.cb](obj)
                    }
                } catch (err) {
                    console.error(err)
                }
            };

            this.ws.onclose = (e) => {
                //console.log('ws-logger close', e);
                // try reconnect in 10 min
                setTimeout(this.connect, 10 * 60 * 1000);
            };

            this.ws.onerror = (e) => {
                //console.log('ws-logger error', e);
                // try reconnect in 10 min
                setTimeout(this.connect, 10 * 60 * 1000);
            };
        } catch (err) {

        }
    }
}

export default WsClient;