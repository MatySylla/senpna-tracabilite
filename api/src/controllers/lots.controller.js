'use strict';

const { connectToFabric } = require('../fabric/gateway');

// Créer un lot
exports.createLot = async (req, res) => {
    let gateway;
    try {
        const {
            idLot, nomMedicament, codeGTIN,
            fabricant, dateFabrication, dateExpiration,
            quantite, temperature
        } = req.body;

        // Validation
        if (!idLot || !nomMedicament || !quantite) {
            return res.status(400).json({
                erreur: 'Champs obligatoires manquants : idLot, nomMedicament, quantite'
            });
        }

        gateway = await connectToFabric();
        const network = await gateway.getNetwork(process.env.CHANNEL_NAME);
        const contract = network.getContract('gestionLots');

        await contract.submitTransaction(
            'CreateLot',
            idLot,
            nomMedicament,
            codeGTIN || '',
            fabricant || '',
            dateFabrication || '',
            dateExpiration || '',
            quantite.toString(),
            (temperature || 25).toString()
        );

        return res.status(201).json({
            message: 'Lot créé avec succès',
            idLot: idLot
        });

    } catch (error) {
        return res.status(500).json({ erreur: error.message });
    } finally {
        if (gateway) gateway.disconnect();
    }
};

// Consulter un lot
exports.getLot = async (req, res) => {
    let gateway;
    try {
        const { idLot } = req.params;

        gateway = await connectToFabric();
        const network = await gateway.getNetwork(process.env.CHANNEL_NAME);
        const contract = network.getContract('gestionLots');

        const result = await contract.evaluateTransaction('GetLot', idLot);

        return res.status(200).json(JSON.parse(result.toString()));

    } catch (error) {
        return res.status(404).json({ erreur: error.message });
    } finally {
        if (gateway) gateway.disconnect();
    }
};

// Historique d'un lot
exports.getHistorique = async (req, res) => {
    let gateway;
    try {
        const { idLot } = req.params;

        gateway = await connectToFabric();
        const network = await gateway.getNetwork(process.env.CHANNEL_NAME);
        const contract = network.getContract('gestionLots');

        const result = await contract.evaluateTransaction('GetHistorique', idLot);

        return res.status(200).json(JSON.parse(result.toString()));

    } catch (error) {
        return res.status(500).json({ erreur: error.message });
    } finally {
        if (gateway) gateway.disconnect();
    }
};

// Vérifier authenticité — accès public
exports.verifierAuthenticite = async (req, res) => {
    let gateway;
    try {
        const { idLot } = req.params;

        gateway = await connectToFabric();
        const network = await gateway.getNetwork(process.env.CHANNEL_NAME);
        const contract = network.getContract('gestionLots');

        const result = await contract.evaluateTransaction('VerifierAuthenticite', idLot);

        return res.status(200).json(JSON.parse(result.toString()));

    } catch (error) {
        return res.status(500).json({ erreur: error.message });
    } finally {
        if (gateway) gateway.disconnect();
    }
};

// Mettre à jour statut
exports.updateStatut = async (req, res) => {
    let gateway;
    try {
        const { idLot } = req.params;
        const { statut } = req.body;

        if (!statut) {
            return res.status(400).json({ erreur: 'Le statut est obligatoire' });
        }

        gateway = await connectToFabric();
        const network = await gateway.getNetwork(process.env.CHANNEL_NAME);
        const contract = network.getContract('gestionLots');

        await contract.submitTransaction('UpdateStatut', idLot, statut);

        return res.status(200).json({
            message: `Statut du lot ${idLot} mis à jour : ${statut}`
        });

    } catch (error) {
        return res.status(500).json({ erreur: error.message });
    } finally {
        if (gateway) gateway.disconnect();
    }
};