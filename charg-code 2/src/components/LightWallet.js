import React, {useState, useEffect} from "react";

export const LightWallet = (props) => {

    //const [context] = useContext(AppContext);
    const [lightWalletLoaded, setlightWalletLoaded] = useState(false);
    const [hookedWeb3ProviderLoaded, setHookedWeb3ProviderLoaded] = useState(false);
    const [keystore, setKeystore] = useState(undefined);
    const [secretSeed, setSecretSeed] = useState(undefined);

    //let's load light wallet
    let ref = window.document.getElementsByTagName( 'script' )[ 0 ];

    let scriptElement2 = window.document.createElement( 'script' );
    scriptElement2.src = '/lib/hooked-web3-provider.min.js';
    scriptElement2.onload = () => {
        setHookedWeb3ProviderLoaded(true);
    };
    ref.parentNode.insertBefore( scriptElement2, ref );

    let scriptElement = window.document.createElement( 'script' );
    scriptElement.src = '/lib/lightwallet.min.js';
    scriptElement.onload = () => setlightWalletLoaded(true);
    
    ref.parentNode.insertBefore( scriptElement, ref );

	useEffect(() => {
        console.log(lightWalletLoaded, hookedWeb3ProviderLoaded);
        if (hookedWeb3ProviderLoaded && lightWalletLoaded) {
            try {
                //localKeyStore = JSON.parse(localStorage.getItem('localKeyStore'));
                const _keystore = window.lightwallet.keystore.deserialize(localStorage.getItem('localKeyStore'));
                _keystore.passwordProvider = props.hookedPasswordProvider;
                setKeystore(_keystore)

                //this.useLightWallet = true;
                //this.updateAccounts();

            } catch (e) {
                console.log('No wallet in the local store', e);
                setSecretSeed(window.lightwallet.keystore.generateRandomSeed());
            }
        }

	},[lightWalletLoaded, hookedWeb3ProviderLoaded]);

    return (
        <>
            {lightWalletLoaded && hookedWeb3ProviderLoaded ? 'loaded' : 'not loaded'}
        </>
    )
}
