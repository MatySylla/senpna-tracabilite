'use strict';

const express = require('express');
const router = express.Router();
const alertesController = require('../controllers/alertes.controller');

router.post('/creer', alertesController.creerAlerte);
router.get('/:idAlerte', alertesController.getAlerte);
router.post('/rappel', alertesController.declencherRappel);

module.exports = router;