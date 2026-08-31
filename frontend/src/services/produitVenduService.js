// src/services/produitVenduService.js
import api from './api';

export const produitVenduService = {
  // Récupérer tous les produits vendus
  getAll: async () => {
    try {
      const response = await api.get('/produits-vendus');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des produits vendus:', error);
      throw error;
    }
  },

  // Récupérer par ID
  getById: async (id) => {
    try {
      const response = await api.get(`/produits-vendus/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du produit vendu ${id}:`, error);
      throw error;
    }
  },

  // Créer un nouveau produit vendu
  create: async (produitData) => {
    try {
      const response = await api.post('/produits-vendus', produitData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du produit vendu:', error);
      throw error;
    }
  },

  // Créer plusieurs produits vendus
  createMultiple: async (produitsData) => {
    try {
      const response = await api.post('/produits-vendus/multiple', produitsData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création multiple:', error);
      throw error;
    }
  },

  // Mettre à jour
  update: async (id, produitData) => {
    try {
      const response = await api.put(`/produits-vendus/${id}`, produitData);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du produit vendu ${id}:`, error);
      throw error;
    }
  },

  // Supprimer
  delete: async (id) => {
    try {
      const response = await api.delete(`/produits-vendus/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression du produit vendu ${id}:`, error);
      throw error;
    }
  },

  // Rechercher
  search: async (query) => {
    try {
      const response = await api.get(`/produits-vendus/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      throw error;
    }
  },

  // Récupérer par utilisateur
  getByUser: async (userId) => {
    try {
      const response = await api.get(`/produits-vendus/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération par utilisateur:', error);
      throw error;
    }
  },

  // Récupérer les statistiques
  getStatistiques: async () => {
    try {
      const response = await api.get('/produits-vendus/statistiques');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }
};