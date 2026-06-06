import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout/Layout';
import { creerAlerte, getAlerte, declencherRappel, getAllAlertes } from '../../services/api';

const Alertes = () => {
  const { user } = useAuth();

  // États du composant
  const [alertes, setAlertes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showRappel, setShowRappel] = useState(false);
  const [idRecherche, setIdRecherche] = useState('');
  const [alerteResult, setAlerteResult] = useState(null);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');
  const [loading, setLoading] = useState(false);

  // Données du formulaire de création d'alerte
  const [formData, setFormData] = useState({
    idAlerte: '', idLot: '',
    typeAlerte: 'Falsification',
    niveauGravite: 'Moyen',
    message: '',
    emetteur: user?.organisation || ''
  });

  // Données du formulaire de rappel officiel
  const [rappelData, setRappelData] = useState({
    idAlerte: '', idLot: '', motif: ''
  });

  // Charger les alertes au démarrage
  useEffect(() => {
    chargerAlertes();
  }, []);

  // Récupérer toutes les alertes depuis la blockchain
  const chargerAlertes = async () => {
    try {
      const res = await getAllAlertes();
      if (res.data && Array.isArray(res.data)) {
        setAlertes(res.data);
      }
    } catch (err) {
      console.error('Erreur chargement alertes :', err);
    }
  };

  // Créer une nouvelle alerte dans la blockchain
  const handleCreerAlerte = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErreur('');
    try {
      await creerAlerte(formData);
      setSucces(`✅ Alerte ${formData.idAlerte} créée dans la blockchain !`);
      setShowForm(false);
      setFormData({ idAlerte: '', idLot: '', typeAlerte: 'Falsification', niveauGravite: 'Moyen', message: '', emetteur: user?.organisation || '' });
      // Recharger la liste après création
      await chargerAlertes();
    } catch (err) {
      setErreur(err.response?.data?.erreur || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  // Déclencher un rappel officiel — ARP uniquement
  const handleDeclencherRappel = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErreur('');
    try {
      await declencherRappel(rappelData);
      setSucces(`✅ Rappel officiel déclenché pour le lot ${rappelData.idLot} !`);
      setShowRappel(false);
      setRappelData({ idAlerte: '', idLot: '', motif: '' });
      // Recharger la liste après rappel
      await chargerAlertes();
    } catch (err) {
      setErreur(err.response?.data?.erreur || 'Erreur lors du rappel');
    } finally {
      setLoading(false);
    }
  };

  // Rechercher une alerte spécifique
  const handleRecherche = async () => {
    if (!idRecherche) return;
    setLoading(true);
    setErreur('');
    setAlerteResult(null);
    try {
      const res = await getAlerte(idRecherche);
      setAlerteResult(res.data);
    } catch (err) {
      setErreur('Alerte introuvable');
    } finally {
      setLoading(false);
    }
  };

  // Couleur du badge selon le niveau de gravité
  const getGraviteStyle = (niveau) => {
    if (niveau === 'Critique') return { background: '#FCEBEB', color: '#791F1F' };
    if (niveau === 'Moyen') return { background: '#FAEEDA', color: '#633806' };
    return { background: '#EAF3DE', color: '#27500A' };
  };

  return (
    <Layout pageCourante="/alertes">

      {/* En-tête de la page */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: '#1a1a1a', marginBottom: 4 }}>
            Gestion des alertes
          </h1>
          <p style={{ fontSize: 14, color: '#666' }}>
            Créer des alertes et déclencher des rappels officiels
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>

          {/* Bouton créer alerte — tous les acteurs */}
          <button onClick={() => setShowForm(!showForm)}
            style={{ padding: '10px 20px', background: '#BA7517', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
            🔔 Créer alerte
          </button>

          {/* Bouton rappel officiel — ARP uniquement */}
          {user?.role === 'INSPECTEUR_ARP' && (
            <button onClick={() => setShowRappel(!showRappel)}
              style={{ padding: '10px 20px', background: '#A32D2D', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
              🚨 Rappel officiel
            </button>
          )}
        </div>
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

      {/* Formulaire création d'alerte */}
      {showForm && (
        <div style={{ background: 'white', borderRadius: 12, padding: 24, marginBottom: 24, border: '1px solid #e8ecf0' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Nouvelle alerte</h2>
          <form onSubmit={handleCreerAlerte}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#444', marginBottom: 5 }}>ID Alerte *</label>
                <input placeholder="Ex: AL-003" value={formData.idAlerte}
                  onChange={e => setFormData({ ...formData, idAlerte: e.target.value })} required
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#444', marginBottom: 5 }}>ID Lot concerné *</label>
                <input placeholder="Ex: ML-043" value={formData.idLot}
                  onChange={e => setFormData({ ...formData, idLot: e.target.value })} required
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#444', marginBottom: 5 }}>Type d&apos;alerte *</label>
                <select value={formData.typeAlerte}
                  onChange={e => setFormData({ ...formData, typeAlerte: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}>
                  <option>Falsification</option>
                  <option>Expiration</option>
                  <option>Temperature</option>
                  <option>Stock faible</option>
                  <option>Autre</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#444', marginBottom: 5 }}>Niveau de gravité *</label>
                <select value={formData.niveauGravite}
                  onChange={e => setFormData({ ...formData, niveauGravite: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}>
                  <option>Faible</option>
                  <option>Moyen</option>
                  <option>Critique</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#444', marginBottom: 5 }}>Message *</label>
              <textarea placeholder="Décrivez l'anomalie détectée..."
                value={formData.message}
                onChange={e => setFormData({ ...formData, message: e.target.value })} required rows={3}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="button" onClick={() => setShowForm(false)}
                style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer' }}>
                Annuler
              </button>
              <button type="submit" disabled={loading}
                style={{ padding: '10px 20px', background: '#BA7517', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500 }}>
                {loading ? 'Envoi...' : '🔔 Créer l\'alerte'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Formulaire rappel officiel — ARP uniquement */}
      {showRappel && user?.role === 'INSPECTEUR_ARP' && (
        <div style={{ background: '#FCEBEB', borderRadius: 12, padding: 24, marginBottom: 24, border: '1px solid #F7C1C1' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: '#791F1F' }}>
            🚨 Rappel officiel ARP
          </h2>
          <p style={{ fontSize: 13, color: '#A32D2D', marginBottom: 16 }}>
            ⚠️ Cette action est irréversible — elle sera enregistrée définitivement dans la blockchain.
          </p>
          <form onSubmit={handleDeclencherRappel}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#791F1F', marginBottom: 5 }}>ID Alerte *</label>
                <input placeholder="Ex: AL-RAPPEL-001" value={rappelData.idAlerte}
                  onChange={e => setRappelData({ ...rappelData, idAlerte: e.target.value })} required
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #F7C1C1', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#791F1F', marginBottom: 5 }}>ID Lot à rappeler *</label>
                <input placeholder="Ex: ML-042" value={rappelData.idLot}
                  onChange={e => setRappelData({ ...rappelData, idLot: e.target.value })} required
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #F7C1C1', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#791F1F', marginBottom: 5 }}>Motif du rappel *</label>
              <textarea placeholder="Motif officiel du rappel..."
                value={rappelData.motif}
                onChange={e => setRappelData({ ...rappelData, motif: e.target.value })} required rows={3}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #F7C1C1', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="button" onClick={() => setShowRappel(false)}
                style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer' }}>
                Annuler
              </button>
              <button type="submit" disabled={loading}
                style={{ padding: '10px 20px', background: '#A32D2D', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500 }}>
                {loading ? 'Envoi...' : '🚨 Déclencher le rappel officiel'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Recherche d'une alerte */}
      <div style={{ background: 'white', borderRadius: 12, padding: 24, marginBottom: 24, border: '1px solid #e8ecf0' }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Rechercher une alerte</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <input value={idRecherche}
            onChange={e => setIdRecherche(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleRecherche()}
            placeholder="Entrez l'ID de l'alerte (Ex: AL-001)"
            style={{ flex: 1, padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14 }} />
          <button onClick={handleRecherche} disabled={loading}
            style={{ padding: '10px 20px', background: '#185FA5', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500 }}>
            🔍 Rechercher
          </button>
        </div>

        {/* Résultat de la recherche */}
        {alerteResult && (
          <div style={{ marginTop: 20, padding: 16, background: '#f9fafb', borderRadius: 10, border: '1px solid #e8ecf0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600 }}>Alerte {alerteResult.idAlerte}</h3>
              <span style={{ ...getGraviteStyle(alerteResult.niveauGravite), padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>
                {alerteResult.niveauGravite}
              </span>
            </div>
            {[
              ['Lot concerné', alerteResult.idLot],
              ['Type', alerteResult.typeAlerte],
              ['Message', alerteResult.message],
              ['Émetteur', alerteResult.emetteur],
              ['Horodatage', new Date(alerteResult.horodatage).toLocaleString('fr-FR')],
              ['Active', alerteResult.estActive ? '✅ Oui' : '❌ Non'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #eee', fontSize: 13 }}>
                <span style={{ color: '#666' }}>{k}</span>
                <span style={{ fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Liste des vraies alertes depuis la blockchain */}
      <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e8ecf0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>
            Alertes enregistrées dans la blockchain ({alertes.length})
          </h2>
          <button onClick={chargerAlertes}
            style={{ padding: '6px 14px', background: '#f0f4f8', border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
            🔄 Actualiser
          </button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f5f7fa' }}>
              {['ID', 'Lot', 'Type', 'Gravité', 'Émetteur', 'Date', 'Active'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 500, color: '#666', borderBottom: '1px solid #e8ecf0' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {alertes.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 20, color: '#999' }}>
                  Chargement des alertes...
                </td>
              </tr>
            ) : (
              alertes.map(a => (
                <tr key={a.idAlerte} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#185FA5' }}>
                    {a.idAlerte}
                  </td>
                  <td style={{ padding: '10px 12px' }}>{a.idLot}</td>
                  <td style={{ padding: '10px 12px' }}>{a.typeAlerte}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ ...getGraviteStyle(a.niveauGravite), padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500 }}>
                      {a.niveauGravite}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>{a.emetteur}</td>
                  <td style={{ padding: '10px 12px' }}>
                    {new Date(a.horodatage).toLocaleDateString('fr-FR')}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    {a.estActive ? '✅' : '❌'}
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

export default Alertes;