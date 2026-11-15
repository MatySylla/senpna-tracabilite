'use strict';

const { Client } = require('pg');

// Créer une connexion PostgreSQL
const getClient = () => new Client({
    host: 'localhost',
    database: 'senpna_db',
    user: 'senpna_user',
    password: 'senpna2026',
    port: 5432
});

// Lister les comptes du système avec leur organisation
exports.getAll = async (req, res) => {
    const client = getClient();
    try {
        await client.connect();

        const result = await client.query(
            `SELECT u.idUtilisateur, u.nom, u.prenom, u.email, u.role, u.actif,
                    o.code AS codeOrg, o.nom AS nomOrg
             FROM utilisateurs u
             LEFT JOIN organisations o ON u.idOrganisation = o.idOrganisation
             ORDER BY u.idUtilisateur`
        );

        res.json(result.rows.map(r => ({
            id: r.idutilisateur,
            nom: r.nom,
            prenom: r.prenom,
            email: r.email,
            role: r.role,
            org: r.codeorg || '—',
            nomOrg: r.nomorg || '—',
            actif: r.actif
        })));
    } catch (e) {
        res.status(500).json({ erreur: e.message });
    } finally {
        await client.end().catch(() => {});
    }
};
