'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Client } = require('pg');

const JWT_SECRET = process.env.JWT_SECRET || 'senpna_secret_2026';

const getClient = () => new Client({
    host: 'localhost',
    database: 'senpna_db',
    user: 'senpna_user',
    password: 'senpna2026',
    port: 5432
});

// Login
exports.login = async (req, res) => {
    const client = getClient();
    try {
        const { email, motDePasse } = req.body;

        if (!email || !motDePasse) {
            return res.status(400).json({
                erreur: 'Email et mot de passe obligatoires'
            });
        }

        await client.connect();

        // Chercher l'utilisateur
        const result = await client.query(
            `SELECT u.*, o.code as codeOrg, o.nom as nomOrg 
             FROM utilisateurs u 
             LEFT JOIN organisations o ON u.idOrganisation = o.idOrganisation
             WHERE u.email = $1 AND u.actif = TRUE`,
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ erreur: 'Email ou mot de passe incorrect' });
        }

        const user = result.rows[0];

        // Vérifier mot de passe
        const motDePasseValide = await bcrypt.compare(motDePasse, user.motdepasse);
        if (!motDePasseValide) {
            return res.status(401).json({ erreur: 'Email ou mot de passe incorrect' });
        }

        // Générer JWT
        const token = jwt.sign(
            {
                id: user.idutilisateur,
                nom: user.nom,
                prenom: user.prenom,
                email: user.email,
                role: user.role,
                organisation: user.codeorg,
                nomOrganisation: user.nomorg
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Enregistrer log
        await client.query(
            `INSERT INTO logs (action, details, ipAdresse, idUtilisateur)
             VALUES ($1, $2, $3, $4)`,
            ['LOGIN', `Connexion de ${user.nom} ${user.prenom}`,
             req.ip, user.idutilisateur]
        );

        return res.status(200).json({
            message: 'Connexion réussie',
            token,
            utilisateur: {
                id: user.idutilisateur,
                nom: user.nom,
                prenom: user.prenom,
                email: user.email,
                role: user.role,
                organisation: user.codeorg
            }
        });

    } catch (error) {
        return res.status(500).json({ erreur: error.message });
    } finally {
        await client.end();
    }
};

// Profil utilisateur connecté
exports.profil = async (req, res) => {
    return res.status(200).json({
        message: 'Profil récupéré',
        utilisateur: req.user
    });
};