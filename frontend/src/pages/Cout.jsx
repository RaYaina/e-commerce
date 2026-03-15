// src/pages/Cout.jsx
import { useState, useMemo, useEffect } from "react";
import { Button, Tag, Modal, Form, Input, InputNumber, Select, Upload, DatePicker, message, Avatar, Tooltip, Card, Descriptions, Divider } from "antd";
import { 
  EyeOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  UploadOutlined, 
  CalendarOutlined, 
  ShoppingOutlined,
  TagOutlined,
  DollarOutlined,
  NumberOutlined,
  CrownOutlined
} from '@ant-design/icons';
import Swal from 'sweetalert2';
import dayjs from 'dayjs';
import { useSearch } from "../context/SearchContext";
import { produitVenduService } from "../services/produitVenduService";
import { uploadService } from "../services/uploadService";
import { produitService } from "../services/produitService";

const { Option } = Select;

export default function Cout() {
  const [produitsVendus, setProduitsVendus] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [form] = Form.useForm();
  const [currentPage, setCurrentPage] = useState(0);
  const [produits, setProduits] = useState([]);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const pageSize = 5;

  // ================================================================
  // RÉCUPÉRER LE TERME DE RECHERCHE GLOBAL
  // ================================================================
  const { searchTerm } = useSearch();

  // ================================================================
  // CHARGER LES DONNÉES DU BACKEND
  // ================================================================
  useEffect(() => {
    loadProduitsVendus();
    loadProduits();
  }, []);
  
  const loadProduitsVendus = async () => {
    setLoading(true);
    try {
      const data = await produitVenduService.getAll();
      
      // 🔍 SOLUTION 3: LOGS DE DÉBOGAGE
      console.log("===== DONNÉES REÇUES DU BACKEND =====");
      console.log("Nombre d'éléments:", data.length);
      console.log("Structure complète:", JSON.stringify(data, null, 2));
      
      if (data.length > 0) {
        console.log("Premier élément:", data[0]);
        console.log("User du premier élément:", data[0]?.user);
        console.log("Nom du vendeur:", data[0]?.vendeurNom);
        console.log("Email du vendeur:", data[0]?.vendeurEmail);
        console.log("Profil image:", data[0]?.user?.profileImage);
      }
      console.log("=====================================");
      
      setProduitsVendus(data);
    } catch (error) {
      console.error("Erreur chargement:", error);
      Swal.fire({
        title: "Erreur!",
        text: "Impossible de charger les produits vendus",
        icon: "error",
        confirmButtonColor: "#3085d6"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadProduits = async () => {
    try {
      const data = await produitService.getAll();
      setProduits(data);
    } catch (error) {
      console.error("Erreur lors du chargement des produits:", error);
    }
  };

  // ================================================================
  // FILTRAGE DES PRODUITS SELON LE SEARCHTERM GLOBAL
  // ================================================================
  const produitsFiltres = useMemo(() => {
    if (!searchTerm) return produitsVendus;
    return produitsVendus.filter((p) => {
      const inNom = p.nom?.toLowerCase().includes(searchTerm.toLowerCase());
      const inCategorie = (p.categorie || "").toLowerCase().includes(searchTerm.toLowerCase());
      const inPrix = p.prix?.toString().includes(searchTerm);
      const inQuantite = p.quantite?.toString().includes(searchTerm);
      const inDate = p.dateVendu ? dayjs(p.dateVendu).format('DD/MM/YYYY').includes(searchTerm) : false;
      const inVendeur = p.user?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        p.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const inAttributs = p.attributs
        ? Object.values(p.attributs).some((v) => v?.toLowerCase().includes(searchTerm.toLowerCase()))
        : false;
      return inNom || inCategorie || inPrix || inQuantite || inDate || inVendeur || inAttributs;
    });
  }, [searchTerm, produitsVendus]);

  // ================================================================
  // FONCTION POUR OBTENIR L'URL COMPLÈTE DE L'IMAGE
  // ================================================================
  const getImageUrl = (imagePath) => {
    if (!imagePath || imagePath === 'https://via.placeholder.com/150') {
      return "https://via.placeholder.com/150";
    }
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    if (imagePath.startsWith('uploads/')) {
      return `http://localhost:8080/${imagePath}`;
    }
    if (imagePath.startsWith('/uploads/')) {
      return `http://localhost:8080${imagePath}`;
    }
    return `http://localhost:8080/uploads/${imagePath}`;
  };

  // ================================================================
  // UPLOAD D'IMAGE
  // ================================================================
  const uploadProps = {
    beforeUpload: async (file) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) { 
        message.error('Vous ne pouvez uploader que des fichiers image!'); 
        return false; 
      }
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) { 
        message.error("L'image doit être inférieure à 2MB!"); 
        return false; 
      }
      
      try {
        const imageUrl = await uploadService.uploadImage(file);
        setUploadedImageUrl(imageUrl);
        setUploadedImage({ file, url: imageUrl });
        message.success("Image uploadée avec succès!");
      } catch (error) {
        message.error("Erreur lors de l'upload de l'image");
      }
      
      return false;
    },
    onRemove: () => {
      setUploadedImage(null);
      setUploadedImageUrl(null);
    },
    fileList: uploadedImage ? [{ uid: '-1', name: uploadedImage.file?.name || 'image.jpg', status: 'done', url: uploadedImage.url }] : [],
    maxCount: 1,
  };

  // ================================================================
  // SURBRILLANCE DU TEXTE RECHERCHÉ
  // ================================================================
  const highlightText = (text = "") => {
    if (!searchTerm || !text) return text;
    const regex = new RegExp(`(${searchTerm})`, "gi");
    const parts = String(text).split(regex);
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === searchTerm.toLowerCase() ? (
            <mark key={i} className="bg-yellow-300 text-gray-900 rounded px-0.5">{part}</mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  // ================================================================
  // TRI ET PAGINATION
  // ================================================================
  const produitsTries = useMemo(() => {
    return [...produitsFiltres].sort((a, b) => {
      const dateA = dayjs(a.dateVendu);
      const dateB = dayjs(b.dateVendu);
      const aujourdhui = dayjs();
      if (dateA.isSame(aujourdhui, 'day') && dateB.isSame(aujourdhui, 'day')) return b.id - a.id;
      if (dateA.isSame(aujourdhui, 'day')) return -1;
      if (dateB.isSame(aujourdhui, 'day')) return 1;
      return dateB.diff(dateA);
    });
  }, [produitsFiltres]);

  const safeCurrentPage = Math.min(currentPage, Math.max(0, Math.ceil(produitsTries.length / pageSize) - 1));
  const startIndex = safeCurrentPage * pageSize;
  const endIndex = startIndex + pageSize;
  const produitsPaginés = produitsTries.slice(startIndex, endIndex);
  const totalProduits = produitsTries.length;
  const totalPages = Math.max(1, Math.ceil(totalProduits / pageSize));

  // ================================================================
  // HELPERS DATE
  // ================================================================
  const getDateColor = (dateString) => {
    if (!dateString) return 'default';
    const date = dayjs(dateString);
    const aujourdhui = dayjs();
    if (date.isSame(aujourdhui, 'day')) return 'green';
    else if (date.isSame(aujourdhui.subtract(1, 'day'), 'day')) return 'blue';
    else if (date.isAfter(aujourdhui.subtract(7, 'day'))) return 'orange';
    else return 'default';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue';
    const date = dayjs(dateString);
    const aujourdhui = dayjs();
    if (date.isSame(aujourdhui, 'day')) return "Aujourd'hui";
    else if (date.isSame(aujourdhui.subtract(1, 'day'), 'day')) return 'Hier';
    else if (date.isAfter(aujourdhui.subtract(7, 'day'))) return `Il y a ${aujourdhui.diff(date, 'day')} jours`;
    else return date.format('DD/MM/YYYY');
  };

  // ================================================================
  // CRUD - ÉDITION
  // ================================================================
  const handleEdit = (product) => {
    if (!product) {
      console.error("Produit non défini");
      return;
    }
    
    setEditingProduct(product);
    
    const formValues = {
      nom: product.nom || '',
      prix: product.prix || 0,
      quantite: product.quantite || 0,
      image: product.image || '',
      categorie: product.categorie || '',
      dateVendu: product.dateVendu ? dayjs(product.dateVendu) : dayjs(),
      ...product.attributs
    };
    
    form.setFieldsValue(formValues);
    
    if (product.image && product.image !== "https://via.placeholder.com/150") {
      setUploadedImageUrl(product.image);
      setUploadedImage({ name: "image.jpg", url: product.image });
    } else {
      setUploadedImage(null);
      setUploadedImageUrl(null);
    }
    
    setIsModalOpen(true);
  };

  // ================================================================
  // CRUD - DÉTAILS (VERSION MODERNE)
  // ================================================================
  const handleDetail = (product) => {
    setSelectedProduct(product);
    setDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setDetailModalOpen(false);
    setSelectedProduct(null);
  };

  // ================================================================
  // CRUD - SUPPRESSION
  // ================================================================
  const handleDelete = (id) => {
    const productToDelete = produitsVendus.find(p => p.id === id);
    if (!productToDelete) return;

    const isDarkMode = document.documentElement.classList.contains('dark');
    
    Swal.fire({
      title: 'Êtes-vous sûr?',
      html: `
        <div style="text-align: center;">
          <p>Voulez-vous vraiment supprimer <strong>"${productToDelete.nom}"</strong> ?</p>
          <p style="color: #f27474; font-size: 14px; margin-top: 10px;">Cette action est irréversible !</p>
        </div>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Oui, supprimer!',
      cancelButtonText: 'Annuler',
      reverseButtons: true,
      customClass: { popup: isDarkMode ? 'swal2-dark' : 'swal2-light' }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await produitVenduService.delete(id);
          setProduitsVendus(produitsVendus.filter(p => p.id !== id));
          Swal.fire({
            title: 'Supprimé!',
            text: `Le produit "${productToDelete.nom}" a été supprimé avec succès.`,
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
        } catch (error) {
          Swal.fire({
            title: 'Erreur!',
            text: error.response?.data?.message || "Impossible de supprimer le produit",
            icon: 'error'
          });
        }
      }
    });
  };

  // ================================================================
  // MODAL - VALIDATION
  // ================================================================
  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      
      let imageUrl = "https://via.placeholder.com/150";
      if (uploadedImageUrl) {
        imageUrl = uploadedImageUrl;
      } else if (values.image) {
        imageUrl = values.image;
      }

      const attributs = {};
      const champsAttributs = ['Taille', 'Couleur', 'Matériau', 'Pointure', 'Type', 'Marque', 'Mémoire', 'Style', 'Sport'];
      champsAttributs.forEach(champ => {
        if (values[champ] && values[champ].trim() !== '') {
          attributs[champ] = values[champ];
        }
      });

      const ancienneQuantite = editingProduct.quantite;
      const nouvelleQuantite = values.quantite;
      const differenceQuantite = nouvelleQuantite - ancienneQuantite;

      const produitData = {
        nom: values.nom,
        prix: values.prix,
        quantite: nouvelleQuantite,
        image: imageUrl,
        categorie: values.categorie,
        dateVendu: values.dateVendu.format('YYYY-MM-DD'),
        attributs: attributs
      };

      const updated = await produitVenduService.update(editingProduct.id, produitData);
      
      if (differenceQuantite !== 0) {
        try {
          const produitOriginal = produits.find(p => p.nom === editingProduct.nom && p.prix === editingProduct.prix);
          
          if (produitOriginal) {
            const nouveauStock = produitOriginal.quantite - differenceQuantite;
            
            const produitStockData = {
              nom: produitOriginal.nom,
              prix: produitOriginal.prix,
              quantite: nouveauStock,
              image: produitOriginal.image,
              categorieId: produitOriginal.categorie?.id,
              attributs: produitOriginal.attributs || {}
            };
            
            await produitService.update(produitOriginal.id, produitStockData);
            await loadProduits();
          }
        } catch (stockError) {
          console.error("Erreur lors de la mise à jour du stock:", stockError);
        }
      }

      setProduitsVendus(produitsVendus.map(p => 
        p.id === editingProduct.id ? updated : p
      ));
      
      Swal.fire({ 
        title: 'Succès!', 
        text: differenceQuantite !== 0 
          ? `Produit modifié et stock ajusté (${differenceQuantite > 0 ? '+' : ''}${differenceQuantite} unités)` 
          : 'Produit modifié avec succès!', 
        icon: 'success', 
        timer: 2000, 
        showConfirmButton: false 
      });

      setIsModalOpen(false);
      form.resetFields();
      setUploadedImage(null);
      setUploadedImageUrl(null);
      setEditingProduct(null);
      
    } catch (error) {
      if (error.response?.data) {
        const errors = error.response.data;
        if (typeof errors === 'object') {
          Object.keys(errors).forEach(field => {
            form.setFields([{
              name: field,
              errors: [errors[field]]
            }]);
          });
        } else {
          message.error(errors.message || "Erreur lors de l'enregistrement");
        }
      } else if (error.errorFields) {
        console.log("Erreur validation :", error);
      } else {
        message.error("Erreur lors de l'enregistrement");
      }
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
    setUploadedImage(null);
    setUploadedImageUrl(null);
    setEditingProduct(null);
  };

  // ================================================================
  // PAGINATION
  // ================================================================
  const handlePreviousPage = () => setCurrentPage(prev => prev - 1);
  const handleNextPage = () => setCurrentPage(prev => prev + 1);

  // ================================================================
  // TOTAUX
  // ================================================================
  const totalVentes = produitsFiltres.reduce((total, produit) => total + (produit.prix * produit.quantite), 0);
  const ventesAujourdhui = produitsFiltres
    .filter(prod => prod.dateVendu && dayjs(prod.dateVendu).isSame(dayjs(), 'day'))
    .reduce((total, prod) => total + (prod.prix * prod.quantite), 0);

  return (
    <div className="w-full h-full p-6 dark:bg-gray-900 dark:text-white">
      {/* EN-TÊTE */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">📊 Historique des ventes</h2>
          {searchTerm && (
            <span className="text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full">
              {produitsFiltres.length} résultat(s) pour "{searchTerm}"
            </span>
          )}
        </div>
        <div className="text-right bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 p-3 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {searchTerm ? "Total filtré" : "Total des ventes"}
          </div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{totalVentes.toFixed(2)} Ar</div>
          <div className="text-xs text-blue-500 dark:text-blue-300 flex items-center gap-1">
            <CalendarOutlined /> Aujourd'hui: {ventesAujourdhui.toFixed(2)} Ar
          </div>
        </div>
      </div>

      {/* TABLEAU */}
      <div className="overflow-auto rounded-lg shadow-lg mt-4 border border-gray-200 dark:border-gray-700">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : produitsFiltres.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
            <span className="text-5xl mb-3">🔍</span>
            <p className="font-medium text-lg">Aucun résultat trouvé</p>
            <p className="text-sm mt-1">Essayez avec un autre terme de recherche</p>
          </div>
        ) : (
          <table className="w-full bg-white dark:bg-gray-800 rounded-xl">
            <thead className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <tr>
                <th className="p-4 text-left">Image</th>
                <th className="p-4 text-left">Produit</th>
                <th className="p-4 text-left">Catégorie</th>
                <th className="p-4 text-left">Prix</th>
                <th className="p-4 text-left">Qté</th>
                <th className="p-4 text-left">Total</th>
                <th className="p-4 text-left">Date</th>
                <th className="p-4 text-left">Vendeur</th>
                <th className="p-4 text-left">Attributs</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {produitsPaginés.map((prod) => (
                <tr key={prod.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  {/* Image produit */}
                  <td className="p-4">
                    <Avatar 
                      src={getImageUrl(prod.image)} 
                      alt={prod.nom}
                      size={48}
                      shape="square"
                      className="border border-gray-300 dark:border-gray-600"
                    />
                  </td>
                  
                  {/* Nom produit */}
                  <td className="p-4 font-medium text-gray-800 dark:text-white">
                    {highlightText(prod.nom)}
                  </td>
                  
                  {/* Catégorie */}
                  <td className="p-4">
                    <Tag color="blue" icon={<TagOutlined />}>
                      {highlightText(prod.categorie || "Non catégorisé")}
                    </Tag>
                  </td>
                  
                  {/* Prix unitaire */}
                  <td className="p-4 text-green-600 dark:text-green-400 font-semibold">
                    <DollarOutlined className="mr-1" /> {prod.prix} Ar
                  </td>
                  
                  {/* Quantité */}
                  <td className="p-4">
                    <Tag color={prod.quantite > 10 ? "green" : prod.quantite > 5 ? "orange" : "red"}>
                      <NumberOutlined /> {prod.quantite}
                    </Tag>
                  </td>
                  
                  {/* Total */}
                  <td className="p-4 font-bold text-green-600 dark:text-green-400">
                    {(prod.prix * prod.quantite).toFixed(2)} Ar
                  </td>
                  
                  {/* Date */}
                  <td className="p-4">
                    <Tag color={getDateColor(prod.dateVendu)} icon={<CalendarOutlined />}>
                      {formatDate(prod.dateVendu)}
                    </Tag>
                  </td>
                  
                  {/* Vendeur avec image de profil */}
                  <td className="p-4">
                    <Tooltip title={prod.user?.email || "Email non disponible"} placement="top">
                      <div className="flex items-center gap-2">
                        {/* Avatar avec l'image de profil si elle existe, sinon l'initiale */}
                        {prod.user?.profileImage ? (
                          <img 
                            src={prod.user.profileImage} 
                            alt={prod.user.nom}
                            className="w-8 h-8 rounded-full object-cover border-2 border-blue-500"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                              e.target.parentNode.innerHTML += `<div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">${prod.user.nom?.charAt(0).toUpperCase() || '?'}</div>`;
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                            {prod.user?.nom?.charAt(0).toUpperCase() || '?'}
                          </div>
                        )}
                        
                        {/* Informations du vendeur */}
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">
                            {prod.user?.nom || "Inconnu"}
                          </span>
                          <span className="text-xs text-gray-500">
                            {prod.user?.email || ""}
                          </span>
                        </div>
                      </div>
                    </Tooltip>
                  </td>

                  {/* Attributs */}
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {prod.attributs && Object.entries(prod.attributs).map(([key, value]) => (
                        <Tag key={key} color="purple" className="text-xs">
                          {key}: {highlightText(value)}
                        </Tag>
                      ))}
                      {(!prod.attributs || Object.keys(prod.attributs).length === 0) && (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </div>
                  </td>
                  
                  {/* Actions */}
                  <td className="p-4">
                    <div className="flex justify-center gap-1">
                      <Tooltip title="Voir détails">
                        <Button 
                          icon={<EyeOutlined />} 
                          onClick={() => handleDetail(prod)}  
                          className="bg-blue-100 text-blue-600 hover:bg-blue-200 border-blue-200" 
                          size="small"
                        />
                      </Tooltip>
                      <Tooltip title="Modifier">
                        <Button 
                          icon={<EditOutlined />} 
                          onClick={() => handleEdit(prod)}    
                          className="bg-green-100 text-green-600 hover:bg-green-200 border-green-200" 
                          size="small"
                        />
                      </Tooltip>
                      <Tooltip title="Supprimer">
                        <Button 
                          icon={<DeleteOutlined />} 
                          danger 
                          onClick={() => handleDelete(prod.id)} 
                          className="bg-red-100 text-red-600 hover:bg-red-200 border-red-200" 
                          size="small"
                        />
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* PAGINATION */}
      {produitsFiltres.length > 0 && (
        <div className="flex justify-between items-center mt-4">
          <div className="text-gray-500 dark:text-gray-400 text-sm">
            Affichage de {startIndex + 1} à {Math.min(endIndex, totalProduits)} sur {totalProduits} produit(s)
            {searchTerm && <span className="text-blue-500 ml-1">(filtrés)</span>}
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handlePreviousPage} disabled={safeCurrentPage === 0} size="small">
              Précédent
            </Button>
            <span className="text-sm text-gray-600 dark:text-gray-300 px-2">
              Page {safeCurrentPage + 1} / {totalPages}
            </span>
            <Button onClick={handleNextPage} disabled={safeCurrentPage === totalPages - 1} size="small">
              Suivant
            </Button>
          </div>
        </div>
      )}

      {/* MODAL DE DÉTAILS MODERNE - SANS FACTURE */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-xl">
            <ShoppingOutlined className="text-blue-500" />
            <span>Détails de la vente</span>
          </div>
        }
        open={detailModalOpen}
        onCancel={closeDetailModal}
        footer={[
          <Button key="close" onClick={closeDetailModal} type="primary">
            Fermer
          </Button>
        ]}
        width={800}
        className="detail-modal"
      >
        {selectedProduct && (
          <div className="space-y-6">
            {/* En-tête avec images */}
            <div className="flex items-start gap-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-lg">
              {/* Image du produit */}
              <div className="flex-shrink-0">
                <Avatar 
                  src={getImageUrl(selectedProduct.image)} 
                  alt={selectedProduct.nom}
                  size={120}
                  shape="square"
                  className="border-4 border-white shadow-lg rounded-xl"
                />
              </div>
              
              {/* Informations vendeur */}
              <div className="flex-grow">
                <div className="flex items-center gap-3 mb-3">
                  {/* Avatar avec l'image de profil si elle existe, sinon l'initiale */}
                  <div className="relative">
                    {selectedProduct.user?.profileImage ? (
                      <img 
                        src={selectedProduct.user.profileImage} 
                        alt={selectedProduct.user.nom}
                        className="w-12 h-12 rounded-full object-cover border-2 border-blue-500"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                          const parent = e.target.parentNode;
                          const initialDiv = document.createElement('div');
                          initialDiv.className = 'w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl border-2 border-blue-300';
                          initialDiv.textContent = selectedProduct.user?.nom?.charAt(0).toUpperCase() || '?';
                          parent.innerHTML = '';
                          parent.appendChild(initialDiv);
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl border-2 border-blue-300">
                        {selectedProduct.user?.nom?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <CrownOutlined className="text-yellow-500" />
                      <span className="font-bold text-lg">{selectedProduct.user?.nom || "Vendeur inconnu"}</span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedProduct.user?.email || "Email non disponible"}
                    </div>
                  </div>
                </div>
                <Divider className="my-2" />
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="font-medium">Rôle:</span> {selectedProduct.user?.role || "Utilisateur"}</div>
                  <div><span className="font-medium">ID Vendeur:</span> #{selectedProduct.user?.id}</div>
                </div>
              </div>
            </div>

            {/* Informations produit */}
            <Card title="📦 Informations produit" className="shadow-sm">
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="ID Produit" span={1}>#{selectedProduct.id}</Descriptions.Item>
                <Descriptions.Item label="Nom" span={1}>
                  <span className="font-semibold">{selectedProduct.nom}</span>
                </Descriptions.Item>
                <Descriptions.Item label="Catégorie" span={1}>
                  <Tag color="blue">{selectedProduct.categorie || "Non catégorisé"}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Prix unitaire" span={1}>
                  <span className="text-green-600 font-bold">{selectedProduct.prix} Ar</span>
                </Descriptions.Item>
                <Descriptions.Item label="Quantité vendue" span={1}>
                  <Tag color={selectedProduct.quantite > 10 ? "green" : selectedProduct.quantite > 5 ? "orange" : "red"}>
                    {selectedProduct.quantite} unités
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Total" span={1}>
                  <span className="text-green-600 font-bold text-lg">
                    {(selectedProduct.prix * selectedProduct.quantite).toFixed(2)} Ar
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Date de vente" span={2}>
                  <Tag color={getDateColor(selectedProduct.dateVendu)} icon={<CalendarOutlined />}>
                    {dayjs(selectedProduct.dateVendu).format('DD/MM/YYYY')} ({formatDate(selectedProduct.dateVendu)})
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Attributs */}
            {selectedProduct.attributs && Object.keys(selectedProduct.attributs).length > 0 && (
              <Card title="🏷️ Attributs du produit" className="shadow-sm">
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(selectedProduct.attributs).map(([key, value]) => (
                    <div key={key} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <div className="text-xs text-gray-500 dark:text-gray-400">{key}</div>
                      <div className="font-medium">{value}</div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Actions supplémentaires - SANS FACTURE */}
            <div className="flex justify-end gap-2 mt-4">
              <Button 
                icon={<EditOutlined />} 
                onClick={() => {
                  closeDetailModal();
                  handleEdit(selectedProduct);
                }}
                className="bg-green-100 text-green-600 hover:bg-green-200 border-green-200"
              >
                Modifier
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL D'ÉDITION (inchangé) */}
      <Modal
        title="Modifier le produit vendu"
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        okText="Modifier"
        cancelText="Annuler"
        width={700}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item 
            name="nom" 
            label="Nom du produit" 
            rules={[{ required: true, message: "Veuillez entrer le nom" }]}
          >
            <Input placeholder="Nom" />
          </Form.Item>
          
          <div className="grid grid-cols-2 gap-4">
            <Form.Item 
              name="prix" 
              label="Prix (Ar)" 
              rules={[{ required: true, message: "Veuillez entrer le prix" }]}
            >
              <InputNumber min={0} style={{ width: "100%" }} placeholder="0" />
            </Form.Item>
            <Form.Item 
              name="quantite" 
              label="Quantité vendue" 
              rules={[{ required: true, message: "Veuillez entrer la quantité" }]}
            >
              <InputNumber min={0} style={{ width: "100%" }} placeholder="0" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="categorie" label="Catégorie">
              <Select placeholder="Sélectionnez une catégorie" allowClear>
                <Option value="Vêtements">Vêtements</Option>
                <Option value="Chaussures">Chaussures</Option>
                <Option value="Accessoires">Accessoires</Option>
                <Option value="Électronique">Électronique</Option>
                <Option value="Sport">Sport</Option>
              </Select>
            </Form.Item>
            <Form.Item 
              name="dateVendu" 
              label="Date de vente" 
              rules={[{ required: true, message: "Veuillez sélectionner la date" }]}
            >
              <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" placeholder="Sélectionnez la date" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <Form.Item name="Taille" label="Taille">
              <Input placeholder="Taille" />
            </Form.Item>
            <Form.Item name="Couleur" label="Couleur">
              <Input placeholder="Couleur" />
            </Form.Item>
            <Form.Item name="Matériau" label="Matériau">
              <Input placeholder="Matériau" />
            </Form.Item>
          </div>

          <Form.Item label="Upload d'image">
            <Upload {...uploadProps} listType="picture">
              <Button icon={<UploadOutlined />}>Cliquer pour uploader</Button>
            </Upload>
            <div className="text-xs text-gray-500 mt-1">Formats supportés: JPG, PNG, GIF • Max: 2MB</div>
          </Form.Item>

          <Form.Item name="image" label="OU URL de l'image">
            <Input placeholder="https://..." disabled={uploadedImage !== null} />
          </Form.Item>

          {uploadedImage && (
            <div className="mb-4 p-3 border border-green-200 rounded-lg bg-green-50">
              <p className="text-green-700 text-sm font-medium mb-2">Image sélectionnée:</p>
              <img 
                src={getImageUrl(uploadedImage.url)} 
                alt="Aperçu" 
                className="w-24 h-24 object-cover rounded border"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/150";
                }}
              />
            </div>
          )}

          {editingProduct && !uploadedImage && editingProduct.image && editingProduct.image !== "https://via.placeholder.com/150" && (
            <div className="mb-4 p-3 border border-blue-200 rounded-lg bg-blue-50">
              <p className="text-blue-700 text-sm font-medium mb-2">Image actuelle:</p>
              <img 
                src={getImageUrl(editingProduct.image)} 
                alt="Actuel" 
                className="w-24 h-24 object-cover rounded border"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/150";
                }}
              />
            </div>
          )}
        </Form>
      </Modal>
    </div>
  );
}