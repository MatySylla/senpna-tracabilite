'use strict';

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'senpna_secret_2026';

// Vérifier le token JWT
exports.verifierJWT = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ erreur: 'Token manquant — Accès refusé' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ erreur: 'Token invalide ou expiré' });
    }
};

// Vérifier le rôle
exports.autoriser = (...rolesAutorises) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ erreur: 'Non authentifié' });
        }
        if (!rolesAutorises.includes(req.user.role)) {
            return res.status(403).json({
                erreur: `Accès refusé — Rôle requis : ${rolesAutorises.join(' ou ')}`
            });
        }
        next();
    };
};