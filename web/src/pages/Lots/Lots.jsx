import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout/Layout';
import { getLot, createLot, getHistorique, getAllLots, getAllTransferts } from '../../services/api';
import { QRCodeSVG } from 'qrcode.react';

// Le chaincode renvoie un timestamp Unix en secondes (chaine).
const formaterDate = (v) => {
  if (!v) return '—';
  const d = /^\d+$/.test(String(v)) ? new Date(Number(v) * 1000) : new Date(v);
  return isNaN(d.getTime()) ? '—' : d.toLocaleString('fr-FR');
};


const Lots = () => {
  const { user } = useAuth();

  // États du composant
  const [lots, setLots] = useState([]);
  const [idLotRecherche, setIdLotRecherche] = useState('');
  const [lotResult, setLotResult] = useState(null);
  const [historique, setHistorique] = useState(null);
  const [transfertsLies, setTransfertsLies] = useState([]);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Données du formulaire de création
  const [formData, setFormData] = useState({
    idLot: '', nomMedicament: '', codeGTIN: '',
    fabricant: '', numeroLotFabricant: '', dateFabrication: '', dateExpiration: '',
    quantite: '', temperature: '25'
  });

  // Charger les lots au démarrage de la page
  useEffect(() => {
    chargerLots();
  }, []);

  // Récupérer tous les lots depuis la blockchain
  const chargerLots = async () => {
    try {
      const res = await getAllLots();
      console.log('Lots reçus :', res.data); // Pour déboguer
      if (res.data && Array.isArray(res.data)) {
        setLots(res.data);
      }
    } catch (err) {
      console.error('Erreur chargement lots :', err);
    }
  };

  // Rechercher un lot spécifique dans la blockchain
  const handleRecherche = async () => {
    if (!idLotRecherche) return;
    setLoading(true);
    setErreur('');
    setLotResult(null);
    setHistorique(null);
    setTransfertsLies([]);
    try {
      const res = await getLot(idLotRecherche);
      setLotResult(res.data);
    } catch (err) {
      setErreur(err.response?.data?.erreur || 'Lot introuvable');
    } finally {
      setLoading(false);
    }
  };

  // Obtenir l'historique complet et immuable d'un lot
  const handleHistorique = async () => {
    if (!idLotRecherche) return;
    setLoading(true);
    setErreur('');
    try {
      const res = await getHistorique(idLotRecherche);
      setHistorique(res.data);
      // Transferts lies a ce lot, lus dans le contrat gestionTransferts
      try {
        const id = idLotRecherche.trim();
        const rt = await getAllTransferts();
        const liste = Array.isArray(rt.data) ? rt.data : (Array.isArray(rt.data?.data) ? rt.data.data : []);
        const recu = id.match(/-(TR-\d+)$/); // lot derive : transfert par lequel il a ete recu
        const lies = liste
          .filter(t => t.idLot === id || (recu && t.idTransfert === recu[1]))
          .map(t => ({ ...t, sens: t.idLot === id ? 'envoi' : 'reception' }));
        setTransfertsLies(lies);
      } catch (e) {
        setTransfertsLies([]);
      }
    } catch (err) {
      setErreur('Erreur lors de la récupération de l\'historique');
    } finally {
      setLoading(false);
    }
  };

  // Créer un nouveau lot dans la blockchain
  const handleCreateLot = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErreur('');
    try {
      await createLot({
        ...formData,
        quantite: parseInt(formData.quantite),
        temperature: parseFloat(formData.temperature)
      });
      setSucces(`✅ Lot ${formData.idLot} créé avec succès dans la blockchain !`);
      setShowForm(false);
      setFormData({
        idLot: '', nomMedicament: '', codeGTIN: '',
        fabricant: '', numeroLotFabricant: '', dateFabrication: '', dateExpiration: '',
        quantite: '', temperature: '25'
      });
      // Recharger la liste après création
      await chargerLots();
    } catch (err) {
      setErreur(err.response?.data?.erreur || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  // Couleur du badge selon le statut du lot
  const getStatutStyle = (statut) => {
    if (statut === 'Rappelé') return { background: '#FCEBEB', color: '#A32D2D' };
    if (statut?.includes('transit')) return { background: '#E6F1FB', color: '#0C447C' };
    return { background: '#EAF3DE', color: '#27500A' };
  };

  return (
    <Layout pageCourante="/lots">

      {/* En-tête de la page */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: '#1a1a1a', marginBottom: 4 }}>
            Gestion des lots
          </h1>
          <p style={{ fontSize: 14, color: '#666' }}>
            Rechercher, créer et suivre les lots de médicaments
          </p>
        </div>

        {/* Bouton créer — Admin SEN-PNA uniquement */}
        {user?.role === 'ADMIN_SENPNA' && (
          <button onClick={() => setShowForm(!showForm)}
            style={{ padding: '10px 20px', background: '#185FA5', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
            + Créer un lot
          </button>
        )}
      </div>

      {/* Messages de succès et d'erreur */}
      {succes && (
        <div style={{ background: '#EAF3DE', color: '#27500A', padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
          {succes}
        </div>
      )}
      {erreur && (
        <div style={{ background: '#FCEBEB', color: '#A32D2D', padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
          {erreur}
        </div>
      )}

      {/* Formulaire de création — Admin SEN-PNA uniquement */}
      {showForm && user?.role === 'ADMIN_SENPNA' && (
        <div style={{ background: 'white', borderRadius: 12, padding: 24, marginBottom: 24, border: '1px solid #e8ecf0' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
            Nouveau lot de médicaments
          </h2>
          <form onSubmit={handleCreateLot}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { label: 'ID du lot *', key: 'idLot', placeholder: 'Ex: ML-044', type: 'text' },
                { label: 'Code GTIN *', key: 'codeGTIN', placeholder: 'Ex: 09506000134452', type: 'text' },
                { label: 'Nom du médicament *', key: 'nomMedicament', placeholder: 'Ex: Artéméther 80mg', type: 'text' },
                { label: 'Fabricant *', key: 'fabricant', placeholder: 'Ex: Sanofi France', type: 'text' },
                { label: 'N° lot fabricant *', key: 'numeroLotFabricant', placeholder: 'Ex: 4B2109 (imprimé sur la boîte)', type: 'text' },
                { label: 'Quantité (boîtes) *', key: 'quantite', placeholder: 'Ex: 1000', type: 'number' },
                { label: 'Température (°C)', key: 'temperature', placeholder: 'Ex: 25', type: 'number' },
                { label: 'Date fabrication *', key: 'dateFabrication', placeholder: '', type: 'date' },
                { label: 'Date expiration *', key: 'dateExpiration', placeholder: '', type: 'date' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#444', marginBottom: 5 }}>
                    {f.label}
                  </label>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={formData[f.key]}
                    onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                    required={f.label.includes('*')}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="button" onClick={() => setShowForm(false)}
                style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer' }}>
                Annuler
              </button>
              <button type="submit" disabled={loading}
                style={{ padding: '10px 20px', background: '#185FA5', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500 }}>
                {loading ? 'Enregistrement...' : '✅ Enregistrer dans la blockchain'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Recherche d'un lot */}
      <div style={{ background: 'white', borderRadius: 12, padding: 24, marginBottom: 24, border: '1px solid #e8ecf0' }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
          Rechercher un lot
        </h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <input
            value={idLotRecherche}
            onChange={e => setIdLotRecherche(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleRecherche()}
            placeholder="Entrez l'ID du lot (Ex: ML-042)"
            style={{ flex: 1, padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14 }}
          />
          <button onClick={handleRecherche} disabled={loading}
            style={{ padding: '10px 20px', background: '#185FA5', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500 }}>
            🔍 Rechercher
          </button>
          <button onClick={handleHistorique} disabled={loading}
            style={{ padding: '10px 20px', background: '#3B6D11', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500 }}>
            📋 Historique
          </button>
        </div>

        {/* Résultat de la recherche */}
        {lotResult && (
          <div style={{ marginTop: 20, padding: 16, background: '#f9fafb', borderRadius: 10, border: '1px solid #e8ecf0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600 }}>{lotResult.nomMedicament}</h3>
              <span style={{ ...getStatutStyle(lotResult.statut), padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>
                {lotResult.statut}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                ['ID Lot', lotResult.idLot],
                ['Code GTIN', lotResult.codeGTIN],
                ['Fabricant', lotResult.fabricant],
                ['N° lot fabricant', lotResult.numeroLotFabricant],
                ['Quantité', `${lotResult.quantite} boîtes`],
                ['Propriétaire actuel', lotResult.proprietaireActuel],
                ['Date fabrication', lotResult.dateFabrication],
                ['Date expiration', lotResult.dateExpiration],
                ['Température', `${lotResult.temperature}°C`],
                ['Créé le', formaterDate(lotResult.dateCreation)],
                ['Mis à jour', formaterDate(lotResult.dateMiseAJour)],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #eee', fontSize: 13 }}>
                  <span style={{ color: '#666' }}>{k}</span>
                  <span style={{ fontWeight: 500, color: '#333' }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Code QR genere a l'affichage a partir de l'identifiant du lot */}
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #eee', textAlign: 'center' }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#333' }}>
                Code QR du lot
              </h4>
              <div style={{ display: 'inline-block', padding: 12, background: '#fff', border: '1px solid #ddd', borderRadius: 8 }}>
                <div id="etiquette-qr"><QRCodeSVG value={lotResult.idLot} size={160} level="M" /></div>
              </div>
              <p style={{ fontSize: 12, color: '#666', marginTop: 10 }}>
                Contenu : <strong>{lotResult.idLot}</strong>
                {lotResult.numeroLotFabricant ? ` — n° fabricant ${lotResult.numeroLotFabricant}` : ''}
              </p>
              <p style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                Généré à l&apos;affichage, non stocké dans le registre
              </p>
              <button
                onClick={() => {
                  const zone = document.getElementById('etiquette-qr');
                  const f = window.open('', '', 'width=420,height=560');
                  f.document.write(`<html><head><title>Etiquette ${lotResult.idLot}</title>
                    <style>body{font-family:Arial,sans-serif;text-align:center;padding:24px}
                    .b{border:2px solid #000;border-radius:8px;padding:16px;display:inline-block}
                    h3{margin:0 0 4px;font-size:15px}p{margin:2px 0;font-size:12px}</style>
                    </head><body><div class="b">
                    <h3>${lotResult.nomMedicament}</h3>
                    <p>Lot ${lotResult.idLot}</p>
                    ${zone.innerHTML}
                    <p><strong>N&deg; fabricant : ${lotResult.numeroLotFabricant || '-'}</strong></p>
                    <p>Exp. ${lotResult.dateExpiration}</p>
                    <p style="font-size:10px">Systeme de tracabilite SEN-PNA</p>
                    </div></body></html>`);
                  f.document.close();
                  f.focus();
                  setTimeout(() => { f.print(); f.close(); }, 300);
                }}
                style={{ marginTop: 14, padding: '8px 18px', background: '#1a5fb4', color: '#fff',
                         border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>
                🖨️ Imprimer l&apos;étiquette
              </button>
            </div>
          </div>
        )}

        {/* Historique blockchain immuable */}
        {historique && (
          <div style={{ marginTop: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
              📋 Historique blockchain immuable
            </h3>
            {historique.map((tx, i) => {
              let lotData = {};
              try { lotData = JSON.parse(tx.valeur || '{}'); } catch(e) {}

              // Convertir timestamp seconds en date lisible
              let dateAffichee = tx.timestamp;
              const secMatch = String(tx.timestamp || '').match(/seconds:(\d+)/);
              if (secMatch && secMatch[1]) {
                const d = new Date(parseInt(secMatch[1]) * 1000); dateAffichee = d.toLocaleDateString('fr-FR') + ' ' + d.toLocaleTimeString('fr-FR');
              }

              return (
                <div key={i} style={{ padding: 14, background: i === 0 ? '#EAF3DE' : '#f9fafb', borderRadius: 8, marginBottom: 8, border: i === 0 ? '1px solid #B2D48C' : '1px solid #e8ecf0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                    <span style={{ fontFamily: 'monospace', color: '#185FA5', fontSize: 11 }}>
                      🔗 {tx.txId?.slice(0, 20)}...
                    </span>
                    <span style={{ color: '#666', fontSize: 11 }}>📅 {dateAffichee}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                    <div style={{ fontSize: 11 }}>
                      <span style={{ color: '#888' }}>Statut : </span>
                      <span style={{ fontWeight: 600, color: '#333' }}>{lotData.statut || '—'}</span>
                    </div>
                    <div style={{ fontSize: 11 }}>
                      <span style={{ color: '#888' }}>Propriétaire : </span>
                      <span style={{ fontWeight: 600, color: '#333' }}>{lotData.proprietaireActuel || '—'}</span>
                    </div>
                    <div style={{ fontSize: 11 }}>
                      <span style={{ color: '#888' }}>Quantité : </span>
                      <span style={{ fontWeight: 600, color: '#333' }}>{lotData.quantite ?? '—'}</span>
                    </div>
                  </div>
                  {i === 0 && <div style={{ fontSize: 10, color: '#3B6D11', marginTop: 6 }}>✅ État actuel</div>}
                </div>
              );
            })}

            {/* Transferts lies a ce lot (contrat gestionTransferts) */}
            {transfertsLies.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: '#333' }}>
                  🔁 Transferts liés à ce lot
                </h4>
                {transfertsLies.map(t => {
                  const confirme = /confirm/i.test(t.statut || '');
                  const rejete = /rejet/i.test(t.statut || '');
                  const couleur = confirme ? { bg: '#EAF3DE', bd: '#B2D48C', fg: '#27500A' }
                    : rejete ? { bg: '#FCEBEB', bd: '#F0B4B4', fg: '#A32D2D' }
                    : { bg: '#FFF6E5', bd: '#F2D59B', fg: '#8A5A00' };
                  const motif = t.motif || t.motifRejet;
                  return (
                    <div key={t.idTransfert} style={{ padding: 12, background: couleur.bg, borderRadius: 8, marginBottom: 8, border: `1px solid ${couleur.bd}`, fontSize: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, color: '#333' }}>
                          {t.sens === 'envoi' ? '📤 Envoi' : '📥 Réception'} · {t.idTransfert}
                        </span>
                        <span style={{ fontWeight: 600, color: couleur.fg }}>{t.statut || '—'}</span>
                      </div>
                      <div style={{ marginTop: 6, color: '#444' }}>
                        <strong>{t.quantite}</strong> boîtes · {t.expediteur} → <strong>{t.destinataire}</strong>
                        {t.sens === 'reception' && <> · depuis le lot <span style={{ fontFamily: 'monospace' }}>{t.idLot}</span></>}
                        {t.sens === 'envoi' && confirme && <> · lot dérivé <span style={{ fontFamily: 'monospace' }}>{t.idLot}-{t.idTransfert}</span></>}
                      </div>
                      {rejete && motif && <div style={{ marginTop: 4, color: '#A32D2D' }}>Motif : {motif}</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Liste des vrais lots depuis la blockchain */}
      <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e8ecf0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>
            Lots enregistrés dans la blockchain ({lots.length})
          </h2>
          <button onClick={chargerLots}
            style={{ padding: '6px 14px', background: '#f0f4f8', border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
            🔄 Actualiser
          </button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f5f7fa' }}>
              {['ID Lot', 'Médicament', 'Quantité', 'Propriétaire', 'Expiration', 'Statut', 'Action'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 500, color: '#666', borderBottom: '1px solid #e8ecf0' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lots.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 20, color: '#999' }}>
                  Chargement des lots...
                </td>
              </tr>
            ) : (
              lots.map(lot => (
                <tr key={lot.idLot} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#185FA5' }}>
                    {lot.idLot}
                  </td>
                  <td style={{ padding: '10px 12px' }}>{lot.nomMedicament}</td>
                  <td style={{ padding: '10px 12px' }}>{lot.quantite}</td>
                  <td style={{ padding: '10px 12px' }}>{lot.proprietaireActuel}</td>
                  <td style={{ padding: '10px 12px' }}>{lot.dateExpiration}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ ...getStatutStyle(lot.statut), padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500 }}>
                      {lot.statut}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <button onClick={() => setIdLotRecherche(lot.idLot)}
                      style={{ padding: '5px 12px', background: '#E6F1FB', color: '#185FA5', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                      Voir
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </Layout>
  );
};

export default Lots;
