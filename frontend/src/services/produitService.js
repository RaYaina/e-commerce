// src/services/produitService.js
import api from './api';

export const produitService = {
  // Récupérer tous les produits
  getAll: async () => {
    try {
      const response = await api.get('/produits');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des produits:', error);
      throw error;
    }
  },

  // Récupérer un produit par ID
  getById: async (id) => {
    try {
      const response = await api.get(`/produits/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du produit ${id}:`, error);
      throw error;
    }
  },

  // Créer un nouveau produit
  create: async (produitData) => {
    try {
      const response = await api.post('/produits', produitData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du produit:', error);
      throw error;
    }
  },

  // Mettre à jour un produit
  update: async (id, produitData) => {
    try {
      const response = await api.put(`/produits/${id}`, produitData);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du produit ${id}:`, error);
      throw error;
    }
  },

  // Supprimer un produit
  delete: async (id) => {
    try {
      const response = await api.delete(`/produits/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression du produit ${id}:`, error);
      throw error;
    }
  },

  // Rechercher des produits
  search: async (query) => {
    try {
      const response = await api.get(`/produits/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      throw error;
    }
  },

  // Produits par catégorie
  getByCategorie: async (categorieId) => {
    try {
      const response = await api.get(`/produits/categorie/${categorieId}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des produits de la catégorie ${categorieId}:`, error);
      throw error;
    }
  },

  // Produits en stock
  getEnStock: async () => {
    try {
      const response = await api.get('/produits/stock');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des produits en stock:', error);
      throw error;
    }
  }
};