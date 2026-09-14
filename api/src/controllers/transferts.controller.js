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
        const contractTransferts = network.getContract('gestionTransferts');
        const contractLots = network.getContract('gestionLots');

        // 1. Récupérer le transfert pour avoir les infos lot
        const transfertResult = await contractTransferts.evaluateTransaction('GetTransfert', idTransfert);
        const transfert = JSON.parse(transfertResult.toString());

        // 2. Confirmer le transfert sur la blockchain
        await contractTransferts.submitTransaction('ConfirmerReception', idTransfert);

        // 3. Récupérer le lot actuel
        const lotResult = await contractLots.evaluateTransaction('GetLot', transfert.idLot);
        const lot = JSON.parse(lotResult.toString());

        // Calculer nouvelle quantité
        const nouvelleQuantite = Math.max(0, lot.quantite - transfert.quantite);
        await contractLots.submitTransaction(
            'UpdateLot',
            transfert.idLot,
            'En stock SEN-PNA',
            nouvelleQuantite.toString(),
            transfert.expediteur
        );

        // Créer le sous-lot chez le destinataire
        const idSousLot = transfert.idLot + '-' + idTransfert;
        await contractLots.submitTransaction(
            'CreateSousLot',
            idSousLot,
            transfert.idLot,
            transfert.destinataire,
            transfert.quantite.toString()
        );

        return res.status(200).json({
            message: `Réception du transfert ${idTransfert} confirmée`,
            lot: transfert.idLot,
            destinataire: transfert.destinataire
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
        const data = result.toString();
        const transferts = (data && data !== "null") ? JSON.parse(data) : [];
        return res.status(200).json(transferts);

    } catch (error) {
        return res.status(500).json({ erreur: error.message });
    } finally {
        if (gateway) gateway.disconnect();
    }
};