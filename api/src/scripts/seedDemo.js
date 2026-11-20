'use strict';
// Données de démonstration SEN-PNA — passe par l'API (port 3000)
// Usage :  node src/scripts/seedDemo.js test   → 1 lot + 1 transfert (pour vérifier)
//          node src/scripts/seedDemo.js all    → tout le jeu de données

const API = 'http://localhost:3000/api';

// Mots de passe des comptes utilisés (tous : senpna2026)
const COMPTES = {
  'SENPNA':    ['admin@senpna.sn',              'senpna2026'],
  'PRA-DKR':   ['pharmacien@pra-dakar.sn',      'senpna2026'],
  'PRA-THIS':  ['pharmacien@pra-thies.sn',      'senpna2026'],
  'PRA-DIO':   ['pharmacien@pra-diourbel.sn',   'senpna2026'],
  'PRA-STL':   ['pharmacien@pra-saintlouis.sn', 'senpna2026'],
  'PRA-KLK':   ['pharmacien@pra-kaolack.sn',    'senpna2026'],
  'DIST-THIS': ['agent@district-thies.sn',      'senpna2026'],
};

const F1 = 'Pharma Sahel Industries';
const F2 = 'Laboratoire Baobab Génériques';
const LOTS = [
  ['ML-060', 'Paracétamol 500 mg, comprimé',                 '6290001000601', F1, 'PSI-26-0601', '2026-03-10', '2029-03-09', 2000],
  ['ML-061', 'Amoxicilline 500 mg, gélule',                  '6290001000618', F2, 'LBG-26-0412', '2026-04-02', '2028-04-01', 1500],
  ['ML-062', 'Artéméther/Luméfantrine 20/120 mg, comprimé',  '6290001000625', F1, 'PSI-26-0715', '2026-05-15', '2028-05-14', 1200],
  ['ML-063', 'Sels de réhydratation orale, sachet',          '6290001000632', F2, 'LBG-26-0520', '2026-05-20', '2029-05-19', 3000],
  ['ML-064', 'Métformine 500 mg, comprimé',                  '6290001000649', F1, 'PSI-26-0802', '2026-06-01', '2029-05-31', 1000],
  ['ML-065', 'Fer + acide folique, comprimé',                '6290001000656', F2, 'LBG-26-0610', '2026-06-10', '2028-06-09', 2500],
  ['ML-066', 'Cotrimoxazole 480 mg, comprimé',               '6290001000663', F1, 'PSI-26-0905', '2026-07-05', '2028-07-04', 1800],
  ['ML-067', 'Ibuprofène 400 mg, comprimé',                  '6290001000670', F2, 'LBG-26-0718', '2026-07-18', '2029-07-17', 1600],
  ['ML-068', 'Zinc 20 mg, comprimé dispersible',             '6290001000687', F1, 'PSI-26-1003', '2026-08-03', '2028-08-02', 2200],
  ['ML-069', 'Amlodipine 5 mg, comprimé',                    '6290001000694', F2, 'LBG-26-0825', '2026-08-25', '2029-08-24', 900],
];

// [idTransfert, idLot, expéditeur, destinataire, quantité, action]
const TRANSFERTS = [
  ['TR-120', 'ML-060',        'SENPNA',   'PRA-DKR',   300, 'confirmer'],
  ['TR-121', 'ML-061',        'SENPNA',   'PRA-THIS',  250, 'confirmer'],
  ['TR-122', 'ML-062',        'SENPNA',   'PRA-DIO',   200, 'confirmer'],
  ['TR-123', 'ML-063',        'SENPNA',   'PRA-STL',   500, 'confirmer'],
  ['TR-124', 'ML-064',        'SENPNA',   'PRA-KLK',   150, 'confirmer'],
  ['TR-125', 'ML-061-TR-121', 'PRA-THIS', 'DIST-THIS',  80, 'confirmer'],
  ['TR-126', 'ML-065',        'SENPNA',   'PRA-DIO',   400, 'rejeter'],
  ['TR-127', 'ML-066',        'SENPNA',   'PRA-THIS',  300, 'attente'],
];

const jetons = {};
async function appel(methode, chemin, jeton, corps) {
  const r = await fetch(API + chemin, {
    method: methode,
    headers: { 'Content-Type': 'application/json', ...(jeton && { Authorization: 'Bearer ' + jeton }) },
    body: corps ? JSON.stringify(corps) : undefined,
  });
  let data; try { data = await r.json(); } catch { data = {}; }
  return { ok: r.ok, status: r.status, data };
}
async function jeton(org) {
  if (jetons[org]) return jetons[org];
  const [email, motDePasse] = COMPTES[org];
  let r = await appel('POST', '/auth/login', null, { email, motDePasse });
  const anciens = { 'admin@senpna.sn': 'Admin@2026', 'pharmacien@pra-dakar.sn': 'Pra@2026' };
  if (!r.ok && anciens[email]) r = await appel('POST', '/auth/login', null, { email, motDePasse: anciens[email] });
  const t = r.data.token || r.data.accessToken || (r.data.data && r.data.data.token);
  if (!t) throw new Error(`Connexion impossible pour ${email} : ${JSON.stringify(r.data)}`);
  return (jetons[org] = t);
}

async function creerLot(l) {
  const admin = await jeton('SENPNA');
  if ((await appel('GET', '/lots/' + l[0], admin)).ok) return console.log(`= ${l[0]} existe déjà, ignoré`);
  const [idLot, nomMedicament, codeGTIN, fabricant, numeroLotFabricant, dateFabrication, dateExpiration, quantite] = l;
  const r = await appel('POST', '/lots/create', admin, { idLot, nomMedicament, codeGTIN, fabricant,
    numeroLotFabricant, dateFabrication, dateExpiration, quantite, temperature: 22.5 });
  console.log(r.ok ? `✔ Lot ${idLot} créé (${quantite})` : `✘ Lot ${idLot} : ${r.status} ${JSON.stringify(r.data)}`);
}

async function faireTransfert(t) {
  const [idTransfert, idLot, expediteur, destinataire, quantite, action] = t;
  const exp = await jeton(expediteur);
  if ((await appel('GET', '/transferts/' + idTransfert, exp)).ok) return console.log(`= ${idTransfert} existe déjà, ignoré`);
  let r = await appel('POST', '/transferts/initier', exp, { idTransfert, idLot, expediteur, destinataire,
    quantite, bonLivraison: 'BL-' + idTransfert });
  if (!r.ok) return console.log(`✘ ${idTransfert} initiation : ${r.status} ${JSON.stringify(r.data)}`);
  console.log(`✔ ${idTransfert} initié : ${idLot} → ${destinataire} (${quantite})`);
  if (action === 'attente') return;
  const dest = await jeton(destinataire);
  r = action === 'confirmer'
    ? await appel('PUT', `/transferts/${idTransfert}/confirmer`, dest)
    : await appel('PUT', `/transferts/${idTransfert}/rejeter`, dest, { motif: 'Emballages endommagés à la livraison' });
  console.log(r.ok ? `  ✔ ${idTransfert} ${action === 'confirmer' ? 'confirmé' : 'rejeté'}`
                   : `  ✘ ${idTransfert} ${action} : ${r.status} ${JSON.stringify(r.data)}`);
}

async function verifierSousLot(id) {
  const r = await appel('GET', '/lots/' + id, await jeton('SENPNA'));
  const lot = r.data.data || r.data;
  console.log(`→ ${id} : quantité ${lot.quantite}, propriétaire ${lot.proprietaireActuel}, ` +
              `parent ${lot.lotParent}, n° fabricant « ${lot.numeroLotFabricant || ''} »`);
}

(async () => {
  const mode = process.argv[2];
  if (mode === 'test') {
    await creerLot(LOTS[0]);
    await faireTransfert(TRANSFERTS[0]);
    await verifierSousLot('ML-060');
    await verifierSousLot('ML-060-TR-120');
  } else if (mode === 'all') {
    for (const l of LOTS) await creerLot(l);
    for (const t of TRANSFERTS) await faireTransfert(t);
  } else {
    console.log('Usage : node src/scripts/seedDemo.js test | all');
  }
})().catch(e => console.error('ERREUR :', e.message));
