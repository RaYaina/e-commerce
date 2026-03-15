// src/pages/Produits.jsx
import { useState, useMemo, useEffect } from "react";
import { 
  Modal, Button, Form, Input, InputNumber, Upload, message, Select, Tag, 
  Card, Descriptions, Avatar, Tooltip, Row, Col, Statistic 
} from "antd";
import { 
  PlusOutlined, 
  EyeOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  UploadOutlined,
  ShoppingOutlined,
  TagOutlined,
  DollarOutlined,
  NumberOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  InboxOutlined,
  FilterOutlined
} from "@ant-design/icons";
import Swal from "sweetalert2";
import { useSearch } from "../context/SearchContext";
import { produitService } from "../services/produitService";
import { categorieService } from "../services/categorieService";
import { uploadService } from "../services/uploadService";

const { Option } = Select;

export default function Produits({ darkMode }) { // ← Ajout de darkMode en paramètre
  const [produits, setProduits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategorie, setSelectedCategorie] = useState(null);
  const [stockFilter, setStockFilter] = useState('all'); // 'all', 'instock', 'lowstock', 'outstock'
  const [form] = Form.useForm();

  const { searchTerm } = useSearch();
  const itemsPerPage = 5;

  // 📸 Fonction pour obtenir l'URL complète de l'image
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

  // Fonction pour obtenir le statut et sa couleur
  const getStockStatus = (quantite) => {
    if (quantite <= 0) {
      return {
        text: "Rupture de stock",
        color: "red",
        icon: <CloseCircleOutlined />,
        bgColor: "bg-red-100 text-red-800",
        filter: 'outstock'
      };
    } else if (quantite < 10) {
      return {
        text: "Stock faible",
        color: "orange",
        icon: <WarningOutlined />,
        bgColor: "bg-orange-100 text-orange-800",
        filter: 'lowstock'
      };
    } else if (quantite < 20) {
      return {
        text: "Stock moyen",
        color: "blue",
        icon: <InboxOutlined />,
        bgColor: "bg-blue-100 text-blue-800",
        filter: 'instock'
      };
    } else {
      return {
        text: "En stock",
        color: "green",
        icon: <CheckCircleOutlined />,
        bgColor: "bg-green-100 text-green-800",
        filter: 'instock'
      };
    }
  };

  // Charger les données au montage
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [produitsData, categoriesData] = await Promise.all([
          produitService.getAll(),
          categorieService.getAll()
        ]);
        
        setProduits(produitsData);
        setCategories(categoriesData);
      } catch (error) {
        Swal.fire({
          title: "Erreur!",
          text: "Impossible de charger les données",
          icon: "error",
          confirmButtonColor: "#3085d6"
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filtrage des produits (recherche + filtre stock)
  const produitsFiltres = useMemo(() => {
    let filtered = produits;

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter((p) => {
        const inNom = p.nom?.toLowerCase().includes(searchTerm.toLowerCase());
        const inCategorie = p.categorie?.nom?.toLowerCase().includes(searchTerm.toLowerCase());
        const inPrix = p.prix?.toString().includes(searchTerm);
        const inQuantite = p.quantite?.toString().includes(searchTerm);
        const inAttributs = p.attributs
          ? Object.values(p.attributs).some(v => v?.toLowerCase().includes(searchTerm.toLowerCase()))
          : false;
        return inNom || inCategorie || inPrix || inQuantite || inAttributs;
      });
    }

    // Filtre par stock
    if (stockFilter === 'instock') {
      filtered = filtered.filter(p => p.quantite >= 10);
    } else if (stockFilter === 'lowstock') {
      filtered = filtered.filter(p => p.quantite > 0 && p.quantite < 10);
    } else if (stockFilter === 'outstock') {
      filtered = filtered.filter(p => p.quantite <= 0);
    }

    return filtered;
  }, [searchTerm, produits, stockFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(produitsFiltres.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages - 1);
  const indexStart = safeCurrentPage * itemsPerPage;
  const indexEnd = indexStart + itemsPerPage;
  const produitsAffiches = produitsFiltres.slice(indexStart, indexEnd);

  // Reset pagination quand les filtres changent
  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm, stockFilter]);

  // Statistiques
  const stats = {
    total: produits.length,
    valeurTotale: produits.reduce((sum, p) => sum + (p.prix * p.quantite), 0),
    enStock: produits.filter(p => p.quantite >= 10).length,
    stockFaible: produits.filter(p => p.quantite > 0 && p.quantite < 10).length,
    rupture: produits.filter(p => p.quantite <= 0).length
  };

  // Upload props
  const uploadProps = {
    beforeUpload: async (file) => {
      const isImage = file.type.startsWith("image/");
      if (!isImage) {
        message.error("Vous ne pouvez uploader que des fichiers image!");
        return false;
      }
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error("L'image doit être inférieure à 5MB!");
        return false;
      }
      
      setUploading(true);
      try {
        const imageUrl = await uploadService.uploadImage(file);
        setUploadedImageUrl(imageUrl);
        setUploadedFile(file);
        message.success("Image uploadée avec succès!");
      } catch (error) {
        message.error("Erreur lors de l'upload de l'image");
      } finally {
        setUploading(false);
      }
      
      return false;
    },
    onRemove: () => {
      setUploadedImageUrl(null);
      setUploadedFile(null);
    },
    fileList: uploadedFile
      ? [{ uid: "-1", name: uploadedFile.name, status: "done", url: uploadedImageUrl }]
      : [],
    maxCount: 1,
    showUploadList: {
      showPreviewIcon: true,
      showRemoveIcon: true,
    }
  };

  const showModal = () => {
    setEditingProduct(null);
    setSelectedCategorie(null);
    setUploadedImageUrl(null);
    setUploadedFile(null);
    setIsModalOpen(true);
  };

  const handleCategorieChange = (categorieId) => {
    const categorie = categories.find((c) => c.id === categorieId);
    setSelectedCategorie(categorie);
    if (categorie) {
      const currentValues = form.getFieldsValue();
      const newAttributs = {};
      categorie.attributs.forEach((attr) => {
        newAttributs[`attribut_${attr}`] = currentValues[`attribut_${attr}`] || "";
      });
      form.setFieldsValue(newAttributs);
    }
  };

  const handleEdit = async (id) => {
    try {
      const productToEdit = await produitService.getById(id);
      setEditingProduct(productToEdit);
      const categorie = categories.find((c) => c.id === productToEdit.categorie?.id);
      setSelectedCategorie(categorie);
      
      const formValues = {
        nom: productToEdit.nom,
        prix: productToEdit.prix,
        quantite: productToEdit.quantite,
        image: productToEdit.image,
        categorie: categorie?.id,
      };
      
      if (productToEdit.attributs) {
        Object.keys(productToEdit.attributs).forEach((attr) => {
          formValues[`attribut_${attr}`] = productToEdit.attributs[attr];
        });
      }
      
      form.setFieldsValue(formValues);
      
      if (productToEdit.image && productToEdit.image !== "https://via.placeholder.com/150") {
        setUploadedImageUrl(productToEdit.image);
        setUploadedFile({ name: "image.jpg", url: productToEdit.image });
      } else {
        setUploadedImageUrl(null);
        setUploadedFile(null);
      }
      
      setIsModalOpen(true);
    } catch (error) {
      message.error("Erreur lors du chargement du produit");
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
    setUploadedImageUrl(null);
    setUploadedFile(null);
    setEditingProduct(null);
    setSelectedCategorie(null);
  };

  const handleDetailClose = () => {
    setIsDetailModalOpen(false);
    setSelectedProduct(null);
  };

  const handleDetail = (product) => {
    setSelectedProduct(product);
    setIsDetailModalOpen(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      
      let imageUrl = "https://via.placeholder.com/150";
      
      if (uploadedImageUrl) {
        imageUrl = uploadedImageUrl;
      } else if (values.image && values.image.trim() !== "") {
        imageUrl = values.image;
      }

      const categorie = categories.find((c) => c.id === values.categorie);
      const attributs = {};
      
      if (categorie) {
        categorie.attributs.forEach((attr) => {
          const valeur = values[`attribut_${attr}`];
          if (valeur && valeur.trim() !== "") attributs[attr] = valeur;
        });
      }

      const produitData = {
        nom: values.nom,
        prix: values.prix,
        quantite: values.quantite,
        image: imageUrl,
        categorieId: values.categorie,
        attributs: attributs
      };

      if (editingProduct) {
        const updated = await produitService.update(editingProduct.id, produitData);
        setProduits(produits.map(p => p.id === editingProduct.id ? updated : p));
        Swal.fire({
          title: "Succès!",
          text: "Produit modifié avec succès!",
          icon: "success",
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        const created = await produitService.create(produitData);
        setProduits([...produits, created]);
        Swal.fire({
          title: "Succès!",
          text: "Produit ajouté avec succès!",
          icon: "success",
          timer: 2000,
          showConfirmButton: false
        });
      }

      handleCancel();
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
      } else {
        message.error("Erreur lors de l'enregistrement");
      }
    }
  };

  const handleDelete = async (id) => {
    const productToDelete = produits.find(p => p.id === id);
    if (!productToDelete) return;

    const result = await Swal.fire({
      title: "Êtes-vous sûr?",
      text: `Voulez-vous vraiment supprimer "${productToDelete.nom}" ?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Oui, supprimer!",
      cancelButtonText: "Annuler"
    });

    if (result.isConfirmed) {
      try {
        await produitService.delete(id);
        setProduits(produits.filter(p => p.id !== id));
        
        if ((produits.length - 1) % itemsPerPage === 0 && safeCurrentPage > 0) {
          setCurrentPage(safeCurrentPage - 1);
        }

        Swal.fire({
          title: "Supprimé!",
          text: `Le produit "${productToDelete.nom}" a été supprimé.`,
          icon: "success",
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error) {
        Swal.fire({
          title: "Erreur!",
          text: error.response?.data?.message || "Impossible de supprimer le produit",
          icon: "error"
        });
      }
    }
  };

  // Fonction pour appliquer un filtre de stock
  const applyStockFilter = (filter) => {
    setStockFilter(filter === stockFilter ? 'all' : filter);
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* EN-TÊTE AVEC STATISTIQUES CLICKABLES */}
      <div className="mb-6">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card 
              className={`shadow-sm hover:shadow-md transition-all cursor-pointer ${stockFilter === 'all' ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => setStockFilter('all')}
            >
              <Statistic
                title="Total produits"
                value={stats.total}
                prefix={<ShoppingOutlined className="text-blue-500" />}
                valueStyle={{ color: '#3b82f6' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="shadow-sm hover:shadow-md transition-all">
              <Statistic
                title="Valeur totale"
                value={stats.valeurTotale}
                prefix={<DollarOutlined className="text-green-500" />}
                suffix="MGA"
                valueStyle={{ color: '#10b981' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card 
              className={`shadow-sm hover:shadow-md transition-all cursor-pointer ${stockFilter === 'instock' ? 'ring-2 ring-green-500' : ''}`}
              onClick={() => applyStockFilter('instock')}
            >
              <Statistic
                title="En stock"
                value={stats.enStock}
                prefix={<CheckCircleOutlined className="text-green-500" />}
                valueStyle={{ color: '#10b981' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card 
              className={`shadow-sm hover:shadow-md transition-all cursor-pointer ${stockFilter === 'lowstock' ? 'ring-2 ring-orange-500' : ''}`}
              onClick={() => applyStockFilter('lowstock')}
            >
              <Statistic
                title="Stock faible"
                value={stats.stockFaible}
                prefix={<WarningOutlined className="text-orange-500" />}
                valueStyle={{ color: '#f97316' }}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* BARRE D'OUTILS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-2xl font-bold">📦 Gestion des produits</h2>
          {stockFilter !== 'all' && (
            <Tag 
              color={stockFilter === 'instock' ? 'green' : 'orange'} 
              closable
              onClose={() => setStockFilter('all')}
              className="flex items-center gap-1"
            >
              <FilterOutlined /> 
              {stockFilter === 'instock' ? 'En stock' : 'Stock faible'}
            </Tag>
          )}
          {searchTerm && (
            <span className="text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full">
              {produitsFiltres.length} résultat(s) pour "{searchTerm}"
            </span>
          )}
        </div>
        <Button 
          type="primary" 
          className="bg-blue-500 hover:bg-blue-600" 
          icon={<PlusOutlined />} 
          onClick={showModal}
          size="large"
        >
          Nouveau produit
        </Button>
      </div>

      {/* MODAL DE CRÉATION/MODIFICATION - AVEC SUPPORT MODE SOMBRE */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-xl">
            {editingProduct ? <EditOutlined className="text-green-500" /> : <PlusOutlined className="text-blue-500" />}
            <span>{editingProduct ? "Modifier le produit" : "Ajouter un produit"}</span>
          </div>
        }
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        okText={editingProduct ? "Modifier" : "Ajouter"}
        cancelText="Annuler"
        width={800}
        confirmLoading={loading || uploading}
        className="product-modal"
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                name="categorie" 
                label="Catégorie" 
                rules={[{ required: true, message: "Veuillez sélectionner une catégorie" }]}
              >
                <Select 
                  placeholder="Sélectionnez une catégorie" 
                  onChange={handleCategorieChange} 
                  allowClear
                  size="large"
                  showSearch
                  optionFilterProp="children"
                >
                  {categories.map((cat) => (
                    <Option key={cat.id} value={cat.id}>{cat.nom}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                name="nom" 
                label="Nom du produit" 
                rules={[{ required: true, message: "Veuillez entrer le nom" }]}
              >
                <Input placeholder="Ex: Smartphone Galaxy S23" size="large" prefix={<ShoppingOutlined />} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                name="prix" 
                label="Prix (MGA)" 
                rules={[{ required: true, message: "Veuillez entrer le prix" }]}
              >
                <InputNumber 
                  min={0} 
                  style={{ width: "100%" }} 
                  placeholder="0.00" 
                  size="large"
                  prefix={<DollarOutlined />}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                  parser={(value) => value?.replace(/\s/g, '')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                name="quantite" 
                label="Quantité en stock" 
                rules={[{ required: true, message: "Veuillez entrer la quantité" }]}
              >
                <InputNumber 
                  min={0} 
                  style={{ width: "100%" }} 
                  placeholder="0" 
                  size="large"
                  prefix={<NumberOutlined />}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* PANEL ATTRIBUTS - CORRIGÉ POUR MODE SOMBRE */}
          {selectedCategorie && selectedCategorie.attributs && selectedCategorie.attributs.length > 0 && (
            <Card 
              title={`🏷️ Attributs de la catégorie "${selectedCategorie.nom}"`}
              className="mb-4"
              size="small"
              bordered={false}
              style={{ 
                backgroundColor: darkMode ? '#1f2937' : '#f0f9ff',
                borderColor: darkMode ? '#374151' : '#bfdbfe'
              }}
            >
              <Row gutter={16}>
                {selectedCategorie.attributs.map((attribut) => (
                  <Col span={8} key={attribut}>
                    <Form.Item 
                      name={`attribut_${attribut}`} 
                      label={<span style={{ color: darkMode ? '#e5e7eb' : 'inherit' }}>{attribut}</span>}
                    >
                      <Input 
                        placeholder={`Entrez ${attribut.toLowerCase()}`}
                        className={darkMode ? 'bg-gray-600 text-white border-gray-500' : ''}
                      />
                    </Form.Item>
                  </Col>
                ))}
              </Row>
            </Card>
          )}

          <Card title="📸 Image du produit" className="mb-4" size="small">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Upload d'image">
                  <Upload {...uploadProps} listType="picture-card">
                    {!uploadedFile && (
                      <div>
                        <UploadOutlined />
                        <div style={{ marginTop: 8 }}>Upload</div>
                      </div>
                    )}
                  </Upload>
                  <div className="text-xs text-gray-500 mt-1">
                    Formats supportés: JPG, PNG, GIF • Max: 5MB
                  </div>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="image" label="OU URL de l'image (optionnel)">
                  <Input placeholder="https://exemple.com/image.jpg" disabled={uploadedImageUrl !== null} />
                </Form.Item>
              </Col>
            </Row>

            {(uploadedImageUrl || (editingProduct && !uploadedImageUrl && editingProduct.image)) && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">
                  {uploadedImageUrl ? "Image uploadée:" : "Image actuelle:"}
                </p>
                <div className="flex gap-4">
                  <img 
                    src={getImageUrl(uploadedImageUrl || editingProduct.image)} 
                    alt="Aperçu" 
                    className="w-32 h-32 object-cover rounded-lg border-2 border-blue-500 shadow-md"
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/150";
                    }}
                  />
                </div>
              </div>
            )}
          </Card>
        </Form>
      </Modal>

      {/* MODAL DE DÉTAILS - VERSION COMPACTE */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-lg">
            <ShoppingOutlined className="text-blue-500" />
            <span>Détails du produit</span>
          </div>
        }
        open={isDetailModalOpen}
        onCancel={handleDetailClose}
        footer={[
          <Button key="close" onClick={handleDetailClose} type="primary" size="small">
            Fermer
          </Button>
        ]}
        width={600}
        className="detail-modal"
      >
        {selectedProduct && (
          <div className="space-y-3">
            
            {/* EN-TÊTE AVEC IMAGE - PLUS COMPACT */}
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-lg">
              <div className="flex-shrink-0">
                <Avatar 
                  src={getImageUrl(selectedProduct.image)} 
                  alt={selectedProduct.nom}
                  size={80}
                  shape="square"
                  className="border-2 border-white shadow-md rounded-lg"
                />
              </div>
              <div className="flex-grow">
                <h3 className="text-lg font-bold mb-1">{selectedProduct.nom}</h3>
                <div className="flex items-center gap-2 mb-2">
                  <Tag color="blue" className="text-xs px-2 py-0.5">
                    <TagOutlined /> {selectedProduct.categorie?.nom || "Non catégorisé"}
                  </Tag>
                  <Tag color="purple" className="text-xs px-2 py-0.5">
                    ID: #{selectedProduct.id}
                  </Tag>
                </div>
                <div className="flex gap-3">
                  <Statistic 
                    title="Prix" 
                    value={selectedProduct.prix} 
                    suffix="MGA"
                    valueStyle={{ color: '#10b981', fontSize: '16px' }}
                  />
                  <Statistic 
                    title="Stock" 
                    value={selectedProduct.quantite} 
                    suffix="unités"
                    valueStyle={{ color: selectedProduct.quantite > 10 ? '#10b981' : '#f97316', fontSize: '16px' }}
                  />
                </div>
              </div>
            </div>

            {/* INFORMATIONS PRODUIT - PLUS COMPACTES */}
            <Card title="📋 Informations" className="shadow-sm" size="small">
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="ID" span={1}>
                  <span className="font-mono text-sm">#{selectedProduct.id}</span>
                </Descriptions.Item>
                <Descriptions.Item label="Nom" span={1}>
                  <span className="font-medium">{selectedProduct.nom}</span>
                </Descriptions.Item>
                <Descriptions.Item label="Catégorie" span={1}>
                  <Tag color="blue" className="text-xs">{selectedProduct.categorie?.nom || "Non catégorisé"}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Prix" span={1}>
                  <span className="text-green-600 font-bold">{selectedProduct.prix} MGA</span>
                </Descriptions.Item>
                <Descriptions.Item label="Quantité" span={1}>
                  <Tag color={getStockStatus(selectedProduct.quantite).color} className="text-xs">
                    {getStockStatus(selectedProduct.quantite).icon} {selectedProduct.quantite} unités
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Valeur totale" span={1}>
                  <span className="text-blue-600 font-bold">
                    {selectedProduct.prix * selectedProduct.quantite} MGA
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Statut" span={2}>
                  <Tag color={getStockStatus(selectedProduct.quantite).color} className="text-xs px-3 py-1">
                    {getStockStatus(selectedProduct.quantite).icon} {getStockStatus(selectedProduct.quantite).text}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* ATTRIBUTS DYNAMIQUES - PLUS COMPACTS */}
            {selectedProduct.attributs && Object.keys(selectedProduct.attributs).length > 0 && (
              <Card title="🏷️ Attributs" className="shadow-sm" size="small">
                <Row gutter={[8, 8]}>
                  {Object.entries(selectedProduct.attributs).map(([key, value]) => (
                    <Col span={12} key={key}>
                      <div className={`p-2 rounded-lg text-xs ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <div className={`mb-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{key}</div>
                        <div className={`font-medium truncate ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{value}</div>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Card>
            )}

            {/* INFORMATIONS SYSTÈME - PLUS COMPACTES */}
            {(selectedProduct.createdAt || selectedProduct.updatedAt) && (
              <Card title="⏱️ Système" className="shadow-sm" size="small">
                <Row gutter={8}>
                  {selectedProduct.createdAt && (
                    <Col span={12}>
                      <div className="text-xs text-gray-500">Créé le</div>
                      <div className="text-xs font-medium">
                        {new Date(selectedProduct.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </Col>
                  )}
                  {selectedProduct.updatedAt && (
                    <Col span={12}>
                      <div className="text-xs text-gray-500">Modifié le</div>
                      <div className="text-xs font-medium">
                        {new Date(selectedProduct.updatedAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </Col>
                  )}
                </Row>
              </Card>
            )}

            {/* ACTIONS RAPIDES */}
            <div className="flex justify-end gap-2 mt-3">
              <Button 
                icon={<EditOutlined />} 
                onClick={() => {
                  handleDetailClose();
                  handleEdit(selectedProduct.id);
                }}
                className="bg-green-100 text-green-600 hover:bg-green-200 border-green-200"
                size="small"
              >
                Modifier
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* TABLEAU DES PRODUITS */}
      <div className="overflow-auto rounded-xl shadow-lg mt-4 border border-gray-200 dark:border-gray-700">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : produitsFiltres.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
            <span className="text-5xl mb-3">🔍</span>
            <p className="font-medium text-lg">Aucun produit trouvé</p>
            <p className="text-sm mt-1">Essayez avec un autre terme de recherche</p>
          </div>
        ) : (
          <table className="w-full bg-white dark:bg-gray-800">
            <thead className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <tr>
                <th className="p-4 text-left">Image</th>
                <th className="p-4 text-left">Produit</th>
                <th className="p-4 text-left">Catégorie</th>
                <th className="p-4 text-left">Prix</th>
                <th className="p-4 text-left">Quantité</th>
                <th className="p-4 text-left">Statut</th>
                <th className="p-4 text-left">Attributs</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {produitsAffiches.map((prod) => {
                const status = getStockStatus(prod.quantite);
                return (
                  <tr key={prod.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="p-4">
                      <Avatar 
                        src={getImageUrl(prod.image)} 
                        alt={prod.nom}
                        size={48}
                        shape="square"
                        className="border border-gray-300 dark:border-gray-600"
                      />
                    </td>
                    <td className="p-4 font-medium text-gray-800 dark:text-white">
                      {prod.nom}
                    </td>
                    <td className="p-4">
                      <Tag color="blue" icon={<TagOutlined />}>
                        {prod.categorie?.nom || "Non catégorisé"}
                      </Tag>
                    </td>
                    <td className="p-4 text-green-600 dark:text-green-400 font-semibold">
                      <DollarOutlined className="mr-1" /> {prod.prix} MGA
                    </td>
                    <td className="p-4">
                      <Tag color={status.color} icon={status.icon}>
                        {prod.quantite} unités
                      </Tag>
                    </td>
                    <td className="p-4">
                      <Tag color={status.color} className="px-3 py-1">
                        {status.icon} {status.text}
                      </Tag>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {prod.attributs && Object.entries(prod.attributs).map(([key, value]) => (
                          <Tooltip key={key} title={`${key}: ${value}`}>
                            <Tag color="purple" className="text-xs cursor-help">
                              {key}
                            </Tag>
                          </Tooltip>
                        ))}
                        {(!prod.attributs || Object.keys(prod.attributs).length === 0) && (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
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
                            onClick={() => handleEdit(prod.id)} 
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
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* PAGINATION */}
      {produitsFiltres.length > 0 && (
        <div className="flex justify-between items-center mt-4">
          <div className="text-gray-500 dark:text-gray-400 text-sm">
            Affichage de {indexStart + 1} à {Math.min(indexEnd, produitsFiltres.length)} sur {produitsFiltres.length} produit(s)
            {searchTerm && <span className="text-blue-500 ml-1">(filtrés)</span>}
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setCurrentPage(safeCurrentPage - 1)} disabled={safeCurrentPage === 0}>
              Précédent
            </Button>
            <span className="text-sm text-gray-600 dark:text-gray-300 px-2">
              Page {safeCurrentPage + 1} / {totalPages}
            </span>
            <Button onClick={() => setCurrentPage(safeCurrentPage + 1)} disabled={safeCurrentPage === totalPages - 1}>
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}