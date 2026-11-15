'use strict';

const express = require('express');
const router = express.Router();
const utilisateursController = require('../controllers/utilisateurs.controller');
const { verifierJWT, autoriser } = require('../middleware/auth.middleware');

// La liste des comptes est réservée à l'administrateur SEN-PNA
router.get('/', verifierJWT, autoriser('ADMIN_SENPNA'), utilisateursController.getAll);

module.exports = router;
