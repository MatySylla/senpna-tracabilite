'use strict';

const { connectToFabric } = require('../fabric/gateway');

// Créer une alerte
exports.creerAlerte = async (req, res) => {
    let gateway;
    try {
        const { idAlerte, idLot, typeAlerte, niveauGravite, message, emetteur } = req.body;

        if (!idAlerte || !idLot || !typeAlerte || !message) {
            return res.status(400).json({
                erreur: 'Champs obligatoires : idAlerte, idLot, typeAlerte, message'
            });
        }

        gateway = await connectToFabric();
        const network = await gateway.getNetwork(process.env.CHANNEL_NAME);
        const contract = network.getContract('gestionAlertes');

        await contract.submitTransaction(
            'CreerAlerte',
            idAlerte,
            idLot,
            typeAlerte,
            niveauGravite || 'Moyen',
            message,
            emetteur || 'Système'
        );

        return res.status(201).json({
            message: 'Alerte créée avec succès',
            idAlerte
        });

    } catch (error) {
        return res.status(500).json({ erreur: error.message });
    } finally {
        if (gateway) gateway.disconnect();
    }
};

// Consulter une alerte
exports.getAlerte = async (req, res) => {
    let gateway;
    try {
        const { idAlerte } = req.params;

        gateway = await connectToFabric();
        const network = await gateway.getNetwork(process.env.CHANNEL_NAME);
        const contract = network.getContract('gestionAlertes');

        const result = await contract.evaluateTransaction('GetAlerte', idAlerte);

        return res.status(200).json(JSON.parse(result.toString()));

    } catch (error) {
        return res.status(404).json({ erreur: error.message });
    } finally {
        if (gateway) gateway.disconnect();
    }
};

// Déclencher un rappel officiel
exports.declencherRappel = async (req, res) => {
    let gateway;
    try {
        const { idAlerte, idLot, motif } = req.body;

        if (!idAlerte || !idLot || !motif) {
            return res.status(400).json({
                erreur: 'Champs obligatoires : idAlerte, idLot, motif'
            });
        }

        gateway = await connectToFabric();
        const network = await gateway.getNetwork(process.env.CHANNEL_NAME);
        const contract = network.getContract('gestionAlertes');

        await contract.submitTransaction('DeclencherRappel', idAlerte, idLot, motif);

        return res.status(201).json({
            message: `Rappel officiel déclenché pour le lot ${idLot}`,
            idAlerte
        });

    } catch (error) {
        return res.status(500).json({ erreur: error.message });
    } finally {
        if (gateway) gateway.disconnect();
    }
};
// Lister toutes les alertes depuis la blockchain
exports.getAllAlertes = async (req, res) => {
    let gateway;
    try {
        gateway = await connectToFabric();
        const network = await gateway.getNetwork(process.env.CHANNEL_NAME);
        const contract = network.getContract('gestionAlertes');

        const result = await contract.evaluateTransaction('GetAllAlertes');
        const alertes = JSON.parse(result.toString());

        return res.status(200).json(alertes || []);

    } catch (error) {
        return res.status(500).json({ erreur: error.message });
    } finally {
        if (gateway) gateway.disconnect();
    }
};