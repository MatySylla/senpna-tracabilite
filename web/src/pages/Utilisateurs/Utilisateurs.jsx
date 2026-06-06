import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout/Layout';
import api from '../../services/api';

const Utilisateurs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Rediriger si pas admin
  if (user?.role !== 'ADMIN_SENPNA') {
    navigate('/dashboard');
    return null;
  }

  // États du composant
  const [showForm, setShowForm] = useState(false);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');
  const [loading, setLoading] = useState(false);

  // Données du formulaire de création
  const [formData, setFormData] = useState({
    nom: '', prenom: '', email: '',
    motDePasse: '', role: 'PHARMACIEN_PRA',
    idOrganisation: '3'
  });

  // Créer un nouvel utilisateur
  const handleCreer = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErreur('');
    try {
      await api.post('/api/auth/register', formData);
      setSucces(`✅ Utilisateur ${formData.prenom} ${formData.nom} créé avec succès !`);
      setShowForm(false);
      setFormData({ nom: '', prenom: '', email: '', motDePasse: '', role: 'PHARMACIEN_PRA', idOrganisation: '3' });
    } catch (err) {
      setErreur(err.response?.data?.erreur || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  // Couleur du badge selon le rôle
  const getRoleStyle = (role) => {
    if (role === 'ADMIN_SENPNA') return { background: '#E6F1FB', color: '#0C447C' };
    if (role === 'INSPECTEUR_ARP') return { background: '#FCEBEB', color: '#791F1F' };
    if (role === 'PHARMACIEN_PRA') return { background: '#EAF3DE', color: '#27500A' };
    if (role === 'AGENT_DISTRICT') return { background: '#FAEEDA', color: '#633806' };
    return { background: '#F1EFE8', color: '#444' };
  };

  // Utilisateurs existants dans le système
  const utilisateurs = [
    { id: 4, nom: 'Diallo', prenom: 'Seydou', email: 'admin@senpna.sn', role: 'ADMIN_SENPNA', org: 'SEN-PNA', actif: true },
    { id: 5, nom: 'Sylla', prenom: 'Fatou', email: 'inspecteur@arp.sn', role: 'INSPECTEUR_ARP', org: 'ARP', actif: true },
    { id: 6, nom: 'Sow', prenom: 'Ibrahima', email: 'pharmacien@pra-dakar.sn', role: 'PHARMACIEN_PRA', org: 'PRA-DKR', actif: true },
  ];

  return (
    <Layout pageCourante="/utilisateurs">

      {/* En-tête de la page */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: '#1a1a1a', marginBottom: 4 }}>Gestion des utilisateurs</h1>
          <p style={{ fontSize: 14, color: '#666' }}>Créer et gérer les comptes du système</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          style={{ padding: '10px 20px', background: '#185FA5', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
          + Créer un utilisateur
        </button>
      </div>

      {/* Messages de succès et d'erreur */}
      {succes && <div style={{ background: '#EAF3DE', color: '#27500A', padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{succes}</div>}
      {erreur && <div style={{ background: '#FCEBEB', color: '#A32D2D', padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{erreur}</div>}

      {/* Formulaire de création d'utilisateur */}
      {showForm && (
        <div style={{ background: 'white', borderRadius: 12, padding: 24, marginBottom: 24, border: '1px solid #e8ecf0' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Nouvel utilisateur</h2>
          <form onSubmit={handleCreer}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { label: 'Nom *', key: 'nom', placeholder: 'Ex: Diallo', type: 'text' },
                { label: 'Prénom *', key: 'prenom', placeholder: 'Ex: Mamadou', type: 'text' },
                { label: 'Email *', key: 'email', placeholder: 'Ex: mamadou@senpna.sn', type: 'email' },
                { label: 'Mot de passe *', key: 'motDePasse', placeholder: '••••••••', type: 'password' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#444', marginBottom: 5 }}>{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder} value={formData[f.key]}
                    onChange={e => setFormData({ ...formData, [f.key]: e.target.value })} required
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
                </div>
              ))}

              {/* Sélection du rôle */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#444', marginBottom: 5 }}>Rôle *</label>
                <select value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}>
                  <option value="ADMIN_SENPNA">Admin SEN-PNA</option>
                  <option value="INSPECTEUR_ARP">Inspecteur ARP</option>
                  <option value="PHARMACIEN_PRA">Pharmacien PRA</option>
                  <option value="AGENT_DISTRICT">Agent District</option>
                  <option value="AGENT_STRUCTURE">Agent Structure de santé</option>
                </select>
              </div>

              {/* Sélection de l'organisation */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#444', marginBottom: 5 }}>Organisation *</label>
                <select value={formData.idOrganisation}
                  onChange={e => setFormData({ ...formData, idOrganisation: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}>
                  <option value="1">SEN-PNA</option>
                  <option value="2">ARP</option>
                  <option value="3">PRA Dakar</option>
                  <option value="4">PRA Thiès</option>
                  <option value="5">PRA Diourbel</option>
                  <option value="6">District Thiès</option>
                  <option value="7">District Diourbel</option>
                  <option value="8">Structure Santé Thiès</option>
                  <option value="9">Structure Santé Diourbel</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="button" onClick={() => setShowForm(false)}
                style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer' }}>
                Annuler
              </button>
              <button type="submit" disabled={loading}
                style={{ padding: '10px 20px', background: '#185FA5', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500 }}>
                {loading ? 'Création...' : '✅ Créer le compte'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des utilisateurs */}
      <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e8ecf0' }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Utilisateurs du système</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f5f7fa' }}>
              {['ID', 'Nom complet', 'Email', 'Rôle', 'Organisation', 'Statut'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 500, color: '#666', borderBottom: '1px solid #e8ecf0' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {utilisateurs.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '10px 12px', color: '#999' }}>{u.id}</td>
                <td style={{ padding: '10px 12px', fontWeight: 500 }}>{u.prenom} {u.nom}</td>
                <td style={{ padding: '10px 12px', color: '#185FA5' }}>{u.email}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ ...getRoleStyle(u.role), padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500 }}>
                    {u.role}
                  </span>
                </td>
                <td style={{ padding: '10px 12px' }}>{u.org}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ background: '#EAF3DE', color: '#27500A', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500 }}>
                    {u.actif ? '✅ Actif' : '❌ Inactif'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </Layout>
  );
};

export default Utilisateurs;