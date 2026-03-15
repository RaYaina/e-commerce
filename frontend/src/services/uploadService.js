// src/services/uploadService.js
import api from './api';

export const uploadService = {
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/uploads/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      // response.data.message contient l'URL complète de l'image
      return response.data.message;
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      throw error;
    }
  }
};