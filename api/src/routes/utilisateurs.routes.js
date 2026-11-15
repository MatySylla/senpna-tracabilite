'use strict';

const express = require('express');
const router = express.Router();
const utilisateursController = require('../controllers/utilisateurs.controller');

// Lister les comptes du système
router.get('/', utilisateursController.getAll);

module.exports = router;
