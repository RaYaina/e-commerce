import { Card, Flex, Form, Input, Button, Typography, Divider, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const { Title, Text, Link } = Typography;

export default function RegisterPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  
  const onFinish = async (values) => {
  try {
    const loadingMessage = message.loading('Inscription en cours...', 0);
    
    const response = await api.post('/auth/register', {
      nom: values.fullName,
      email: values.email,
      password: values.password
    });
    
    loadingMessage();
    
    console.log('Réponse:', response.data);
    message.success('Compte créé avec succès !');
    
    setTimeout(() => navigate('/login'), 2000);
    
  } catch (error) {
      // Gestion des erreurs
      console.error('Erreur d\'inscription:', error);
      
      let errorMessage = 'Une erreur est survenue lors de l\'inscription';
      
      if (error.response) {
        // Le serveur a répondu avec un code d'erreur
        if (error.response.status === 400) {
          // Gestion des erreurs de validation
          if (error.response.data.message) {
            errorMessage = error.response.data.message; // "Cet email est déjà utilisé"
          } else if (typeof error.response.data === 'object') {
            // Erreurs de validation par champ
            const errors = Object.values(error.response.data).join(', ');
            errorMessage = `Erreurs: ${errors}`;
          }
        } else if (error.response.status === 500) {
          errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
        }
      } else if (error.request) {
        // La requête a été faite mais pas de réponse
        errorMessage = 'Impossible de contacter le serveur. Vérifiez que le backend est lancé.';
      }
      
      message.error(errorMessage);
    }
  };
  
  const handleBackToLogin = () => {
    navigate('/login');
  };

  return (
    <Flex justify="center" align="center" style={{ height: '100vh' }}>
      <Card style={{ width: 400 }}>
        {/* Titre centré */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0 }}>
            Créer un compte
          </Title>
          <Text type="secondary">Inscrivez-vous pour commencer</Text>
        </div>
        
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          {/* Nom complet */}
          <Form.Item
            label="Nom complet"
            name="fullName"
            rules={[
              { required: true, message: 'Nom requis' },
              { min: 3, message: 'Le nom doit contenir au moins 3 caractères' }
            ]}
          >
            <Input placeholder="John Doe" />
          </Form.Item>

          {/* Email */}
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Email requis' },
              { type: 'email', message: 'Email invalide' }
            ]}
          >
            <Input placeholder="votre@email.com" />
          </Form.Item>
          
          {/* Mot de passe */}
          <Form.Item
            label="Mot de passe"
            name="password"
            rules={[
              { required: true, message: 'Mot de passe requis' },
              { min: 6, message: 'Minimum 6 caractères requis' }
            ]}
          >
            <Input.Password placeholder="••••••••" />
          </Form.Item>

          {/* Confirmer mot de passe */}
          <Form.Item
            label="Confirmer le mot de passe"
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Veuillez confirmer votre mot de passe' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Les mots de passe ne correspondent pas'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="••••••••" />
          </Form.Item>
          
          {/* Bouton S'inscrire */}
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              block
              style={{ 
                backgroundColor: '#1890ff',
                borderColor: '#1890ff',
                height: '40px',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              S'inscrire
            </Button>
          </Form.Item>
        </Form>

        {/* Séparateur */}
        <Divider plain>ou</Divider>

        {/* Lien retour connexion */}
        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">Vous avez déjà un compte ? </Text>
          <Link onClick={handleBackToLogin} style={{ fontWeight: 600 }}>
            Se connecter
          </Link>
        </div>
      </Card>
    </Flex>
  );
}