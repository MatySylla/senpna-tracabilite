'use strict';

const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

const connectToFabric = async () => {
    // Chemin vers le profil de connexion
    const ccpPath = path.resolve(
        process.env.FABRIC_PATH,
        'organizations', 'peerOrganizations',
        'org1.example.com',
        'connection-org1.json'
    );

    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    // Créer le wallet
    const walletPath = path.join(__dirname, '..', '..', 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Vérifier l'identité
    const identity = await wallet.get('appUser');
    if (!identity) {
        throw new Error('Identity appUser not found in wallet. Run enrollUser.js first.');
    }

    // Connexion via Gateway
    const gateway = new Gateway();
    await gateway.connect(ccp, {
        wallet,
        identity: 'appUser',
        discovery: { enabled: true, asLocalhost: true }
    });

    return gateway;
};

module.exports = { connectToFabric };