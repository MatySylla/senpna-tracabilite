'use strict';

const { connectToFabric } = require('../fabric/gateway');

exports.createLot = async (req, res) => {
    let gateway;
    try {
        const { idLot, nomMedicament, codeGTIN, fabricant, dateFabrication, dateExpiration, quantite, temperature } = req.body;
        if (!idLot || !nomMedicament || !quantite) {
            return res.status(400).json({ erreur: 'Champs obligatoires manquants' });
        }
        gateway = await connectToFabric();
        const contract = (await gateway.getNetwork(process.env.CHANNEL_NAME)).getContract('gestionLots');
        await contract.submitTransaction('CreateLot', idLot, nomMedicament, codeGTIN||'', fabricant||'', dateFabrication||'', dateExpiration||'', quantite.toString(), (temperature||25).toString());
        return res.status(201).json({ message: 'Lot créé avec succès', idLot });
    } catch (error) {
        return res.status(500).json({ erreur: error.message });
    } finally {
        if (gateway) gateway.disconnect();
    }
};

exports.getLot = async (req, res) => {
    let gateway;
    try {
        gateway = await connectToFabric();
        const contract = (await gateway.getNetwork(process.env.CHANNEL_NAME)).getContract('gestionLots');
        const result = await contract.evaluateTransaction('GetLot', req.params.idLot);
        return res.status(200).json(JSON.parse(result.toString()));
    } catch (error) {
        return res.status(404).json({ erreur: error.message });
    } finally {
        if (gateway) gateway.disconnect();
    }
};

exports.getHistorique = async (req, res) => {
    let gateway;
    try {
        gateway = await connectToFabric();
        const contract = (await gateway.getNetwork(process.env.CHANNEL_NAME)).getContract('gestionLots');
        const result = await contract.evaluateTransaction('GetHistorique', req.params.idLot);
        const data = result.toString();
        return res.status(200).json(data ? JSON.parse(data) : []);
    } catch (error) {
        return res.status(500).json({ erreur: error.message });
    } finally {
        if (gateway) gateway.disconnect();
    }
};

exports.verifierAuthenticite = async (req, res) => {
    let gateway;
    try {
        gateway = await connectToFabric();
        const contract = (await gateway.getNetwork(process.env.CHANNEL_NAME)).getContract('gestionLots');
        const result = await contract.evaluateTransaction('VerifierAuthenticite', req.params.idLot);
        return res.status(200).json(JSON.parse(result.toString()));
    } catch (error) {
        return res.status(500).json({ erreur: error.message });
    } finally {
        if (gateway) gateway.disconnect();
    }
};

exports.updateStatut = async (req, res) => {
    let gateway;
    try {
        const { statut } = req.body;
        if (!statut) return res.status(400).json({ erreur: 'Statut obligatoire' });
        gateway = await connectToFabric();
        const contract = (await gateway.getNetwork(process.env.CHANNEL_NAME)).getContract('gestionLots');
        await contract.submitTransaction('UpdateStatut', req.params.idLot, statut);
        return res.status(200).json({ message: `Statut mis à jour : ${statut}` });
    } catch (error) {
        return res.status(500).json({ erreur: error.message });
    } finally {
        if (gateway) gateway.disconnect();
    }
};

exports.getAllLots = async (req, res) => {
    let gateway;
    try {
        gateway = await connectToFabric();
        const contract = (await gateway.getNetwork(process.env.CHANNEL_NAME)).getContract('gestionLots');
        const result = await contract.evaluateTransaction('GetAllLots');
        const data = result.toString();
        // Retourne [] si vide ou null
        const lots = (data && data !== 'null') ? JSON.parse(data) : [];
        return res.status(200).json(lots);
    } catch (error) {
        return res.status(500).json({ erreur: error.message });
    } finally {
        if (gateway) gateway.disconnect();
    }
};
