import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Composant Layout principal — contient la sidebar et le contenu
// eslint-disable-next-line react/prop-types
const Layout = ({ children, pageCourante }) => {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  // Déconnexion de l'utilisateur
  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  // Couleur principale selon le rôle
  const getCouleurRole = () => {
    switch (user?.role) {
      case 'ADMIN_SENPNA': return '#185FA5';
      case 'INSPECTEUR_ARP': return '#A32D2D';
      case 'PHARMACIEN_PRA': return '#0F6E56';
      case 'AGENT_DISTRICT': return '#3B6D11';
      case 'AGENT_STRUCTURE': return '#BA7517';
      default: return '#185FA5';
    }
  };

  const couleur = getCouleurRole();

  // Élément du menu sidebar
  const navItem = (icon, label, path) => {
    const actif = pageCourante === path;
    return (
      <div onClick={() => navigate(path)}
        style={{
          padding: '10px 20px', cursor: 'pointer', fontSize: 14,
          color: actif ? couleur : '#555',
          fontWeight: actif ? 500 : 400,
          background: actif ? `${couleur}15` : 'transparent',
          borderRight: actif ? `3px solid ${couleur}` : 'none',
          transition: 'all 0.2s'
        }}>
        {icon} {label}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f7fa' }}>

      {/* SIDEBAR */}
      <aside style={{
        width: 220, background: 'white',
        borderRight: '1px solid #e8ecf0',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', height: '100vh'
      }}>
        {/* Logo */}
        <div style={{
          padding: 20, fontSize: 18, fontWeight: 700,
          color: couleur, borderBottom: '1px solid #e8ecf0',
          display: 'flex', alignItems: 'center', gap: 10
        }}>
          💊 SEN-PNA
        </div>

        {/* Navigation commune à tous */}
        <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#999', padding: '8px 20px 4px', textTransform: 'uppercase' }}>
            Menu principal
          </div>

          {navItem('📊', 'Tableau de bord', '/dashboard')}
          {navItem('📦', 'Lots', '/lots')}
          {navItem('🔄', 'Transferts', '/transferts')}
          {navItem('🔔', 'Alertes', '/alertes')}

          {/* Vérification QR — accessible à tous */}
          {navItem('🔍', 'Vérifier QR', '/verify')}

          {/* Menu Admin SEN-PNA uniquement */}
          {user?.role === 'ADMIN_SENPNA' && (
            <>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#999', padding: '12px 20px 4px', textTransform: 'uppercase' }}>
                Administration
              </div>
              {navItem('👥', 'Utilisateurs', '/utilisateurs')}
            </>
          )}

          {/* Menu ARP uniquement */}
          {user?.role === 'INSPECTEUR_ARP' && (
            <>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#999', padding: '12px 20px 4px', textTransform: 'uppercase' }}>
                Inspection ARP
              </div>
              {navItem('📋', 'Audit des lots', '/lots')}
              {navItem('🚨', 'Rappels officiels', '/alertes')}
            </>
          )}
        </nav>

        {/* Informations utilisateur connecté */}
        <div style={{ padding: 16, borderTop: '1px solid #e8ecf0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            {/* Avatar avec initiales */}
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: couleur, color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 600, flexShrink: 0
            }}>
              {user?.nom?.[0]}{user?.prenom?.[0]}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#333' }}>
                {user?.prenom} {user?.nom}
              </div>
              <div style={{ fontSize: 11, color: '#999' }}>{user?.organisation}</div>
            </div>
          </div>

          {/* Badge du rôle */}
          <div style={{
            background: `${couleur}15`, color: couleur,
            padding: '4px 10px', borderRadius: 20,
            fontSize: 11, fontWeight: 500,
            textAlign: 'center', marginBottom: 10
          }}>
            {user?.role}
          </div>

          {/* Bouton déconnexion */}
          <button onClick={handleLogout} style={{
            width: '100%', padding: 8,
            background: '#FCEBEB', color: '#A32D2D',
            border: '1px solid #F7C1C1', borderRadius: 8,
            cursor: 'pointer', fontSize: 13
          }}>
            🚪 Déconnexion
          </button>
        </div>
      </aside>

      {/* CONTENU PRINCIPAL */}
      <main style={{ marginLeft: 220, flex: 1, padding: 24 }}>
        {children}
      </main>
    </div>
  );
};

export default Layout;