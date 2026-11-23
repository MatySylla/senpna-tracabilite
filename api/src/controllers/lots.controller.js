'use strict';

const { connectToFabric } = require('../fabric/gateway');

exports.createLot = async (req, res) => {
    let gateway;
    try {
        const { idLot, nomMedicament, codeGTIN, fabricant, numeroLotFabricant, dateFabrication, dateExpiration, quantite, temperature } = req.body;
        if (!idLot || !nomMedicament || !quantite) {
            return res.status(400).json({ erreur: 'Champs obligatoires manquants' });
        }
        gateway = await connectToFabric();
        const contract = (await gateway.getNetwork(process.env.CHANNEL_NAME)).getContract('gestionLots');
        await contract.submitTransaction('CreateLot', idLot, nomMedicament, codeGTIN||'', fabricant||'', numeroLotFabricant||'', dateFabrication||'', dateExpiration||'', quantite.toString(), (temperature||25).toString());
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
        const network = await gateway.getNetwork(process.env.CHANNEL_NAME);

        const contractLots = network.getContract('gestionLots');
        let identifiant = req.params.idLot;

        let result = await contractLots.evaluateTransaction('VerifierAuthenticite', identifiant);
        let verification = JSON.parse(result.toString());

        // Repli : recherche par numero de lot fabricant (imprime sur la boite)
        if (verification.statut === 'SUSPECT' && !verification.alerteActive) {
            try {
                const parFab = await contractLots.evaluateTransaction('RechercherParNumeroFabricant', identifiant);
                const lot = JSON.parse(parFab.toString());
                identifiant = lot.idLot;
                result = await contractLots.evaluateTransaction('VerifierAuthenticite', identifiant);
                verification = JSON.parse(result.toString());
                verification.identifiePar = 'numeroLotFabricant';
                verification.idLot = identifiant;
            } catch (e) {
                // pas trouve non plus : on garde le verdict initial
            }
        }

        if (verification.statut !== 'AUTHENTIQUE') {
            return res.status(200).json(verification);
        }

        try {
            const contractAlertes = network.getContract('gestionAlertes');
            const alertesRaw = await contractAlertes.evaluateTransaction('GetAllAlertes');
            const data = alertesRaw.toString();
            const alertes = (data && data !== 'null') ? JSON.parse(data) : [];

            // Un lot derive herite des alertes de ses ancetres (ML-064-TR-124 -> ML-064)
            const ancetres = [identifiant];
            let courant = identifiant;
            while (/-TR-\d+$/.test(courant)) {
                courant = courant.replace(/-TR-\d+$/, '');
                ancetres.push(courant);
            }
            const alertesLot = alertes.filter(a =>
                ancetres.includes(a.idLot) && a.estActive === true
            );

            if (alertesLot.length > 0) {
                const critique = alertesLot.find(a => a.niveauGravite === 'Critique');
                const alerte = critique || alertesLot[0];

                verification.statut = critique ? 'SUSPECT' : 'AUTHENTIQUE';
                verification.alerteActive = true;
                verification.typeAlerte = alerte.typeAlerte;
                verification.niveauGravite = alerte.niveauGravite;
                verification.message = critique
                    ? `Alerte critique en cours (${alerte.typeAlerte}) — Ne pas dispenser`
                    : `Alerte ${alerte.niveauGravite.toLowerCase()} en cours (${alerte.typeAlerte})`;
            }
        } catch (e) {
            verification.avertissement = 'Vérification des alertes indisponible';
        }

        return res.status(200).json(verification);
    } catch (error) {
        return res.status(500).json({ erreur: error.message });
    } finally {
        if (gateway) gateway.disconnect();
    }
};

exports.rechercherParNumeroFabricant = async (req, res) => {
    let gateway;
    try {
        gateway = await connectToFabric();
        const contract = (await gateway.getNetwork(process.env.CHANNEL_NAME)).getContract('gestionLots');
        const result = await contract.evaluateTransaction('RechercherParNumeroFabricant', req.params.numero);
        return res.status(200).json(JSON.parse(result.toString()));
    } catch (error) {
        return res.status(404).json({ erreur: 'Aucun lot trouve pour ce numero fabricant' });
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
        let lots = (data && data !== 'null') ? JSON.parse(data) : [];
        // Cloisonnement : hors administrateur et inspecteur, un acteur ne voit que les lots de son organisation
        if (!['ADMIN_SENPNA', 'INSPECTEUR_ARP'].includes(req.user.role)) {
            lots = lots.filter(l => l.proprietaireActuel === req.user.organisation);
        }
        return res.status(200).json(lots);
    } catch (error) {
        return res.status(500).json({ erreur: error.message });
    } finally {
        if (gateway) gateway.disconnect();
    }
};
