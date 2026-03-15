// src/services/authService.js
import api from './api';

export const authService = {
  async login(credentials) {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  
  async register(userData) {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  
  async updateProfile(profileData) {
    const response = await api.put('/users/profile', profileData);
    return response.data;
  },
  
  async updatePassword(passwordData) {
    const response = await api.put('/users/update-password', passwordData);
    return response.data;
  },
  
  // ✅ NOUVELLE MÉTHODE : Upload image de profil (Base64)
  async updateProfileImage(imageBase64) {
    const response = await api.put('/users/profile-image', {
      imageBase64: imageBase64
    });
    return response.data;
  },
  
  logout() {
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    localStorage.removeItem('rememberMe');
  },
  
  getCurrentUser() {
    const userFromSession = sessionStorage.getItem('user');
    if (userFromSession) return JSON.parse(userFromSession);
    
    const userFromLocal = localStorage.getItem('user');
    if (userFromLocal) return JSON.parse(userFromLocal);
    
    return null;
  },
  
  isAuthenticated() {
    return !!this.getCurrentUser();
  }
};

export default authService;