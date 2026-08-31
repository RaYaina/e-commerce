import { useState, useEffect, useRef } from "react";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  MoonIcon,
  SunIcon,
  CameraIcon,
} from "@heroicons/react/24/outline";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import { CogIcon, ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { Input, Form, Card, Typography, Button, message } from "antd";
import Logo from "../assets/logo.png";
import UserImage from "../assets/user.png";
import { useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import { useSearch, SEARCHABLE_PAGES } from "../context/SearchContext";
import api from "../services/api";
import authService from "../services/authService";

const { Title } = Typography;

export default function Header({ darkMode, setDarkMode }) {

  // ----------------------------------------------------------------
  // RÉCUPÉRER L'UTILISATEUR CONNECTÉ
  // ----------------------------------------------------------------
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userFromLocal = localStorage.getItem('user');
    const userFromSession = sessionStorage.getItem('user');
    
    if (userFromLocal) {
      setUser(JSON.parse(userFromLocal));
    } else if (userFromSession) {
      setUser(JSON.parse(userFromSession));
    }
  }, []);

  // ----------------------------------------------------------------
  // ÉTATS PROFIL
  // ----------------------------------------------------------------
  const [nom, setNom] = useState(user?.nom || "");
  const [email, setEmail] = useState(user?.email || "");
  const [profileImage, setProfileImage] = useState(user?.profileImage || null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  useEffect(() => {
    if (user) {
      setNom(user.nom);
      setEmail(user.email);
      setProfileImage(user.profileImage || null);
    }
  }, [user]);

  // ----------------------------------------------------------------
  // SWEET ALERT
  // ----------------------------------------------------------------
  const fireAlert = (options) => {
    return Swal.fire({
      buttonsStyling: true,
      background: darkMode ? "#1f2937" : "#ffffff",
      color: darkMode ? "#f9fafb" : "#111827",
      confirmButtonColor: "#D97706",
      cancelButtonColor: "#EF4444",
      ...options,
    });
  };

  // ----------------------------------------------------------------
  // RECHERCHE
  // ----------------------------------------------------------------
  const { handleSearch, clearSearch } = useSearch();
  const [inputValue, setInputValue] = useState("");
  const [userPanel, setUserPanel] = useState(false);
  const [settingsPanel, setSettingsPanel] = useState(false);

  const imageInputRef = useRef(null);
  const [form] = Form.useForm();

  const userButtonRef = useRef(null);
  const panelRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isSearchable = SEARCHABLE_PAGES.includes(location.pathname);

  // ----------------------------------------------------------------
  // UPLOAD PHOTO DE PROFIL
  // ----------------------------------------------------------------
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      fireAlert({
        title: "Erreur",
        text: "Fichier image requis.",
        icon: "error"
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      fireAlert({
        title: "Erreur",
        text: "L'image doit faire moins de 2MB",
        icon: "error"
      });
      return;
    }

    try {
      const reader = new FileReader();

      reader.onload = async () => {
        const imageBase64 = reader.result;

        setUploadingImage(true);
        const loadingMessage = message.loading('Upload de l\'image...', 0);

        try {
          await authService.updateProfileImage(imageBase64);

          setProfileImage(imageBase64);

          const currentUser = authService.getCurrentUser();
          const newUser = { ...currentUser, profileImage: imageBase64 };

          if (localStorage.getItem('user')) {
            localStorage.setItem('user', JSON.stringify(newUser));
          } else {
            sessionStorage.setItem('user', JSON.stringify(newUser));
          }
          setUser(newUser);

          loadingMessage();
          message.success('Photo de profil mise à jour !');

        } catch (error) {
          loadingMessage();
          console.error('Erreur upload:', error);

          fireAlert({
            title: 'Erreur',
            text: error.response?.data?.message || 'Erreur lors de l\'upload',
            icon: 'error'
          });
        } finally {
          setUploadingImage(false);
        }
      };

      reader.onerror = () => {
        fireAlert({
          title: 'Erreur',
          text: 'Impossible de lire le fichier',
          icon: 'error'
        });
      };

      reader.readAsDataURL(file);

    } catch (error) {
      console.error('Erreur:', error);
      fireAlert({
        title: 'Erreur',
        text: 'Une erreur est survenue',
        icon: 'error'
      });
    }
  };

  // ----------------------------------------------------------------
  // METTRE À JOUR TOUT LE PROFIL
  // ----------------------------------------------------------------
  const onFinish = async (values) => {
    try {
      const wantsToChangePassword = values.ancienMdp || values.nouveauMdp || values.confirmationMdp;

      if (wantsToChangePassword) {
        if (!values.ancienMdp || !values.nouveauMdp || !values.confirmationMdp) {
          message.error('Tous les champs de mot de passe doivent être remplis');
          return;
        }

        if (values.nouveauMdp !== values.confirmationMdp) {
          message.error('Les mots de passe ne correspondent pas');
          return;
        }

        if (values.nouveauMdp.length < 6) {
          message.error('Le nouveau mot de passe doit contenir au moins 6 caractères');
          return;
        }
      }

      const confirmResult = await fireAlert({
        title: 'Confirmer la mise à jour',
        html: `
          <div style="text-align: left;">
            <p><strong>Nom:</strong> ${values.nom}</p>
            <p><strong>Email:</strong> ${values.email}</p>
            ${wantsToChangePassword ? '<p><strong>Mot de passe:</strong> ****** (modifié)</p>' : ''}
          </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Oui, mettre à jour',
        cancelButtonText: 'Annuler',
      });

      if (!confirmResult.isConfirmed) {
        return;
      }

      const loadingMessage = message.loading('Mise à jour en cours...', 0);

      await api.put('/users/profile', {
        nom: values.nom,
        email: values.email
      });

      if (wantsToChangePassword) {
        await api.put('/users/update-password', {
          ancienMotDePasse: values.ancienMdp,
          nouveauMotDePasse: values.nouveauMdp,
          confirmationMotDePasse: values.confirmationMdp
        })
      }

      loadingMessage();

      setNom(values.nom);
      setEmail(values.email);

      const updatedUser = { ...user, nom: values.nom, email: values.email };
      if (localStorage.getItem('user')) {
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } else {
        sessionStorage.setItem('user', JSON.stringify(updatedUser));
      }
      setUser(updatedUser);

      form.setFieldsValue({
        ancienMdp: '',
        nouveauMdp: '',
        confirmationMdp: ''
      });
      setSettingsPanel(false);
      fireAlert({
        title: 'Succès !',
        text: wantsToChangePassword
          ? 'Profil et mot de passe mis à jour avec succès'
          : 'Profil mis à jour avec succès',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });

    } catch (error) {
      console.error('Erreur mise à jour:', error);

      let errorMessage = 'Erreur lors de la mise à jour';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 401) {
        errorMessage = 'Ancien mot de passe incorrect';
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || 'Données invalides';
      }
      fireAlert({
        title: 'Erreur',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  useEffect(() => {
    if (settingsPanel) {
      form.setFieldsValue({
        nom,
        email,
        ancienMdp: '',
        nouveauMdp: '',
        confirmationMdp: ''
      });
    }
  }, [settingsPanel, nom, email, form]);

  // ----------------------------------------------------------------
  // RECHERCHE
  // ----------------------------------------------------------------
  const getPlaceholder = () => {
    switch (location.pathname) {
      case "/vente": return "Rechercher un produit à vendre...";
      case "/produits": return "Rechercher un produit...";
      case "/cout": return "Rechercher dans les coûts...";
      case "/dashboard": return "Rechercher dans le tableau de bord...";
      default: return "Rechercher...";
    }
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    handleSearch(val);
  };

  const handleClear = () => {
    setInputValue("");
    clearSearch();
    inputRef.current?.focus();
  };

  useEffect(() => {
    clearSearch();
    setInputValue("");
  }, [location.pathname, clearSearch]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (userButtonRef.current && userButtonRef.current.contains(event.target)) return;
      if (panelRef.current && !panelRef.current.contains(event.target)) setUserPanel(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ----------------------------------------------------------------
  // DÉCONNEXION
  // ----------------------------------------------------------------
  const handleLogout = () => {
    fireAlert({
      title: "Déconnexion",
      text: "Vous êtes sûr de vouloir vous déconnecter ?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Oui, déconnecter",
      cancelButtonText: "Annuler",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.clear();
        sessionStorage.clear();
        setUser(null);
        fireAlert({
          title: "Déconnecté",
          text: "Vous avez été déconnecté avec succès.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false
        });
        setTimeout(() => navigate("/login"), 1000);
      }
    });
  };

  // ================================================================
  // RENDER
  // ================================================================
  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 px-4 md:px-6 py-3.5 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
        {/* Logo */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <img src={Logo} alt="Logo" className="w-7 h-7 rounded" />
          <h1 className="font-brand text-[15px] font-bold tracking-tight text-slate-800 dark:text-white hidden sm:block">
            Mon Application
          </h1>
        </div>

        {/* Barre de recherche */}
        <div className="flex-1 mx-4 max-w-md relative">
          {isSearchable ? (
            <>
              <input
                ref={inputRef}
                type="text"
                placeholder={getPlaceholder()}
                value={inputValue}
                onChange={handleChange}
                className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-lg py-2 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 dark:text-white transition-all"
              />
              <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              {inputValue ? (
                <XMarkIcon className="w-4 h-4 text-gray-400 hover:text-red-500 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer transition-colors" onClick={handleClear} />
              ) : (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-gray-400 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-0.5 hidden md:block">
                  Ctrl+K
                </span>
              )}
            </>
          ) : (
            <div className="relative opacity-40 cursor-not-allowed">
              <input type="text" placeholder="Recherche non disponible" disabled
                className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-lg py-2 pl-10 pr-4 text-sm dark:text-white" />
              <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          )}
        </div>

        {/* Icônes droite */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? <SunIcon className="w-5 h-5 text-amber-400" /> : <MoonIcon className="w-5 h-5 text-slate-500" />}
          </button>

          {user && (
            <div className="relative" ref={panelRef}>
              <button ref={userButtonRef} onClick={() => setUserPanel(!userPanel)} className="p-1 rounded-full hover:ring-2 hover:ring-amber-400/40 transition-all">
                {profileImage ? (
                  <img src={profileImage} alt={user.nom} className="w-7 h-7 rounded-full object-cover border-2 border-amber-400" />
                ) : (
                  <UserCircleIcon className="w-7 h-7 text-slate-400 dark:text-slate-500" />
                )}
              </button>

              {userPanel && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50">
                  <div className="absolute -top-2 right-4 w-3 h-3 bg-white dark:bg-gray-800 rotate-45 border-l border-t border-gray-200 dark:border-gray-700" />
                  <div className="flex flex-col items-center p-4">
                    <div className="relative">
                      <img src={profileImage || UserImage} alt={user.nom} className="w-20 h-20 object-cover rounded-full border-2 border-amber-400" />
                      <button onClick={() => imageInputRef.current?.click()} className="absolute bottom-0 right-0 bg-amber-600 hover:bg-amber-700 text-white rounded-full p-1.5 shadow border-2 border-white dark:border-gray-800 transition-colors">
                        <CameraIcon className="w-3.5 h-3.5" />
                      </button>
                      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </div>
                    <p className="mt-3 font-semibold text-sm text-gray-800 dark:text-white">{user.nom}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{user.email}</p>
                    <div className="flex flex-col w-full mt-4 space-y-2">
                      <button onClick={() => { setSettingsPanel(true); setUserPanel(false); }} className="flex items-center justify-center gap-2 w-full bg-amber-600 hover:bg-amber-700 text-white py-1.5 rounded-lg text-sm font-medium transition-colors">
                        <CogIcon className="w-4 h-4" />
                        <span>Paramètres</span>
                      </button>
                      <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full bg-red-500 hover:bg-red-600 text-white py-1.5 rounded-lg text-sm font-medium transition-colors">
                        <ArrowRightOnRectangleIcon className="w-4 h-4" />
                        <span>Déconnexion</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {!user && (
            <button onClick={() => navigate('/login')} className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Se connecter
            </button>
          )}
        </div>
      </header>

      {/* PANEL PARAMÈTRES */}
      {settingsPanel && user && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-auto">
            
            <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="font-brand text-xl font-bold text-gray-800 dark:text-white">Paramètres</h2>
              <button onClick={() => setSettingsPanel(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                <div className="lg:col-span-1 flex flex-col items-center">
                  <div className="relative">
                    <img src={profileImage || UserImage} alt="Profil" className="w-32 h-32 rounded-full object-cover border-4 border-amber-500 shadow-xl" />
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="absolute bottom-0 right-0 bg-amber-600 hover:bg-amber-700 text-white rounded-full p-2.5 shadow-xl border-4 border-white dark:border-gray-800 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed transition-transform"
                    >
                      <CameraIcon className="w-5 h-5" />
                    </button>
                    <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </div>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-4 text-center break-all">{email}</p>
                </div>

                <div className="lg:col-span-2">
                  <Card bordered={false} className="shadow-none">
                    <Title level={4} className="!mb-6 !pb-3 border-b border-gray-200 dark:border-gray-700 font-brand">
                      Modifier vos informations
                    </Title>
                    
                    <Form form={form} layout="vertical" onFinish={onFinish}>
                      <Form.Item label="Nom" name="nom" rules={[{ required: true, message: 'Nom requis' }, { min: 2, message: 'Minimum 2 caractères' }]}>
                        <Input size="large" placeholder="Votre nom" />
                      </Form.Item>
                      
                      <Form.Item label="Email" name="email" rules={[{ required: true, message: 'Email requis' }, { type: 'email', message: 'Email invalide' }]}>
                        <Input size="large" placeholder="votre@email.com" />
                      </Form.Item>

                      <div className="my-6 border-t border-gray-200 dark:border-gray-700"></div>
                      <Title level={5} className="!mb-4">
                        Changer le mot de passe (optionnel)
                      </Title>
                      
                      <Form.Item label="Ancien mot de passe" name="ancienMdp">
                        <Input.Password size="large" placeholder="Laissez vide pour ne pas changer" />
                      </Form.Item>
                      
                      <Form.Item 
                        label="Nouveau mot de passe" 
                        name="nouveauMdp"
                        dependencies={['ancienMdp']}
                        rules={[
                          ({ getFieldValue }) => ({
                            validator(_, value) {
                              if (getFieldValue('ancienMdp') && !value) {
                                return Promise.reject(new Error('Veuillez entrer un nouveau mot de passe'));
                              }
                              if (value && value.length < 6) {
                                return Promise.reject(new Error('Minimum 6 caractères'));
                              }
                              return Promise.resolve();
                            },
                          }),
                        ]}
                      >
                        <Input.Password size="large" placeholder="Nouveau mot de passe (min 6 caractères)" />
                      </Form.Item>
                      
                      <Form.Item 
                        label="Confirmer le mot de passe" 
                        name="confirmationMdp"
                        dependencies={['nouveauMdp']}
                        rules={[
                          ({ getFieldValue }) => ({
                            validator(_, value) {
                              const nouveauMdp = getFieldValue('nouveauMdp');
                              if (nouveauMdp && !value) {
                                return Promise.reject(new Error('Veuillez confirmer le mot de passe'));
                              }
                              if (nouveauMdp && value && nouveauMdp !== value) {
                                return Promise.reject(new Error('Les mots de passe ne correspondent pas'));
                              }
                              return Promise.resolve();
                            },
                          }),
                        ]}
                      >
                        <Input.Password size="large" placeholder="Confirmez le nouveau mot de passe" />
                      </Form.Item>
                      
                      <Form.Item className="!mb-0 !mt-8">
                        <Button 
                          type="primary" 
                          htmlType="submit" 
                          size="large" 
                          block
                          className="!h-12 !text-base !font-semibold bg-amber-600 hover:bg-amber-700 text-white"
                        >
                          Mettre à jour mes informations
                        </Button>
                      </Form.Item>
                    </Form>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}