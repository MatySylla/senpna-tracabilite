'use strict';

const { connectToFabric } = require('../fabric/gateway');

// Initier un transfert
exports.initierTransfert = async (req, res) => {
    let gateway;
    try {
        const { idTransfert, idLot, expediteur, destinataire, quantite, bonLivraison } = req.body;

        if (!idTransfert || !idLot || !destinataire || !quantite) {
            return res.status(400).json({
                erreur: 'Champs obligatoires : idTransfert, idLot, destinataire, quantite'
            });
        }

        gateway = await connectToFabric();
        const network = await gateway.getNetwork(process.env.CHANNEL_NAME);
        const contract = network.getContract('gestionTransferts');

        await contract.submitTransaction(
            'InitierTransfert',
            idTransfert,
            idLot,
            expediteur || 'SEN-PNA',
            destinataire,
            quantite.toString(),
            bonLivraison || ''
        );

        return res.status(201).json({
            message: 'Transfert initié avec succès',
            idTransfert
        });

    } catch (error) {
        return res.status(500).json({ erreur: error.message });
    } finally {
        if (gateway) gateway.disconnect();
    }
};

// Consulter un transfert
exports.getTransfert = async (req, res) => {
    let gateway;
    try {
        const { idTransfert } = req.params;

        gateway = await connectToFabric();
        const network = await gateway.getNetwork(process.env.CHANNEL_NAME);
        const contract = network.getContract('gestionTransferts');

        const result = await contract.evaluateTransaction('GetTransfert', idTransfert);

        return res.status(200).json(JSON.parse(result.toString()));

    } catch (error) {
        return res.status(404).json({ erreur: error.message });
    } finally {
        if (gateway) gateway.disconnect();
    }
};

// Confirmer réception
exports.confirmerReception = async (req, res) => {
    let gateway;
    try {
        const { idTransfert } = req.params;

        gateway = await connectToFabric();
        const network = await gateway.getNetwork(process.env.CHANNEL_NAME);
        const contract = network.getContract('gestionTransferts');

        await contract.submitTransaction('ConfirmerReception', idTransfert);

        return res.status(200).json({
            message: `Réception du transfert ${idTransfert} confirmée`
        });

    } catch (error) {
        return res.status(500).json({ erreur: error.message });
    } finally {
        if (gateway) gateway.disconnect();
    }
};

// Rejeter un transfert
exports.rejeterTransfert = async (req, res) => {
    let gateway;
    try {
        const { idTransfert } = req.params;
        const { motif } = req.body;

        if (!motif) {
            return res.status(400).json({ erreur: 'Le motif de rejet est obligatoire' });
        }

        gateway = await connectToFabric();
        const network = await gateway.getNetwork(process.env.CHANNEL_NAME);
        const contract = network.getContract('gestionTransferts');

        await contract.submitTransaction('RejeterTransfert', idTransfert, motif);

        return res.status(200).json({
            message: `Transfert ${idTransfert} rejeté`,
            motif
        });

    } catch (error) {
        return res.status(500).json({ erreur: error.message });
    } finally {
        if (gateway) gateway.disconnect();
    }
};
// Lister tous les transferts depuis la blockchain
exports.getAllTransferts = async (req, res) => {
    let gateway;
    try {
        gateway = await connectToFabric();
        const network = await gateway.getNetwork(process.env.CHANNEL_NAME);
        const contract = network.getContract('gestionTransferts');

        const result = await contract.evaluateTransaction('GetAllTransferts');
        const transferts = JSON.parse(result.toString());

        return res.status(200).json(transferts || []);

    } catch (error) {
        return res.status(500).json({ erreur: error.message });
    } finally {
        if (gateway) gateway.disconnect();
    }
};