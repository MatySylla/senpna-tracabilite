import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Lots from './pages/Lots/Lots';
import Transferts from './pages/Transferts/Transferts';
import Alertes from './pages/Alertes/Alertes';
import Verification from './pages/Verification/Verification';
import Utilisateurs from './pages/Utilisateurs/Utilisateurs';

// Composant de protection des routes — vérifie si l'utilisateur est connecté
// eslint-disable-next-line react/prop-types
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Chargement...</div>;
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/verify" element={<Verification />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/lots" element={<PrivateRoute><Lots /></PrivateRoute>} />
          <Route path="/transferts" element={<PrivateRoute><Transferts /></PrivateRoute>} />
          <Route path="/alertes" element={<PrivateRoute><Alertes /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/login" />} />
          <Route path="/utilisateurs" element={<PrivateRoute><Utilisateurs /></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;