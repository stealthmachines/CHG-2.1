class Logger {

    constructor (account='') {
        this.send = this.send.bind(this);
        this.waitForConnection = this.waitForConnection.bind(this);
        this.connect = this.connect.bind(this);
        this.log = this.log.bind(this);

        this.account = account;
        const settingName = 'ws-logger';
        this.client = localStorage.getItem(settingName);
        if (!this.client) {
            this.client = Math.random().toString(16).substr(2, 35);
            //hash = clientId.split('').map(v=>v.charCodeAt(0)).reduce((a,v)=>a+((a<<7)+(a<<3))^v).toString(16);
            localStorage.setItem(settingName, this.client);
        }
        this.connect();
    }

    send (message, callback) {
        this.waitForConnection(() => {
            this.ws.send(message);
            if (typeof callback !== 'undefined') {
              callback();
            }
        }, 30000);
    };

    waitForConnection(callback, interval) {
        if (this.ws.readyState === 1) {
            callback();
        } else {
            const that = this;
            // optional: implement backoff for interval here
            setTimeout(() => {
                that.waitForConnection(callback, interval);
            }, interval);
        }
    };

    connect() {

        try {
            this.ws = new WebSocket(process.env.REACT_APP_WS_LOGGER_URL);

            this.ws.onopen = e => {
                // console.log('on open', e);
                try {
                    this.send(JSON.stringify({ level: 'debug', event: 'connected', client: this.client, account: this.account }));
                } catch (err) {
                    console.error(err)
                }
            };

            //this.ws.onmessage = e => { 
                //try {
                    //const obj = JSON.parse(e.data)
                    //console.log('ws-logger', obj);
                //} catch (err) {
                    //console.error(err)
                //}
            //};

            this.ws.onclose = (e) => { 
                //console.log('ws-logger close', e);
                // try reconnect in  10 min
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

    log(level, event, data) {
        if (level === 'error') {
            // send only errors
			if (process.env.REACT_APP_DEBUG_LEVEL > 1) {
                console.error(event, data);
            }
            if (!this.ws || this.ws.readyState !== 1) {
                this.connect();
            }
            try {
                this.send(JSON.stringify({ level, event, error: data.message || data, client: this.client }));
            } catch (err) {
                if (process.env.REACT_APP_DEBUG_LEVEL > 1) {
                    console.error(err)
                }
            }
        } else {
            if (process.env.REACT_APP_DEBUG_LEVEL > 5) {
                console.log(event, data);
            }
        }
    }
}


/*
let logger = null;
module.exports = () => {
  if (logger) return logger;
  else {
    logger = new Logger();
    return logger;
  }
};
*/

export default Logger;