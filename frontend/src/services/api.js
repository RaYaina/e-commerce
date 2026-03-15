// src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000 // Timeout de 10 secondes
});

// ✅ NOUVEAU : Intercepteur pour ajouter automatiquement l'email dans les headers
api.interceptors.request.use(
  (config) => {
    // Récupérer l'utilisateur depuis le storage
    const userFromSession = sessionStorage.getItem('user');
    const userFromLocal = localStorage.getItem('user');
    
    const user = userFromSession ? JSON.parse(userFromSession) : 
                 userFromLocal ? JSON.parse(userFromLocal) : null;
    
    // Ajouter l'email dans le header si l'utilisateur existe
    if (user && user.email) {
      config.headers['X-User-Email'] = user.email;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs globalement
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('Timeout - Le serveur ne répond pas');
    } else if (!error.response) {
      console.error('Erreur réseau - Vérifiez que le backend est lancé sur le port 8080');
    }
    return Promise.reject(error);
  }
);

export default api;