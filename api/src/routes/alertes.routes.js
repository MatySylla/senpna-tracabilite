'use strict';

const express = require('express');
const router = express.Router();
const alertesController = require('../controllers/alertes.controller');
const { verifierJWT, autoriser } = require('../middleware/auth.middleware');

// Toutes les routes des alertes exigent un jeton valide
router.use(verifierJWT);

router.get('/', alertesController.getAllAlertes);
router.post('/creer', alertesController.creerAlerte);
// Le rappel officiel est réservé à l'autorité de régulation
router.post('/rappel', autoriser('INSPECTEUR_ARP'), alertesController.declencherRappel);
router.get('/:idAlerte', alertesController.getAlerte);

module.exports = router;
