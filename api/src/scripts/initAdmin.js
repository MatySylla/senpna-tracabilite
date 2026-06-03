'use strict';

const bcrypt = require('bcryptjs');
const { Client } = require('pg');

async function initAdmin() {
    const client = new Client({
        host: 'localhost',
        database: 'senpna_db',
        user: 'senpna_user',
        password: 'senpna2026',
        port: 5432
    });

    await client.connect();

    // Hasher le mot de passe
    const motDePasseHash = await bcrypt.hash('Admin@2026', 12);

    // Insérer l'admin
    await client.query(`
        INSERT INTO utilisateurs 
        (nom, prenom, email, motDePasse, role, idOrganisation)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (email) DO NOTHING
    `, ['Diallo', 'Seydou', 'admin@senpna.sn', motDePasseHash, 'ADMIN_SENPNA', 1]);

    // Insérer inspecteur ARP
    const motDePasseARP = await bcrypt.hash('Arp@2026', 12);
    await client.query(`
        INSERT INTO utilisateurs 
        (nom, prenom, email, motDePasse, role, idOrganisation)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (email) DO NOTHING
    `, ['Sylla', 'Fatou', 'inspecteur@arp.sn', motDePasseARP, 'INSPECTEUR_ARP', 2]);

    // Insérer pharmacien PRA Dakar
    const motDePassePRA = await bcrypt.hash('Pra@2026', 12);
    await client.query(`
        INSERT INTO utilisateurs 
        (nom, prenom, email, motDePasse, role, idOrganisation)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (email) DO NOTHING
    `, ['Sow', 'Ibrahima', 'pharmacien@pra-dakar.sn', motDePassePRA, 'PHARMACIEN_PRA', 3]);

    // Vérifier
    const result = await client.query(
        'SELECT idUtilisateur, nom, prenom, email, role FROM utilisateurs'
    );
    
    console.log('✅ Utilisateurs créés :');
    console.table(result.rows);

    await client.end();
}

initAdmin().catch(console.error);