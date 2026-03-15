import { Card, Flex, Form, Input, Button, Typography, Checkbox, Divider, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const { Title, Text, Link } = Typography;

export default function LoginPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  
  const onFinish = async (values) => {
    let loadingMessage = null;
    
    try {
      console.log('Tentative de connexion:', values.email);
      
      // Afficher un message de chargement
      loadingMessage = message.loading('Connexion en cours...', 0);
      
      // Appel API vers votre backend Spring Boot
      const response = await api.post('/auth/login', {
        email: values.email,
        password: values.password
      });
      
      // Fermer le message de chargement
      if (loadingMessage) loadingMessage();
      
      console.log('Réponse du serveur:', response.data);
      
      // Stocker les informations utilisateur selon "Se souvenir de moi"
      if (values.remember) {
        localStorage.setItem('user', JSON.stringify(response.data));
        localStorage.setItem('rememberMe', 'true');
      } else {
        sessionStorage.setItem('user', JSON.stringify(response.data));
      }
      
      // Message de succès
      message.success('Connexion réussie !');
      
      // Redirection vers la page de vente
      navigate('/vente');
      
    } catch (error) {
      // Fermer le message de chargement en cas d'erreur
      if (loadingMessage) loadingMessage();
      
      console.error('Erreur de connexion:', error);
      
      // ✅ Gestion spécifique pour mot de passe incorrect (code 401)
      if (error.response) {
        if (error.response.status === 401) {
          // Afficher le message d'erreur du backend
          const errorMsg = error.response.data?.message || 'Email ou mot de passe incorrect';
          message.error(errorMsg);
          console.log('Message d\'erreur du backend:', error.response.data);
        } else if (error.response.status === 400) {
          message.error('Données invalides. Vérifiez votre email et mot de passe.');
        } else if (error.response.status === 500) {
          message.error('Erreur serveur. Veuillez réessayer plus tard.');
        } else {
          message.error(`Erreur ${error.response.status}: ${error.response.data?.message || 'Erreur inconnue'}`);
        }
      } else if (error.request) {
        // Pas de réponse du serveur
        message.error('Impossible de contacter le serveur. Vérifiez que le backend est lancé sur le port 8080.');
      } else {
        // Erreur lors de la configuration
        message.error(error.message || 'Erreur lors de la connexion');
      }
      
      // Effacer le champ mot de passe en cas d'erreur
      form.setFieldsValue({ password: '' });
    }
  };
  
  const handleForgotPassword = () => {
    message.info('Fonctionnalité "Mot de passe oublié" à venir');
  };
  
  const handleSignUp = () => {
    navigate('/register');
  };

  return (
    <Flex justify="center" align="center" style={{ height: '100vh' }}>
      <Card style={{ width: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0 }}>
            Connexion
          </Title>
          <Text type="secondary">Connectez-vous à votre compte</Text>
        </div>
        
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            remember: true,
          }}
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Email requis' },
              { type: 'email', message: 'Format d\'email invalide' }
            ]}
          >
            <Input 
              placeholder="votre@email.com" 
              size="large"
            />
          </Form.Item>
          
          <Form.Item
            label="Mot de passe"
            name="password"
            rules={[
              { required: true, message: 'Mot de passe requis' },
              { min: 6, message: 'Le mot de passe doit contenir au moins 6 caractères' }
            ]}
          >
            <Input.Password 
              placeholder="••••••••" 
              size="large"
            />
          </Form.Item>

          <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
            <Form.Item name="remember" valuePropName="checked" style={{ margin: 0 }}>
              <Checkbox>Se souvenir de moi</Checkbox>
            </Form.Item>
            
            <Button type="link" onClick={handleForgotPassword} style={{ padding: 0 }}>
              Mot de passe oublié ?
            </Button>
          </Flex>
          
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              block
              size="large"
              style={{ 
                backgroundColor: '#1890ff',
                borderColor: '#1890ff',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              Se connecter
            </Button>
          </Form.Item>
        </Form>

        <Divider plain>ou</Divider>

        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">Nouveau ici ? </Text>
          <Link onClick={handleSignUp} style={{ fontWeight: 600 }}>
            Créer un compte
          </Link>
        </div>
      </Card>
    </Flex>
  );
}