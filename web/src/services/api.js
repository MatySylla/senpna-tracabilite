import axios from 'axios';

const API_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
});

// Ajouter le token JWT automatiquement
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Gestion des erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (email, motDePasse) =>
  api.post('/api/auth/login', { email, motDePasse });

// Lots
export const createLot = (data) => api.post('/api/lots/create', data);
export const getLot = (idLot) => api.get(`/api/lots/${idLot}`);
export const getHistorique = (idLot) => api.get(`/api/lots/${idLot}/historique`);
export const updateStatut = (idLot, statut) => api.put(`/api/lots/${idLot}/statut`, { statut });
export const verifierAuthenticite = (idLot) => api.get(`/api/verify/${idLot}`);
// Récupérer tous les lots depuis la blockchain
export const getAllLots = () => api.get('/api/lots');
// Récupérer tous les transferts depuis la blockchain
export const getAllTransferts = () => api.get('/api/transferts');
// Récupérer toutes les alertes depuis la blockchain
export const getAllAlertes = () => api.get('/api/alertes');

// Transferts
export const initierTransfert = (data) => api.post('/api/transferts/initier', data);
export const getTransfert = (idTransfert) => api.get(`/api/transferts/${idTransfert}`);
export const confirmerReception = (idTransfert) => api.put(`/api/transferts/${idTransfert}/confirmer`);
export const rejeterTransfert = (idTransfert, motif) => api.put(`/api/transferts/${idTransfert}/rejeter`, { motif });

// Alertes
export const creerAlerte = (data) => api.post('/api/alertes/creer', data);
export const getAlerte = (idAlerte) => api.get(`/api/alertes/${idAlerte}`);
export const declencherRappel = (data) => api.post('/api/alertes/rappel', data);

export default api;