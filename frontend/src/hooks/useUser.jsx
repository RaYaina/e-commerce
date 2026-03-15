// src/hooks/useUser.js
import { useState, useEffect } from 'react';

export const useUser = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Récupérer l'utilisateur depuis le sessionStorage ou localStorage
    const userFromSession = sessionStorage.getItem('user');
    const userFromLocal = localStorage.getItem('user');
    
    const userData = userFromSession ? JSON.parse(userFromSession) : 
                     userFromLocal ? JSON.parse(userFromLocal) : null;
    
    setUser(userData);
    setLoading(false);
  }, []);

  return { user, loading };
};