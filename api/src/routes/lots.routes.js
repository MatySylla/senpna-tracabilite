'use strict';

const express = require('express');
const router = express.Router();
const lotsController = require('../controllers/lots.controller');

// Routes lots
router.post('/create', lotsController.createLot);
router.get('/:idLot', lotsController.getLot);
router.get('/:idLot/historique', lotsController.getHistorique);
router.put('/:idLot/statut', lotsController.updateStatut);

module.exports = router;