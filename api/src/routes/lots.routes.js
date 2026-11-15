'use strict';

const express = require('express');
const router = express.Router();
const lotsController = require('../controllers/lots.controller');
const { verifierJWT, autoriser } = require('../middleware/auth.middleware');

// Toutes les routes des lots exigent un jeton valide
router.use(verifierJWT);

router.get('/', lotsController.getAllLots);
router.post('/create', autoriser('ADMIN_SENPNA'), lotsController.createLot);
router.get('/fabricant/:numero', lotsController.rechercherParNumeroFabricant);
router.get('/:idLot/historique', lotsController.getHistorique);
router.get('/:idLot/verifier', lotsController.verifierAuthenticite);
router.get('/:idLot', lotsController.getLot);
router.put('/:idLot/statut', autoriser('ADMIN_SENPNA'), lotsController.updateStatut);

module.exports = router;
