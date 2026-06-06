'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Client } = require('pg');

const JWT_SECRET = process.env.JWT_SECRET || 'senpna_secret_2026';

// Créer une connexion PostgreSQL
const getClient = () => new Client({
    host: 'localhost',
    database: 'senpna_db',
    user: 'senpna_user',
    password: 'senpna2026',
    port: 5432
});

// Connexion utilisateur — génère un token JWT
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

        // Chercher l'utilisateur avec son organisation
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

        // Vérifier le mot de passe avec bcrypt
        const motDePasseValide = await bcrypt.compare(motDePasse, user.motdepasse);
        if (!motDePasseValide) {
            return res.status(401).json({ erreur: 'Email ou mot de passe incorrect' });
        }

        // Générer le token JWT valable 24h
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

        // Enregistrer la connexion dans les logs
        await client.query(
            `INSERT INTO logs (action, details, ipAdresse, idUtilisateur)
             VALUES ($1, $2, $3, $4)`,
            ['LOGIN', `Connexion de ${user.nom} ${user.prenom}`, req.ip, user.idutilisateur]
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
                organisation: user.codeorg,
                nomOrganisation: user.nomorg
            }
        });

    } catch (error) {
        return res.status(500).json({ erreur: error.message });
    } finally {
        await client.end();
    }
};

// Créer un nouvel utilisateur — Admin SEN-PNA uniquement
exports.register = async (req, res) => {
    const client = getClient();
    try {
        const { nom, prenom, email, motDePasse, role, idOrganisation } = req.body;

        if (!nom || !prenom || !email || !motDePasse || !role) {
            return res.status(400).json({
                erreur: 'Tous les champs sont obligatoires'
            });
        }

        await client.connect();

        // Vérifier que l'email n'existe pas déjà
        const existant = await client.query(
            'SELECT idUtilisateur FROM utilisateurs WHERE email = $1',
            [email]
        );

        if (existant.rows.length > 0) {
            return res.status(409).json({
                erreur: 'Cet email est déjà utilisé'
            });
        }

        // Hasher le mot de passe avec bcrypt
        const motDePasseHash = await bcrypt.hash(motDePasse, 12);

        // Insérer le nouvel utilisateur dans PostgreSQL
        const result = await client.query(`
            INSERT INTO utilisateurs
            (nom, prenom, email, motDePasse, role, idOrganisation)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING idUtilisateur, nom, prenom, email, role
        `, [nom, prenom, email, motDePasseHash, role, idOrganisation]);

        // Enregistrer la création dans les logs
        await client.query(`
            INSERT INTO logs (action, details, ipAdresse, idUtilisateur)
            VALUES ($1, $2, $3, $4)
        `, ['CREATE_USER', `Utilisateur ${email} créé`, req.ip, result.rows[0].idutilisateur]);

        return res.status(201).json({
            message: 'Utilisateur créé avec succès',
            utilisateur: result.rows[0]
        });

    } catch (error) {
        return res.status(500).json({ erreur: error.message });
    } finally {
        await client.end();
    }
};

// Récupérer le profil de l'utilisateur connecté
exports.profil = async (req, res) => {
    return res.status(200).json({
        message: 'Profil récupéré',
        utilisateur: req.user
    });
};
