'use strict';

const express = require('express');
const router = express.Router();
const transfertsController = require('../controllers/transferts.controller');

router.post('/initier', transfertsController.initierTransfert);
router.get('/:idTransfert', transfertsController.getTransfert);
router.put('/:idTransfert/confirmer', transfertsController.confirmerReception);
router.put('/:idTransfert/rejeter', transfertsController.rejeterTransfert);

module.exports = router;