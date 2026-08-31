// src/pages/Produits.jsx
import { useState, useMemo, useEffect } from "react";
import { 
  Modal, Button, Form, Input, InputNumber, Upload, message, Select, Tag, 
  Descriptions, Avatar, Dropdown, Row, Col
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
  PictureOutlined,
  InfoCircleOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  MoreOutlined,
  LeftOutlined,
  RightOutlined
} from "@ant-design/icons";
import Swal from "sweetalert2";
import { useSearch } from "../context/SearchContext";
import { produitService } from "../services/produitService";
import { categorieService } from "../services/categorieService";
import { uploadService } from "../services/uploadService";

const { Option } = Select;

// Génère la liste des numéros de page à afficher, avec "..." pour les pages intermédiaires
function getPageNumbers(currentIndex, totalPages) {
  const current = currentIndex + 1;
  const pages = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return pages;
  }

  pages.push(1);
  if (current > 3) pages.push("...");

  const start = Math.max(2, current - 1);
  const end = Math.min(totalPages - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < totalPages - 2) pages.push("...");
  pages.push(totalPages);

  return pages;
}

export default function Produits({ darkMode }) {
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
  const [stockFilter, setStockFilter] = useState('all');
  const [form] = Form.useForm();

  const { searchTerm } = useSearch();
  const itemsPerPage = 5;

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

  const getStockStatus = (quantite) => {
    if (quantite <= 0) {
      return { text: "Rupture", color: "red", icon: <CloseCircleOutlined /> };
    } else if (quantite < 10) {
      return { text: "Stock faible", color: "orange", icon: <WarningOutlined /> };
    } else if (quantite < 20) {
      return { text: "Stock moyen", color: "blue", icon: <InboxOutlined /> };
    } else {
      return { text: "En stock", color: "green", icon: <CheckCircleOutlined /> };
    }
  };

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
          confirmButtonColor: "#D97706"
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const produitsFiltres = useMemo(() => {
    let filtered = produits;

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

    if (stockFilter === 'instock') {
      filtered = filtered.filter(p => p.quantite >= 10);
    } else if (stockFilter === 'lowstock') {
      filtered = filtered.filter(p => p.quantite > 0 && p.quantite < 10);
    } else if (stockFilter === 'outstock') {
      filtered = filtered.filter(p => p.quantite <= 0);
    }

    return filtered;
  }, [searchTerm, produits, stockFilter]);

  const totalPages = Math.max(1, Math.ceil(produitsFiltres.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages - 1);
  const indexStart = safeCurrentPage * itemsPerPage;
  const indexEnd = indexStart + itemsPerPage;
  const produitsAffiches = produitsFiltres.slice(indexStart, indexEnd);

  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm, stockFilter]);

  const stats = {
    total: produits.length,
    valeurTotale: produits.reduce((sum, p) => sum + (p.prix * p.quantite), 0),
    enStock: produits.filter(p => p.quantite >= 10).length,
    stockFaible: produits.filter(p => p.quantite > 0 && p.quantite < 10).length,
    rupture: produits.filter(p => p.quantite <= 0).length
  };

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
      cancelButtonColor: "#D97706",
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

  const filterOptions = [
    { key: 'all', label: 'Tous', count: stats.total },
    { key: 'instock', label: 'En stock', count: stats.enStock },
    { key: 'lowstock', label: 'Stock faible', count: stats.stockFaible },
    { key: 'outstock', label: 'Rupture', count: stats.rupture },
  ];

  const getRowActions = (prod) => ({
    items: [
      { key: 'view', label: 'Voir détails', icon: <EyeOutlined /> },
      { key: 'edit', label: 'Modifier', icon: <EditOutlined /> },
      { type: 'divider' },
      { key: 'delete', label: 'Supprimer', icon: <DeleteOutlined />, danger: true },
    ],
    onClick: ({ key }) => {
      if (key === 'view') handleDetail(prod);
      if (key === 'edit') handleEdit(prod.id);
      if (key === 'delete') handleDelete(prod.id);
    }
  });

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      
      {/* EN-TÊTE DE PAGE */}
      <div className="mb-5">
        <h2 className="font-brand text-2xl font-bold text-gray-800 dark:text-white">Gestion des produits</h2>
        <p className="text-sm text-gray-400 mt-0.5">Vue d'ensemble de votre catalogue</p>
      </div>

      {/* BARRE DE STATS UNIFIÉE — une seule surface, séparateurs verticaux */}
      <div className="mb-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-100 dark:divide-gray-700">
          <div className="p-5">
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Total produits</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.total}</p>
          </div>
          <div className="p-5">
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Valeur totale</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.valeurTotale.toLocaleString()} <span className="text-sm font-medium text-gray-400">MGA</span></p>
          </div>
          <div className="p-5">
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">En stock</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.enStock}</p>
          </div>
          <div className="p-5">
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Stock faible</p>
            <p className="text-2xl font-bold text-orange-500">{stats.stockFaible}</p>
          </div>
        </div>
      </div>

      {/* BARRE D'OUTILS — filtre segmenté + action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div className="inline-flex p-1 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          {filterOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setStockFilter(opt.key)}
              className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                stockFilter === opt.key
                  ? "bg-white dark:bg-gray-700 text-amber-700 dark:text-amber-400 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              {opt.label}
              <span className={`text-xs px-1.5 rounded-full ${stockFilter === opt.key ? "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300" : "bg-gray-200 dark:bg-gray-700 text-gray-500"}`}>
                {opt.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {searchTerm && (
            <span className="text-sm bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-3 py-1 rounded-full">
              {produitsFiltres.length} résultat(s)
            </span>
          )}
          <Button 
            type="primary" 
            className="bg-amber-600 hover:bg-amber-700" 
            icon={<PlusOutlined />} 
            onClick={showModal}
          >
            Nouveau produit
          </Button>
        </div>
      </div>

      {/* MODAL DE CRÉATION/MODIFICATION — avec aperçu live à droite */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-xl">
            {editingProduct ? <EditOutlined className="text-emerald-500" /> : <PlusOutlined className="text-amber-600" />}
            <span>{editingProduct ? "Modifier le produit" : "Ajouter un produit"}</span>
          </div>
        }
        open={isModalOpen}
        onCancel={handleCancel}
        width={860}
        className="product-modal"
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            Annuler
          </Button>,
          <Button
            key="ok"
            type="primary"
            loading={loading || uploading}
            onClick={handleOk}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {editingProduct ? "Modifier" : "Ajouter"}
          </Button>,
        ]}
      >
        <Row gutter={24}>
          {/* Colonne formulaire */}
          <Col span={15}>
            <Form form={form} layout="vertical">
              <Form.Item 
                name="categorie" 
                label="Catégorie" 
                rules={[{ required: true, message: "Veuillez sélectionner une catégorie" }]}
              >
                <Select 
                  placeholder="Sélectionnez une catégorie" 
                  onChange={handleCategorieChange} 
                  allowClear
                  showSearch
                  optionFilterProp="children"
                >
                  {categories.map((cat) => (
                    <Option key={cat.id} value={cat.id}>{cat.nom}</Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item 
                name="nom" 
                label="Nom du produit" 
                rules={[{ required: true, message: "Veuillez entrer le nom" }]}
              >
                <Input placeholder="Ex: Smartphone Galaxy S23" prefix={<ShoppingOutlined />} />
              </Form.Item>

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
                    <InputNumber min={0} style={{ width: "100%" }} placeholder="0" prefix={<NumberOutlined />} />
                  </Form.Item>
                </Col>
              </Row>

              {selectedCategorie && selectedCategorie.attributs && selectedCategorie.attributs.length > 0 && (
                <div className="rounded-lg p-3 mb-4" style={{ backgroundColor: darkMode ? '#1f2937' : '#fffbeb', border: `1px solid ${darkMode ? '#374151' : '#fde68a'}` }}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400 mb-3 flex items-center gap-1.5">
                    <TagOutlined /> Attributs de "{selectedCategorie.nom}"
                  </p>
                  <Row gutter={12}>
                    {selectedCategorie.attributs.map((attribut) => (
                      <Col span={8} key={attribut}>
                        <Form.Item 
                          name={`attribut_${attribut}`} 
                          label={<span style={{ color: darkMode ? '#e5e7eb' : 'inherit', fontSize: 12 }}>{attribut}</span>}
                          className="!mb-2"
                        >
                          <Input size="small" placeholder={attribut.toLowerCase()} className={darkMode ? 'bg-gray-600 text-white border-gray-500' : ''} />
                        </Form.Item>
                      </Col>
                    ))}
                  </Row>
                </div>
              )}

              <Form.Item label="Upload d'image">
                <Upload {...uploadProps} listType="picture-card">
                  {!uploadedFile && (
                    <div>
                      <UploadOutlined />
                      <div style={{ marginTop: 8 }}>Upload</div>
                    </div>
                  )}
                </Upload>
                <div className="text-xs text-gray-500 mt-1">JPG, PNG, GIF • Max 5MB</div>
              </Form.Item>

              <Form.Item name="image" label="OU URL de l'image (optionnel)">
                <Input placeholder="https://exemple.com/image.jpg" disabled={uploadedImageUrl !== null} />
              </Form.Item>
            </Form>
          </Col>

          {/* Colonne aperçu — se met à jour en direct */}
          <Col span={9}>
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 sticky top-0">
              <p className="text-xs uppercase tracking-wide text-gray-400 mb-3 flex items-center gap-1.5">
                <PictureOutlined /> Aperçu
              </p>
              <div className="rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800 aspect-square flex items-center justify-center mb-4">
                <img
                  src={getImageUrl(uploadedImageUrl || form.getFieldValue('image') || (editingProduct && editingProduct.image))}
                  alt="Aperçu"
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = "https://via.placeholder.com/150"; }}
                />
              </div>
              <p className="font-semibold text-gray-800 dark:text-white truncate">
                {Form.useWatch('nom', form) || 'Nom du produit'}
              </p>
              <p className="text-emerald-600 font-bold mt-1">
                {Form.useWatch('prix', form) || 0} MGA
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Stock : {Form.useWatch('quantite', form) ?? 0} unités
              </p>
            </div>
          </Col>
        </Row>
      </Modal>

      {/* MODAL DE DÉTAILS */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-lg">
            <ShoppingOutlined className="text-amber-600" />
            <span>Détails du produit</span>
          </div>
        }
        open={isDetailModalOpen}
        onCancel={handleDetailClose}
        footer={[
          <Button key="close" onClick={handleDetailClose} className="bg-amber-600 hover:bg-amber-700 text-white" size="small">
            Fermer
          </Button>
        ]}
        width={600}
      >
        {selectedProduct && (
          <div className="space-y-3">
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-700 rounded-lg">
              <Avatar src={getImageUrl(selectedProduct.image)} alt={selectedProduct.nom} size={80} shape="square" className="border-2 border-white shadow-md rounded-lg" />
              <div className="flex-grow">
                <h3 className="text-lg font-bold mb-1">{selectedProduct.nom}</h3>
                <div className="flex items-center gap-2 mb-2">
                  <Tag color="blue"><TagOutlined /> {selectedProduct.categorie?.nom || "Non catégorisé"}</Tag>
                  <Tag color="purple">ID: #{selectedProduct.id}</Tag>
                </div>
                <div className="flex gap-6">
                  <div>
                    <p className="text-xs text-gray-500">Prix</p>
                    <p className="text-base font-bold text-emerald-600">{selectedProduct.prix} MGA</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Stock</p>
                    <p className={`text-base font-bold ${selectedProduct.quantite > 10 ? 'text-emerald-600' : 'text-orange-500'}`}>{selectedProduct.quantite} unités</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3 flex items-center gap-1.5"><InfoCircleOutlined /> Informations</p>
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="Valeur totale" span={2}>
                  <span className="text-amber-600 font-bold">{selectedProduct.prix * selectedProduct.quantite} MGA</span>
                </Descriptions.Item>
                <Descriptions.Item label="Statut" span={2}>
                  <Tag color={getStockStatus(selectedProduct.quantite).color}>
                    {getStockStatus(selectedProduct.quantite).icon} {getStockStatus(selectedProduct.quantite).text}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </div>

            {selectedProduct.attributs && Object.keys(selectedProduct.attributs).length > 0 && (
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3 flex items-center gap-1.5"><TagOutlined /> Attributs</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(selectedProduct.attributs).map(([key, value]) => (
                    <div key={key} className={`p-2 rounded-lg text-xs ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <div className={`mb-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{key}</div>
                      <div className={`font-medium truncate ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(selectedProduct.createdAt || selectedProduct.updatedAt) && (
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3 flex items-center gap-1.5"><ClockCircleOutlined /> Système</p>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  {selectedProduct.createdAt && (
                    <div>
                      <div className="text-gray-500">Créé le</div>
                      <div className="font-medium">{new Date(selectedProduct.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
                    </div>
                  )}
                  {selectedProduct.updatedAt && (
                    <div>
                      <div className="text-gray-500">Modifié le</div>
                      <div className="font-medium">{new Date(selectedProduct.updatedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-1">
              <Button icon={<EditOutlined />} onClick={() => { handleDetailClose(); handleEdit(selectedProduct.id); }} className="bg-emerald-100 text-emerald-600 hover:bg-emerald-200 border-emerald-200" size="small">
                Modifier
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* TABLEAU — image+nom fusionnés, actions en menu déroulant */}
      <div className="rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          </div>
        ) : produitsFiltres.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
            <SearchOutlined className="text-4xl mb-3" />
            <p className="font-medium text-lg">Aucun produit trouvé</p>
            <p className="text-sm mt-1">Essayez avec un autre terme de recherche</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="p-4 text-left text-xs uppercase tracking-wide text-gray-400 font-semibold">Produit</th>
                <th className="p-4 text-left text-xs uppercase tracking-wide text-gray-400 font-semibold">Catégorie</th>
                <th className="p-4 text-right text-xs uppercase tracking-wide text-gray-400 font-semibold">Prix</th>
                <th className="p-4 text-right text-xs uppercase tracking-wide text-gray-400 font-semibold">Quantité</th>
                <th className="p-4 text-left text-xs uppercase tracking-wide text-gray-400 font-semibold">Statut</th>
                <th className="p-4 text-left text-xs uppercase tracking-wide text-gray-400 font-semibold">Attributs</th>
                <th className="p-4 text-center text-xs uppercase tracking-wide text-gray-400 font-semibold w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {produitsAffiches.map((prod) => {
                const status = getStockStatus(prod.quantite);
                return (
                  <tr key={prod.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <Avatar src={getImageUrl(prod.image)} alt={prod.nom} size={40} shape="square" className="border border-gray-200 dark:border-gray-600 flex-shrink-0" />
                        <span className="font-medium text-gray-800 dark:text-white">{prod.nom}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <Tag color="blue" icon={<TagOutlined />}>{prod.categorie?.nom || "Non catégorisé"}</Tag>
                    </td>
                    <td className="p-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      {prod.prix} MGA
                    </td>
                    <td className="p-3 text-right text-gray-700 dark:text-gray-300">
                      {prod.quantite}
                    </td>
                    <td className="p-3">
                      <Tag color={status.color}>{status.icon} {status.text}</Tag>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {prod.attributs && Object.entries(prod.attributs).slice(0, 2).map(([key, value]) => (
                          <Tag key={key} color="purple" className="text-xs">{key}</Tag>
                        ))}
                        {(!prod.attributs || Object.keys(prod.attributs).length === 0) && (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <Dropdown menu={getRowActions(prod)} trigger={['click']}>
                        <Button type="text" icon={<MoreOutlined />} shape="circle" />
                      </Dropdown>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* PAGINATION — pilule groupée, numéros de page, actif en ambre */}
      {produitsFiltres.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-5 gap-3">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Affichage de <span className="font-medium text-gray-700 dark:text-gray-300">{indexStart + 1}</span> à{" "}
            <span className="font-medium text-gray-700 dark:text-gray-300">{Math.min(indexEnd, produitsFiltres.length)}</span> sur{" "}
            <span className="font-medium text-gray-700 dark:text-gray-300">{produitsFiltres.length}</span> produit(s)
          </div>

          {totalPages > 1 && (
            <div className="inline-flex items-center gap-0.5 p-1 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setCurrentPage(safeCurrentPage - 1)}
                disabled={safeCurrentPage === 0}
                aria-label="Page précédente"
                className="w-8 h-8 flex items-center justify-center rounded-md text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:text-amber-600 dark:hover:text-amber-400 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-500 transition-colors"
              >
                <LeftOutlined className="text-xs" />
              </button>

              {getPageNumbers(safeCurrentPage, totalPages).map((page, idx) =>
                page === "..." ? (
                  <span
                    key={`dots-${idx}`}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm select-none"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page - 1)}
                    className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
                      safeCurrentPage === page - 1
                        ? "bg-amber-600 text-white shadow-sm"
                        : "text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                onClick={() => setCurrentPage(safeCurrentPage + 1)}
                disabled={safeCurrentPage === totalPages - 1}
                aria-label="Page suivante"
                className="w-8 h-8 flex items-center justify-center rounded-md text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:text-amber-600 dark:hover:text-amber-400 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-500 transition-colors"
              >
                <RightOutlined className="text-xs" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}