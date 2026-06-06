import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout/Layout';
import { initierTransfert, getTransfert, confirmerReception, rejeterTransfert, getAllTransferts } from '../../services/api';

const Transferts = () => {
  const { user } = useAuth();

  // États du composant
  const [transferts, setTransferts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [idRecherche, setIdRecherche] = useState('');
  const [transfertResult, setTransfertResult] = useState(null);
  const [motifRejet, setMotifRejet] = useState('');
  const [showRejet, setShowRejet] = useState(false);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');
  const [loading, setLoading] = useState(false);

  // Données du formulaire d'initiation
  const [formData, setFormData] = useState({
    idTransfert: '', idLot: '',
    expediteur: user?.organisation || 'SEN-PNA',
    destinataire: '', quantite: '', bonLivraison: ''
  });

  // Charger les transferts au démarrage
  useEffect(() => {
    chargerTransferts();
  }, []);

  // Récupérer tous les transferts depuis la blockchain
  const chargerTransferts = async () => {
    try {
      const res = await getAllTransferts();
      if (res.data && Array.isArray(res.data)) {
        setTransferts(res.data);
      }
    } catch (err) {
      console.error('Erreur chargement transferts :', err);
    }
  };

  // Initier un nouveau transfert
  const handleInitier = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErreur('');
    try {
      await initierTransfert({
        ...formData,
        quantite: parseInt(formData.quantite)
      });
      setSucces(`✅ Transfert ${formData.idTransfert} initié avec succès !`);
      setShowForm(false);
      setFormData({ idTransfert: '', idLot: '', expediteur: user?.organisation || 'SEN-PNA', destinataire: '', quantite: '', bonLivraison: '' });
      // Recharger la liste après initiation
      await chargerTransferts();
    } catch (err) {
      setErreur(err.response?.data?.erreur || 'Erreur lors de l\'initiation');
    } finally {
      setLoading(false);
    }
  };

  // Rechercher un transfert spécifique
  const handleRecherche = async () => {
    if (!idRecherche) return;
    setLoading(true);
    setErreur('');
    setTransfertResult(null);
    try {
      const res = await getTransfert(idRecherche);
      setTransfertResult(res.data);
    } catch (err) {
      setErreur('Transfert introuvable');
    } finally {
      setLoading(false);
    }
  };

  // Confirmer la réception d'un transfert
  const handleConfirmer = async () => {
    setLoading(true);
    try {
      await confirmerReception(idRecherche);
      setSucces(`✅ Réception du transfert ${idRecherche} confirmée !`);
      setTransfertResult(null);
      // Recharger la liste après confirmation
      await chargerTransferts();
    } catch (err) {
      setErreur(err.response?.data?.erreur || 'Erreur lors de la confirmation');
    } finally {
      setLoading(false);
    }
  };

  // Rejeter un transfert avec motif
  const handleRejeter = async () => {
    if (!motifRejet) return;
    setLoading(true);
    try {
      await rejeterTransfert(idRecherche, motifRejet);
      setSucces(`✅ Transfert ${idRecherche} rejeté !`);
      setShowRejet(false);
      setTransfertResult(null);
      // Recharger la liste après rejet
      await chargerTransferts();
    } catch (err) {
      setErreur(err.response?.data?.erreur || 'Erreur lors du rejet');
    } finally {
      setLoading(false);
    }
  };

  // Couleur du badge selon le statut
  const getStatutStyle = (statut) => {
    if (statut === 'Confirmé') return { background: '#EAF3DE', color: '#27500A' };
    if (statut === 'En attente') return { background: '#FAEEDA', color: '#633806' };
    return { background: '#FCEBEB', color: '#791F1F' };
  };

  // Vérifier si l'utilisateur peut initier un transfert
  const peutInitier = ['ADMIN_SENPNA', 'PHARMACIEN_PRA', 'AGENT_DISTRICT'].includes(user?.role);

  // Vérifier si l'utilisateur peut confirmer ou rejeter
  const peutConfirmer = ['PHARMACIEN_PRA', 'AGENT_DISTRICT', 'AGENT_STRUCTURE'].includes(user?.role);

  return (
    <Layout pageCourante="/transferts">

      {/* En-tête de la page */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: '#1a1a1a', marginBottom: 4 }}>
            Gestion des transferts
          </h1>
          <p style={{ fontSize: 14, color: '#666' }}>
            Initier, confirmer ou rejeter les transferts de lots
          </p>
        </div>

        {/* Bouton initier — selon le rôle */}
        {peutInitier && (
          <button onClick={() => setShowForm(!showForm)}
            style={{ padding: '10px 20px', background: '#185FA5', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
            + Initier un transfert
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

      {/* Formulaire d'initiation */}
      {showForm && peutInitier && (
        <div style={{ background: 'white', borderRadius: 12, padding: 24, marginBottom: 24, border: '1px solid #e8ecf0' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Nouveau transfert</h2>
          <form onSubmit={handleInitier}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { label: 'ID Transfert *', key: 'idTransfert', placeholder: 'Ex: TR-006' },
                { label: 'ID Lot *', key: 'idLot', placeholder: 'Ex: ML-043' },
                { label: 'Expéditeur', key: 'expediteur', placeholder: 'Ex: SEN-PNA' },
                { label: 'Destinataire *', key: 'destinataire', placeholder: 'Ex: PRA-DKR' },
                { label: 'Quantité *', key: 'quantite', placeholder: 'Ex: 200' },
                { label: 'Bon de livraison', key: 'bonLivraison', placeholder: 'Ex: BL-2026-006' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#444', marginBottom: 5 }}>
                    {f.label}
                  </label>
                  <input
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
                {loading ? 'Envoi...' : '🔄 Initier le transfert'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Recherche d'un transfert */}
      <div style={{ background: 'white', borderRadius: 12, padding: 24, marginBottom: 24, border: '1px solid #e8ecf0' }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Rechercher un transfert</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <input
            value={idRecherche}
            onChange={e => setIdRecherche(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleRecherche()}
            placeholder="Entrez l'ID du transfert (Ex: TR-001)"
            style={{ flex: 1, padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14 }}
          />
          <button onClick={handleRecherche} disabled={loading}
            style={{ padding: '10px 20px', background: '#185FA5', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500 }}>
            🔍 Rechercher
          </button>
        </div>

        {/* Résultat du transfert trouvé */}
        {transfertResult && (
          <div style={{ marginTop: 20, padding: 16, background: '#f9fafb', borderRadius: 10, border: '1px solid #e8ecf0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600 }}>
                Transfert {transfertResult.idTransfert}
              </h3>
              <span style={{ ...getStatutStyle(transfertResult.statut), padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>
                {transfertResult.statut}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              {[
                ['Lot concerné', transfertResult.idLot],
                ['Expéditeur', transfertResult.expediteur],
                ['Destinataire', transfertResult.destinataire],
                ['Quantité', `${transfertResult.quantite} boîtes`],
                ['Bon livraison', transfertResult.bonLivraison],
                ['Date', new Date(transfertResult.horodatage).toLocaleString('fr-FR')],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #eee', fontSize: 13 }}>
                  <span style={{ color: '#666' }}>{k}</span>
                  <span style={{ fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Boutons confirmer/rejeter selon rôle et statut */}
            {transfertResult.statut === 'En attente' && peutConfirmer && (
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleConfirmer} disabled={loading}
                  style={{ padding: '10px 20px', background: '#3B6D11', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500 }}>
                  ✅ Confirmer la réception
                </button>
                <button onClick={() => setShowRejet(!showRejet)}
                  style={{ padding: '10px 20px', background: '#FCEBEB', color: '#A32D2D', border: '1px solid #F7C1C1', borderRadius: 8, cursor: 'pointer', fontWeight: 500 }}>
                  ❌ Rejeter
                </button>
              </div>
            )}

            {/* Formulaire de rejet */}
            {showRejet && (
              <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
                <input
                  value={motifRejet}
                  onChange={e => setMotifRejet(e.target.value)}
                  placeholder="Motif du rejet (Ex: Lot endommagé)"
                  style={{ flex: 1, padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 13 }}
                />
                <button onClick={handleRejeter} disabled={loading}
                  style={{ padding: '8px 16px', background: '#A32D2D', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                  Confirmer le rejet
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Liste des vrais transferts depuis la blockchain */}
      <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e8ecf0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>
            Transferts enregistrés dans la blockchain ({transferts.length})
          </h2>
          <button onClick={chargerTransferts}
            style={{ padding: '6px 14px', background: '#f0f4f8', border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
            🔄 Actualiser
          </button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f5f7fa' }}>
              {['ID', 'Lot', 'Expéditeur', 'Destinataire', 'Quantité', 'Date', 'Statut'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 500, color: '#666', borderBottom: '1px solid #e8ecf0' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {transferts.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 20, color: '#999' }}>
                  Chargement des transferts...
                </td>
              </tr>
            ) : (
              transferts.map(t => (
                <tr key={t.idTransfert} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#185FA5' }}>
                    {t.idTransfert}
                  </td>
                  <td style={{ padding: '10px 12px' }}>{t.idLot}</td>
                  <td style={{ padding: '10px 12px' }}>{t.expediteur}</td>
                  <td style={{ padding: '10px 12px' }}>{t.destinataire}</td>
                  <td style={{ padding: '10px 12px' }}>{t.quantite}</td>
                  <td style={{ padding: '10px 12px' }}>
                    {new Date(t.horodatage).toLocaleDateString('fr-FR')}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ ...getStatutStyle(t.statut), padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500 }}>
                      {t.statut}
                    </span>
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

export default Transferts;