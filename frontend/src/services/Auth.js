// Dans LoginPage.jsx
import { login } from '../services/Auth';

const onFinish = async (values) => {
  try {
    const loadingMessage = message.loading('Connexion en cours...', 0);
    
    await login(values.email, values.password, values.remember);
    
    loadingMessage();
    message.success('Connexion réussie !');
    navigate('/vente');
    
  } catch (error) {
    loadingMessage();
    
    // ✅ Affiche directement le message du backend
    if (error.response?.status === 401) {
      message.error(error.response.data?.message || 'Email ou mot de passe incorrect');
    } else {
      message.error('Erreur de connexion au serveur');
    }
    
    form.setFieldsValue({ password: '' });
  }
};