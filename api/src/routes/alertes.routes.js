'use strict';

const express = require('express');
const router = express.Router();
const alertesController = require('../controllers/alertes.controller');

// Route pour lister toutes les alertes 
router.get('/', alertesController.getAllAlertes);
router.post('/creer', alertesController.creerAlerte);
router.get('/:idAlerte', alertesController.getAlerte);
router.post('/rappel', alertesController.declencherRappel);

module.exports = router;