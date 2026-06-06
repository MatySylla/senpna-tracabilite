import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import { getAllLots, getAllTransferts, getAllAlertes } from '../../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Métriques depuis la blockchain
  const [stats, setStats] = useState({
    lots: 0,
    transferts: 0,
    alertes: 0,
    enAttente: 0
  });

  // Charger les statistiques au démarrage
  useEffect(() => {
    chargerStats();
  }, []);

  // Récupérer les vraies statistiques depuis la blockchain
  const chargerStats = async () => {
    try {
      const [lots, transferts, alertes] = await Promise.all([
        getAllLots(),
        getAllTransferts(),
        getAllAlertes()
      ]);

      setStats({
        lots: lots.data?.length || 0,
        transferts: transferts.data?.length || 0,
        alertes: alertes.data?.filter(a => a.estActive)?.length || 0,
        enAttente: transferts.data?.filter(t => t.statut === 'En attente')?.length || 0
      });
    } catch (err) {
      console.error('Erreur chargement stats :', err);
    }
  };

  return (
    <Layout pageCourante="/dashboard">

      {/* En-tête de la page */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: '#1a1a1a', marginBottom: 4 }}>
          Tableau de bord
        </h1>
        <p style={{ fontSize: 14, color: '#666' }}>
          Bienvenue, {user?.prenom} {user?.nom} — {user?.nomOrganisation}
        </p>
      </div>

      {/* Métriques depuis la blockchain */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { icon: '📦', label: 'Lots enregistrés', valeur: stats.lots, couleur: '#E6F1FB', sousTitre: 'Dans la blockchain' },
          { icon: '🔄', label: 'Transferts effectués', valeur: stats.transferts, couleur: '#EAF3DE', sousTitre: 'Total circuit' },
          { icon: '🔔', label: 'Alertes actives', valeur: stats.alertes, couleur: '#FCEBEB', sousTitre: 'En cours' },
          { icon: '⏰', label: 'Transferts en attente', valeur: stats.enAttente, couleur: '#FAEEDA', sousTitre: 'À confirmer' },
        ].map(m => (
          <div key={m.label} style={{
            background: 'white', borderRadius: 12, padding: 20,
            border: '1px solid #e8ecf0', display: 'flex',
            alignItems: 'center', gap: 16
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: m.couleur, display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: 24
            }}>
              {m.icon}
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#1a1a1a' }}>
                {m.valeur}
              </div>
              <div style={{ fontSize: 13, color: '#666' }}>{m.label}</div>
              <div style={{ fontSize: 11, color: '#999' }}>{m.sousTitre}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions disponibles selon le rôle */}
      <div style={{ background: 'white', borderRadius: 12, padding: 24, marginBottom: 24, border: '1px solid #e8ecf0' }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
          Actions disponibles
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>

          {/* Créer un lot — Admin SEN-PNA uniquement */}
          {user?.role === 'ADMIN_SENPNA' && (
            <button onClick={() => navigate('/lots')}
              style={{ background: '#f5f7fa', border: '1px solid #e8ecf0', borderRadius: 10, padding: 16, cursor: 'pointer', textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📦</div>
              <div style={{ fontSize: 13, color: '#555', fontWeight: 500 }}>Créer un lot</div>
            </button>
          )}

          {/* Gérer les transferts — selon le rôle */}
          <button onClick={() => navigate('/transferts')}
            style={{ background: '#f5f7fa', border: '1px solid #e8ecf0', borderRadius: 10, padding: 16, cursor: 'pointer', textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🔄</div>
            <div style={{ fontSize: 13, color: '#555', fontWeight: 500 }}>
              {['PHARMACIEN_PRA', 'AGENT_DISTRICT', 'AGENT_STRUCTURE'].includes(user?.role)
                ? 'Confirmer réception'
                : 'Gérer transferts'}
            </div>
          </button>

          {/* Rappel officiel — ARP uniquement */}
          {user?.role === 'INSPECTEUR_ARP' && (
            <button onClick={() => navigate('/alertes')}
              style={{ background: '#FCEBEB', border: '1px solid #F7C1C1', borderRadius: 10, padding: 16, cursor: 'pointer', textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🚨</div>
              <div style={{ fontSize: 13, color: '#A32D2D', fontWeight: 500 }}>
                Déclencher rappel
              </div>
            </button>
          )}

          {/* Vérification QR — tous */}
          <button onClick={() => navigate('/verify')}
            style={{ background: '#f5f7fa', border: '1px solid #e8ecf0', borderRadius: 10, padding: 16, cursor: 'pointer', textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
            <div style={{ fontSize: 13, color: '#555', fontWeight: 500 }}>
              Vérifier médicament
            </div>
          </button>

          {/* Alertes — tous */}
          <button onClick={() => navigate('/alertes')}
            style={{ background: '#f5f7fa', border: '1px solid #e8ecf0', borderRadius: 10, padding: 16, cursor: 'pointer', textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🔔</div>
            <div style={{ fontSize: 13, color: '#555', fontWeight: 500 }}>
              Voir alertes
            </div>
          </button>

          {/* Gérer utilisateurs — Admin uniquement */}
          {user?.role === 'ADMIN_SENPNA' && (
            <button onClick={() => navigate('/utilisateurs')}
              style={{ background: '#f5f7fa', border: '1px solid #e8ecf0', borderRadius: 10, padding: 16, cursor: 'pointer', textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>👥</div>
              <div style={{ fontSize: 13, color: '#555', fontWeight: 500 }}>
                Gérer utilisateurs
              </div>
            </button>
          )}

        </div>
      </div>

      {/* État du réseau blockchain */}
      <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e8ecf0' }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
          État du réseau blockchain
        </h2>
        {[
          'Hyperledger Fabric v2.5 — Actif',
          'Channel : tracabilite',
          '3 chaincodes déployés (GestionLots, GestionTransferts, GestionAlertes)',
          `Organisation connectée : ${user?.organisation}`,
          `Rôle : ${user?.role}`,
        ].map(item => (
          <div key={item} style={{
            display: 'flex', alignItems: 'center',
            gap: 10, fontSize: 14, color: '#444', marginBottom: 10
          }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: '#3B6D11', flexShrink: 0
            }}></div>
            {item}
          </div>
        ))}

        {/* Bouton actualiser les stats */}
        <button onClick={chargerStats}
          style={{ marginTop: 12, padding: '8px 16px', background: '#f0f4f8', border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer', fontSize: 12, color: '#555' }}>
          🔄 Actualiser les statistiques
        </button>
      </div>

    </Layout>
  );
};

export default Dashboard;