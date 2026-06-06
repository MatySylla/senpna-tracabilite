import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout/Layout';
import { getLot, createLot, getHistorique, getAllLots } from '../../services/api';

const Lots = () => {
  const { user } = useAuth();

  // États du composant
  const [lots, setLots] = useState([]);
  const [idLotRecherche, setIdLotRecherche] = useState('');
  const [lotResult, setLotResult] = useState(null);
  const [historique, setHistorique] = useState(null);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Données du formulaire de création
  const [formData, setFormData] = useState({
    idLot: '', nomMedicament: '', codeGTIN: '',
    fabricant: '', dateFabrication: '', dateExpiration: '',
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
        fabricant: '', dateFabrication: '', dateExpiration: '',
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
                ['Quantité', `${lotResult.quantite} boîtes`],
                ['Propriétaire actuel', lotResult.proprietaireActuel],
                ['Date fabrication', lotResult.dateFabrication],
                ['Date expiration', lotResult.dateExpiration],
                ['Température', `${lotResult.temperature}°C`],
                ['Créé le', new Date(lotResult.dateCreation).toLocaleString('fr-FR')],
                ['Mis à jour', new Date(lotResult.dateMiseAJour).toLocaleString('fr-FR')],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #eee', fontSize: 13 }}>
                  <span style={{ color: '#666' }}>{k}</span>
                  <span style={{ fontWeight: 500, color: '#333' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Historique blockchain immuable */}
        {historique && (
          <div style={{ marginTop: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
              📋 Historique blockchain immuable
            </h3>
            {historique.map((tx, i) => (
              <div key={i} style={{ padding: 12, background: '#f9fafb', borderRadius: 8, marginBottom: 8, border: '1px solid #e8ecf0', fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontFamily: 'monospace', color: '#185FA5' }}>
                    {tx.txId?.slice(0, 24)}...
                  </span>
                  <span style={{ color: '#666' }}>{tx.timestamp}</span>
                </div>
                <div style={{ color: '#333', fontSize: 11 }}>
                  Statut : {JSON.parse(tx.valeur || '{}')?.statut || 'Transaction'}
                </div>
              </div>
            ))}
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