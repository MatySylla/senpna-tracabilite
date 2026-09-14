'use strict';
const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const fs = require('fs');

async function enrollUser() {
    const ccpPath = path.resolve(
        '/home/maty/fabric-samples/test-network',
        'organizations', 'peerOrganizations',
        'org1.example.com',
        'connection-org1.json'
    );
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
    const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
    const ca = new FabricCAServices(caInfo.url, 
        { trustedRoots: caInfo.tlsCACerts.pem, verify: false }, 
        caInfo.caName
    );
    const walletPath = path.join(__dirname, '..', '..', 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Supprimer l'ancien wallet
    const existingIdentity = await wallet.get('appUser');
    if (existingIdentity) {
        await wallet.remove('appUser');
        console.log('🗑️ Ancien wallet supprimé');
    }

    // Enrôler admin
    const enrollment = await ca.enroll({
        enrollmentID: 'admin',
        enrollmentSecret: 'adminpw'
    });

    const x509Identity = {
        credentials: {
            certificate: enrollment.certificate,
            privateKey: enrollment.key.toBytes(),
        },
        mspId: 'Org1MSP',
        type: 'X.509',
    };

    await wallet.put('appUser', x509Identity);
    console.log('✅ Identité appUser enregistrée avec succès !');
}

enrollUser().catch(console.error);
