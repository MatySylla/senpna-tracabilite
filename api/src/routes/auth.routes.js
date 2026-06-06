'use strict';

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Route de connexion — publique
router.post('/login', authController.login);

// Route profil — connexion requise
router.get('/profil', authMiddleware.verifierJWT, authController.profil);

// Route création utilisateur — Admin SEN-PNA uniquement
router.post('/register', 
    authMiddleware.verifierJWT, 
    authMiddleware.autoriser('ADMIN_SENPNA'), 
    authController.register
);

module.exports = router;
