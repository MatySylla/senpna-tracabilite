'use strict';

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifierJWT } = require('../middleware/auth.middleware');

router.post('/login', authController.login);
router.get('/profil', verifierJWT, authController.profil);

module.exports = router;