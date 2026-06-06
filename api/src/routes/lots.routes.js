'use strict';

const express = require('express');
const router = express.Router();
const lotsController = require('../controllers/lots.controller');

// Route pour lister tous les lots — doit être en premier
router.get('/', lotsController.getAllLots);

// Routes lots
router.post('/create', lotsController.createLot);
router.get('/:idLot/historique', lotsController.getHistorique);
router.get('/:idLot', lotsController.getLot);
router.put('/:idLot/statut', lotsController.updateStatut);

module.exports = router;
