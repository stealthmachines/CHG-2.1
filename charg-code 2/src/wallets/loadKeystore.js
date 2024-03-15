import lightwallet from 'eth-lightwallet'

const loadKeystore = (hookedPasswordProvider) =>

  new Promise((resolve, reject) => {

    //let hooked;
    let keystore;
    try {

      //localKeyStore = JSON.parse(localStorage.getItem('localKeyStore'));
      keystore = lightwallet.keystore.deserialize(localStorage.getItem('localKeyStore'));
      keystore.passwordProvider = hookedPasswordProvider;
      //setKeystore(_keystore)
      //console.log('use hookedPasswordProvider', hookedPasswordProvider);
      //this.useLightWallet = true;
      //this.updateAccounts();
      console.log('There is a lightwallet in the local store', keystore);
      resolve(keystore);

    } catch (e) {
      console.log('No wallet in the local store', e);
      //reject(e)
    }

    //if (keystore) {
    //  hooked = {keystore};
    //}

  });

export default loadKeystore;
