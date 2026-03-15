// src/services/categorieService.js
import api from './api';

export const categorieService = {
  // Récupérer toutes les catégories
  getAll: async () => {
    try {
      const response = await api.get('/categories');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories:', error);
      throw error;
    }
  },

  // Récupérer une catégorie par ID
  getById: async (id) => {
    try {
      const response = await api.get(`/categories/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération de la catégorie ${id}:`, error);
      throw error;
    }
  },

  // Créer une catégorie
  create: async (categorieData) => {
    try {
      const response = await api.post('/categories', categorieData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de la catégorie:', error);
      throw error;
    }
  },

  // Mettre à jour une catégorie
  update: async (id, categorieData) => {
    try {
      const response = await api.put(`/categories/${id}`, categorieData);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de la catégorie ${id}:`, error);
      throw error;
    }
  },

  // Supprimer une catégorie
  delete: async (id) => {
    try {
      const response = await api.delete(`/categories/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression de la catégorie ${id}:`, error);
      throw error;
    }
  }
};