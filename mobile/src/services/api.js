import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({ baseURL: 'http://10.0.2.2:3000', timeout: 10000 });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = 'Bearer ' + token;
  return config;
});

export const login = (email, motDePasse) => api.post('/api/auth/login', { email, motDePasse });
export const getAllLots = () => api.get('/api/lots');
export const getAllTransferts = () => api.get('/api/transferts');
export const getAllAlertes = () => api.get('/api/alertes');
export const verifierAuthenticite = (idLot) => api.get('/api/verify/' + idLot);
export const confirmerReception = (id) => api.put('/api/transferts/' + id + '/confirmer');
export const rejeterTransfert = (id, motif) => api.put('/api/transferts/' + id + '/rejeter', { motif });

export default api;
