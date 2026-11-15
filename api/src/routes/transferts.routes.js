'use strict';

const express = require('express');
const router = express.Router();
const transfertsController = require('../controllers/transferts.controller');
const { verifierJWT, autoriser } = require('../middleware/auth.middleware');

// Toutes les routes des transferts exigent un jeton valide
router.use(verifierJWT);

router.get('/', transfertsController.getAllTransferts);
router.post('/initier',
    autoriser('ADMIN_SENPNA', 'PHARMACIEN_PRA', 'AGENT_DISTRICT'),
    transfertsController.initierTransfert);
router.get('/:idTransfert', transfertsController.getTransfert);
router.put('/:idTransfert/confirmer',
    autoriser('PHARMACIEN_PRA', 'AGENT_DISTRICT', 'AGENT_STRUCTURE'),
    transfertsController.confirmerReception);
router.put('/:idTransfert/rejeter',
    autoriser('PHARMACIEN_PRA', 'AGENT_DISTRICT', 'AGENT_STRUCTURE'),
    transfertsController.rejeterTransfert);

module.exports = router;
