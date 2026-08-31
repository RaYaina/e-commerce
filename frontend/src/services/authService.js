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
  
  async updateProfileImage(imageBase64) {
    const response = await api.put('/users/profile-image', {
      imageBase64: imageBase64
    });
    return response.data;
  },
  
  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('rememberMe');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
  },
  
  getCurrentUser() {
    const userFromSession = sessionStorage.getItem('user');
    if (userFromSession) return JSON.parse(userFromSession);
    
    const userFromLocal = localStorage.getItem('user');
    if (userFromLocal) return JSON.parse(userFromLocal);
    
    return null;
  },
  
  getToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  },
  
  isAuthenticated() {
    return !!this.getToken() && !!this.getCurrentUser();
  }
};

export default authService;