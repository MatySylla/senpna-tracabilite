'use strict';

const { Wallets, X509Identity } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const fs = require('fs');

async function enrollUser() {
    const ccpPath = path.resolve(
        process.env.FABRIC_PATH || '/home/maty/fabric-samples/test-network',
        'organizations', 'peerOrganizations',
        'org1.example.com',
        'connection-org1.json'
    );

    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    // Créer CA client
    const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
    const caTLSCACerts = caInfo.tlsCACerts.pem;
    const ca = new FabricCAServices(
        caInfo.url,
        { trustedRoots: caTLSCACerts, verify: false },
        caInfo.caName
    );

    // Créer wallet
    const walletPath = path.join(__dirname, '..', '..', 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Vérifier si déjà enrôlé
    const userIdentity = await wallet.get('appUser');
    if (userIdentity) {
        console.log('appUser existe déjà dans le wallet');
        return;
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
    console.log('✅ appUser enrôlé avec succès dans le wallet');
}

enrollUser().catch(console.error);