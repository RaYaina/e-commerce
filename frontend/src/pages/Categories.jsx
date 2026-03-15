import { useState, useEffect } from "react";
import { Modal, Button, Form, Input, message, Tag } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import Swal from "sweetalert2";
import { categorieService } from "../services/categorieService";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategorie, setEditingCategorie] = useState(null);
  const [attributs, setAttributs] = useState([]);
  const [form] = Form.useForm();

  // Charger les catégories au montage
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await categorieService.getAll();
      setCategories(data);
    } catch (error) {
      message.error("Erreur lors du chargement des catégories");
    } finally {
      setLoading(false);
    }
  };

  const showModal = () => {
    setEditingCategorie(null);
    setAttributs([]);
    setIsModalOpen(true);
  };

  const handleEdit = (categorie) => {
    setEditingCategorie(categorie);
    setAttributs(categorie.attributs || []);
    form.setFieldsValue({
      nom: categorie.nom,
      attributs: categorie.attributs ? categorie.attributs.join(', ') : ''
    });
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
    setEditingCategorie(null);
    setAttributs([]);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      
      // Convertir la chaîne d'attributs en tableau
      const attributsArray = values.attributs 
        ? values.attributs.split(',').map(attr => attr.trim()).filter(attr => attr)
        : [];

      const categorieData = {
        nom: values.nom,
        attributs: attributsArray
      };

      if (editingCategorie) {
        // Mise à jour
        const updated = await categorieService.update(editingCategorie.id, categorieData);
        setCategories(categories.map(c => c.id === editingCategorie.id ? updated : c));
        Swal.fire({
          title: "Succès!",
          text: "Catégorie modifiée avec succès!",
          icon: "success",
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        // Création
        const created = await categorieService.create(categorieData);
        setCategories([...categories, created]);
        Swal.fire({
          title: "Succès!",
          text: "Catégorie ajoutée avec succès!",
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
    const categorieToDelete = categories.find(c => c.id === id);
    
    const result = await Swal.fire({
      title: "Êtes-vous sûr?",
      text: `Voulez-vous vraiment supprimer la catégorie "${categorieToDelete.nom}" ?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Oui, supprimer!",
      cancelButtonText: "Annuler"
    });

    if (result.isConfirmed) {
      try {
        await categorieService.delete(id);
        setCategories(categories.filter(c => c.id !== id));
        Swal.fire({
          title: "Supprimé!",
          text: `La catégorie "${categorieToDelete.nom}" a été supprimée.`,
          icon: "success",
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error) {
        Swal.fire({
          title: "Erreur!",
          text: error.response?.data?.message || "Impossible de supprimer la catégorie",
          icon: "error"
        });
      }
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Gestion des catégories</h2>
        <Button 
          type="primary" 
          className="bg-blue-500" 
          icon={<PlusOutlined />} 
          onClick={showModal}
        >
          Ajouter une catégorie
        </Button>
      </div>

      <Modal
        title={editingCategorie ? "Modifier la catégorie" : "Ajouter une catégorie"}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        okText={editingCategorie ? "Modifier" : "Ajouter"}
        cancelText="Annuler"
        width={600}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item 
            name="nom" 
            label="Nom de la catégorie" 
            rules={[
              { required: true, message: "Veuillez entrer le nom de la catégorie" },
              { min: 2, message: "Le nom doit contenir au moins 2 caractères" }
            ]}
          >
            <Input placeholder="Ex: Électronique, Vêtements, etc." />
          </Form.Item>

          <Form.Item 
            name="attributs" 
            label="Attributs (optionnel)" 
            help="Séparez les attributs par des virgules. Ex: Taille, Couleur, Matériau"
          >
            <Input.TextArea 
              placeholder="Taille, Couleur, Matériau, Marque, etc." 
              rows={3}
            />
          </Form.Item>

          {attributs.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700 mb-2">Attributs actuels :</p>
              <div className="flex flex-wrap gap-2">
                {attributs.map((attr, index) => (
                  <Tag key={index} color="blue">{attr}</Tag>
                ))}
              </div>
            </div>
          )}
        </Form>
      </Modal>

      {loading ? (
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(categorie => (
            <div 
              key={categorie.id} 
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  {categorie.nom}
                </h3>
                <div className="flex space-x-2">
                  <Button 
                    icon={<EditOutlined />} 
                    size="small"
                    onClick={() => handleEdit(categorie)}
                    className="bg-green-100 text-green-600 hover:bg-green-200 border-green-200"
                  />
                  <Button 
                    icon={<DeleteOutlined />} 
                    size="small"
                    danger
                    onClick={() => handleDelete(categorie.id)}
                    className="bg-red-100 text-red-600 hover:bg-red-200 border-red-200"
                  />
                </div>
              </div>

              <div className="mb-3">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ID: {categorie.id}
                </span>
              </div>

              {categorie.attributs && categorie.attributs.length > 0 ? (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Attributs disponibles :
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {categorie.attributs.map((attr, index) => (
                      <Tag key={index} color="purple" className="text-xs">
                        {attr}
                      </Tag>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">
                  Aucun attribut défini
                </p>
              )}

              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <span className="text-xs text-gray-500">
                  {categorie.produits?.length || 0} produit(s) dans cette catégorie
                </span>
              </div>
            </div>
          ))}

          {categories.length === 0 && !loading && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
              <span className="text-5xl mb-3">📦</span>
              <p className="font-medium text-lg">Aucune catégorie</p>
              <p className="text-sm mt-1">Cliquez sur "Ajouter une catégorie" pour commencer</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}