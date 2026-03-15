// src/pages/Vente.jsx
import { useState, useMemo, useEffect } from "react";
import {
  ArrowPathIcon,
  BookmarkSquareIcon,
  ShoppingCartIcon,
  XMarkIcon,
  PrinterIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import { useSearch } from "../context/SearchContext";
import dayjs from "dayjs";
import { produitService } from "../services/produitService";
import { produitVenduService } from "../services/produitVenduService";
import { useUser } from "../hooks/useUser";

export default function Vente() {
  const [produits, setProduits] = useState([]);
  const [panier, setPanier] = useState([]);
  const [quantites, setQuantites] = useState({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [imprimerFacture, setImprimerFacture] = useState(true);
  const [loading, setLoading] = useState(false);

  const { searchTerm } = useSearch();
  const { user } = useUser();

  // Charger les produits depuis le backend
  useEffect(() => {
    loadProduits();
  }, []);

  const loadProduits = async () => {
    setLoading(true);
    try {
      const data = await produitService.getAll();
      setProduits(data);
    } catch (error) {
      Swal.fire({
        title: "Erreur!",
        text: "Impossible de charger les produits",
        icon: "error",
        confirmButtonColor: "#3085d6"
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les produits selon la recherche
  const produitsFiltres = useMemo(() => {
    if (!searchTerm) return produits;
    return produits.filter((p) =>
      p.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.prix?.toString().includes(searchTerm) ||
      p.categorie?.nom?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, produits]);

  // Fonction pour vérifier le stock
  const verifierStock = (produit, quantiteDemandee) => {
    if (!produit) return false;
    if (produit.quantite < quantiteDemandee) {
      Swal.fire({
        title: "⚠️ Stock insuffisant",
        html: `
          <div class="text-left">
            <p>Le produit <strong>"${produit.nom}"</strong> n'a pas assez de stock.</p>
            <p class="mt-2">Stock disponible: <strong>${produit.quantite} unités</strong></p>
            <p>Quantité demandée: <strong>${quantiteDemandee} unités</strong></p>
          </div>
        `,
        icon: "warning",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "OK"
      });
      return false;
    }
    return true;
  };

  // Ajouter au panier avec vérification de stock
  const ajouterPanier = (produit) => {
    const qte = quantites[produit.id] || 1;
    
    // Vérifier si le produit est déjà dans le panier
    const existant = panier.find(p => p.id === produit.id);
    const quantiteTotale = existant 
      ? existant.quantiteAchetee + qte 
      : qte;
    
    // Vérifier le stock
    if (!verifierStock(produit, quantiteTotale)) {
      return;
    }

    if (existant) {
      setPanier(
        panier.map((p) =>
          p.id === produit.id
            ? { ...p, quantiteAchetee: p.quantiteAchetee + qte }
            : p
        )
      );
    } else {
      setPanier([...panier, { ...produit, quantiteAchetee: qte }]);
    }
    
    // Réinitialiser la quantité à 1 après ajout
    setQuantites({ ...quantites, [produit.id]: 1 });
    
    // Message de confirmation
    Swal.fire({
      title: "✅ Ajouté au panier",
      text: `${qte} x ${produit.nom} ajouté au panier`,
      icon: "success",
      timer: 1500,
      showConfirmButton: false,
      position: "top-end",
      toast: true,
    });
  };

  // Supprimer du panier
  const removeItem = (idx) => {
    setPanier(panier.filter((_, i) => i !== idx));
  };

  // Vider le panier
  const actualiser = () => {
    if (panier.length > 0) {
      Swal.fire({
        title: "Vider le panier?",
        text: "Êtes-vous sûr de vouloir vider le panier?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Oui, vider",
        cancelButtonText: "Annuler"
      }).then((result) => {
        if (result.isConfirmed) {
          setPanier([]);
        }
      });
    }
  };

  // Ouvrir la confirmation de vente
  const ouvrirConfirmation = () => {
    if (panier.length > 0) {
      setShowConfirmation(true);
    }
  };

  // Confirmer la vente et mettre à jour les stocks
  const confirmerEnregistrement = async () => {
    setShowConfirmation(false);
    
    try {
      // Vérifier que l'utilisateur est connecté
      if (!user || !user.id) {
        Swal.fire({
          title: "Erreur!",
          text: "Vous devez être connecté pour effectuer une vente",
          icon: "error",
          confirmButtonColor: "#d33"
        });
        return;
      }
      // Vérifier une dernière fois tous les stocks
      for (const item of panier) {
        const produitOriginal = produits.find(p => p.id === item.id);
        if (!verifierStock(produitOriginal, item.quantiteAchetee)) {
          return;
        }
      }


      // Créer les produits vendus pour l'historique
      const produitsVendusData = panier.map(item => ({
        nom: item.nom,
        prix: item.prix,
        quantite: item.quantiteAchetee,
        image: item.image,
        categorie: item.categorie?.nom,
        dateVendu: dayjs().format('YYYY-MM-DD'),
        userId: user.id,
        attributs: item.attributs || {}
      }));
      console.log("Données à envoyer:", produitsVendusData);

      // Enregistrer dans l'historique des ventes
      await produitVenduService.createMultiple(produitsVendusData);

      // Mettre à jour les stocks
      const promises = panier.map(async (item) => {
        const produitOriginal = produits.find(p => p.id === item.id);
        const nouvelleQuantite = produitOriginal.quantite - item.quantiteAchetee;
        
        const produitData = {
          nom: produitOriginal.nom,
          prix: produitOriginal.prix,
          quantite: nouvelleQuantite,
          image: produitOriginal.image,
          categorieId: produitOriginal.categorie?.id,
          attributs: produitOriginal.attributs || {}
        };
        
        return produitService.update(item.id, produitData);
      });

      await Promise.all(promises);
      await loadProduits();

      if (imprimerFacture) {
        genererEtAfficherFacture();
      } else {
        Swal.fire({
          title: "✅ Vente enregistrée !",
          text: "La vente a été effectuée avec succès",
          icon: "success",
          confirmButtonText: "OK",
          confirmButtonColor: "#10B981",
          timer: 3000,
        });
      }

      setPanier([]);
      
    } catch (error) {
      Swal.fire({
        title: "❌ Erreur",
        text: "Une erreur est survenue lors de l'enregistrement de la vente",
        icon: "error",
        confirmButtonColor: "#d33"
      });
    }
    
    setImprimerFacture(true);
  };

  const annulerEnregistrement = () => {
    setShowConfirmation(false);
    setImprimerFacture(true);
  };

  // Afficher le badge de stock
  const getStockBadge = (quantite) => {
    if (quantite <= 0) {
      return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">Rupture</span>;
    } else if (quantite < 10) {
      return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">Stock faible ({quantite})</span>;
    } else {
      return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">En stock ({quantite})</span>;
    }
  };

  // Mise en surbrillance du texte recherché
  const highlightText = (text = "") => {
    if (!searchTerm || !text) return text;
    const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");
    const parts = String(text).split(regex);
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === searchTerm.toLowerCase() ? (
            <mark
              key={i}
              style={{
                background: "#fde047",
                color: "#111827",
                borderRadius: "3px",
                padding: "0 2px",
              }}
            >
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  // Calcul du total
  const total = panier.reduce(
    (somme, item) => somme + item.prix * item.quantiteAchetee,
    0
  );

  const boutonsDisabled = panier.length === 0 ? "opacity-40 pointer-events-none" : "";

  // Fonctions de génération de facture (inchangées)
  const genererPDF = () => {
    const doc = new jsPDF();
    const numeroFacture = `FACT-${Date.now().toString().slice(-6)}`;
    const dateFacture = new Date().toLocaleDateString("fr-FR");
    const heureFacture = new Date().toLocaleTimeString("fr-FR");
    const primaryColor = [16, 185, 129];
    const secondaryColor = [107, 114, 128];

    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("FACTURE", 105, 15, { align: "center" });
    doc.setFontSize(10);
    doc.text("Boutique E-commerce", 105, 22, { align: "center" });
    doc.text("123 Rue du Commerce, 75000 Paris - Tél: 01 23 45 67 89", 105, 27, { align: "center" });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Numéro: ${numeroFacture}`, 20, 45);
    doc.text(`Date: ${dateFacture}`, 20, 52);
    doc.text(`Heure: ${heureFacture}`, 20, 59);
    doc.text("Client: Client Final", 150, 45);
    doc.text("Paiement: Espèces", 150, 52);
    doc.text("Statut: Payé", 150, 59);

    doc.setDrawColor(...secondaryColor);
    doc.line(20, 65, 190, 65);

    doc.setFillColor(248, 250, 252);
    doc.rect(20, 72, 170, 10, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("PRODUIT", 25, 78);
    doc.text("QTTÉ", 100, 78, { align: "center" });
    doc.text("PRIX UNIT.", 135, 78, { align: "right" });
    doc.text("TOTAL", 185, 78, { align: "right" });

    let yPosition = 85;
    doc.setFont("helvetica", "normal");

    panier.forEach((item) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(item.nom, 25, yPosition);
      doc.text(item.quantiteAchetee.toString(), 100, yPosition, { align: "center" });
      doc.text(`${item.prix.toFixed(2)} €`, 135, yPosition, { align: "right" });
      doc.text(`${(item.prix * item.quantiteAchetee).toFixed(2)} €`, 185, yPosition, { align: "right" });
      yPosition += 8;
    });

    doc.setDrawColor(...secondaryColor);
    doc.line(20, yPosition + 5, 190, yPosition + 5);

    const sousTotal = total;
    const tva = sousTotal * 0.2;
    const totalTTC = sousTotal * 1.2;

    yPosition += 15;
    doc.setFont("helvetica", "bold");
    doc.text(`Sous-total: ${sousTotal.toFixed(2)} €`, 150, yPosition, { align: "right" });
    doc.text(`TVA (20%): ${tva.toFixed(2)} MGA`, 150, yPosition + 7, { align: "right" });
    doc.setFontSize(12);
    doc.setTextColor(...primaryColor);
    doc.text(`TOTAL TTC: ${totalTTC.toFixed(2)} MGA`, 150, yPosition + 17, { align: "right" });

    doc.setTextColor(...secondaryColor);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Merci pour votre achat !", 105, 270, { align: "center" });
    doc.text("Cette facture est électronique et est valable sans signature.", 105, 275, { align: "center" });
    doc.text("Pour toute question, contactez-nous au 01 23 45 67 89", 105, 280, { align: "center" });

    return doc;
  };

  const telechargerPDF = () => {
    Swal.fire({
      title: "Génération du PDF...",
      text: "Veuillez patienter",
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); },
    });
    const doc = genererPDF();
    setTimeout(() => {
      Swal.close();
      doc.save(`facture-${Date.now().toString().slice(-6)}.pdf`);
      Swal.fire({
        title: "✅ PDF Téléchargé !",
        text: "Votre facture a été téléchargée avec succès",
        icon: "success",
        confirmButtonText: "OK",
        confirmButtonColor: "#10B981",
        timer: 3000,
      });
    }, 1500);
  };

  const genererEtAfficherFacture = () => {
    const factureHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; border-bottom: 2px solid #10B981; padding-bottom: 20px; margin-bottom: 20px;">
          <h1 style="color: #10B981; margin: 0; font-size: 28px;">FACTURE</h1>
          <p style="margin: 5px 0; color: #666;">Boutique E-commerce</p>
          <p style="margin: 5px 0; color: #666;">123 Rue du Commerce, 75000 Paris</p>
          <p style="margin: 5px 0; color: #666;">Tél: 01 23 45 67 89</p>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
          <div>
            <strong>Numéro de facture:</strong><br>FACT-${Date.now().toString().slice(-6)}<br>
            <strong>Date:</strong><br>${new Date().toLocaleDateString("fr-FR")}<br>
            ${new Date().toLocaleTimeString("fr-FR")}
          </div>
          <div style="text-align: right;">
            <strong>Client:</strong><br>Client Final<br>Paiement: Espèces<br>Statut: Payé
          </div>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f8fafc;">
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0;">Produit</th>
              <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e2e8f0;">Quantité</th>
              <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e2e8f0;">Prix Unitaire</th>
              <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e2e8f0;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${panier.map((item) => `
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${item.nom}</td>
                <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e2e8f0;">${item.quantiteAchetee}</td>
                <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e2e8f0;">${item.prix.toFixed(2)} €</td>
                <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e2e8f0;">${(item.prix * item.quantiteAchetee).toFixed(2)} €</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
        <div style="text-align: right; border-top: 2px solid #e2e8f0; padding-top: 20px;">
          <div style="margin-bottom: 10px;"><strong>Sous-total: ${total.toFixed(2)} €</strong></div>
          <div style="margin-bottom: 10px;">TVA (20%): ${(total * 0.2).toFixed(2)} €</div>
          <div style="font-size: 20px; font-weight: bold; color: #10B981;">TOTAL TTC: ${(total * 1.2).toFixed(2)} €</div>
        </div>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #666; font-size: 12px;">
          <p>Merci pour votre achat !</p>
          <p>Cette facture est électronique et est valable sans signature.</p>
          <p>Pour toute question, contactez-nous au 01 23 45 67 89</p>
        </div>
      </div>
    `;

    Swal.fire({
      title: "✅ Vente enregistrée !",
      text: "Votre vente est enregistrée avec facture",
      icon: "success",
      confirmButtonText: "Voir la facture",
      confirmButtonColor: "#10B981",
      showCancelButton: true,
      cancelButtonText: "Fermer",
      background: "#ffffff",
      iconColor: "#10B981",
      customClass: {
        popup: "rounded-xl shadow-2xl",
        title: "text-lg font-bold text-gray-800",
        confirmButton: "px-4 py-2 rounded-lg font-medium",
        cancelButton: "px-4 py-2 rounded-lg font-medium",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: "📄 Facture de vente",
          html: factureHTML,
          width: 700,
          padding: "3em",
          background: "#fff",
          showCloseButton: true,
          showConfirmButton: true,
          confirmButtonText: "🖨️ Imprimer",
          confirmButtonColor: "#10B981",
          showCancelButton: true,
          cancelButtonText: "📥 Télécharger PDF",
          cancelButtonColor: "#3B82F6",
          customClass: {
            popup: "rounded-xl shadow-2xl",
          },
        }).then((result) => {
          if (result.isConfirmed) {
            imprimerFactureHTML(factureHTML);
          } else if (result.dismiss === Swal.DismissReason.cancel) {
            telechargerPDF();
          }
        });
      }
    });
  };

  const imprimerFactureHTML = (htmlContent) => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Facture - ${new Date().toLocaleDateString("fr-FR")}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          @media print { body { margin: 0; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        ${htmlContent}
        <div class="no-print" style="text-align: center; margin-top: 30px;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #10B981; color: white; border: none; border-radius: 5px; cursor: pointer;">
            🖨️ Imprimer la facture
          </button>
          <button onclick="window.close()" style="padding: 10px 20px; background: #6B7280; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">
            ✕ Fermer
          </button>
        </div>
        <script>
          setTimeout(() => {
            if (confirm('Voulez-vous imprimer la facture maintenant ?')) { window.print(); }
          }, 500);
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="p-4 md:p-6 flex flex-col lg:flex-row gap-5">
      {/* ======================== PRODUITS ======================== */}
      <div className="w-full lg:w-2/3 bg-white dark:bg-gray-800 shadow rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl font-bold">Produits en vente</h2>
          {searchTerm && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                {produitsFiltres.length} résultat(s) pour
              </span>
              <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">
                {searchTerm}
              </span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : produitsFiltres.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-500">
            <ShoppingCartIcon className="w-12 h-12 mb-3 opacity-30" />
            <p className="font-medium">Aucun produit trouvé</p>
            <p className="text-sm mt-1">Essayez avec un autre terme de recherche</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[540px] overflow-auto rounded-xl pr-2">
            {produitsFiltres.map((prod) => (
              <div
                key={prod.id}
                className="bg-gray-100 dark:bg-gray-700 rounded-xl p-3 shadow hover:shadow-lg duration-200 flex flex-col"
              >
                <img
                  src={prod.image || "https://via.placeholder.com/150"}
                  alt={prod.nom}
                  className="h-24 w-full object-cover rounded-lg mb-2"
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/150";
                  }}
                />

                <div className="flex justify-between items-start mb-2">
                  <p className="font-semibold text-sm">{highlightText(prod.nom)}</p>
                  {getStockBadge(prod.quantite)}
                </div>

                <p className="text-xs opacity-70 mb-2">{prod.prix} MGA</p>

                <div className="flex justify-between items-center mt-auto">
                  <input
                    type="number"
                    min="1"
                    max={prod.quantite}
                    value={quantites[prod.id] || 1}
                    onChange={(e) => {
                      const value = Math.min(prod.quantite, Math.max(1, Number(e.target.value)));
                      setQuantites({ ...quantites, [prod.id]: value });
                    }}
                    className="w-16 text-sm border rounded-lg px-2 py-1 dark:bg-gray-600"
                    disabled={prod.quantite <= 0}
                  />
                  <button
                    onClick={() => ajouterPanier(prod)}
                    disabled={prod.quantite <= 0}
                    className={`p-2 rounded-full ${
                      prod.quantite > 0
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "bg-gray-400 text-gray-200 cursor-not-allowed"
                    }`}
                  >
                    <ShoppingCartIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================= PANIER ========================= */}
      <div className="w-full lg:w-1/3 bg-white dark:bg-gray-800 shadow rounded-xl p-4 flex flex-col">
        <h2 className="text-lg md:text-xl font-bold text-center mb-3">Panier</h2>

        <div className="flex-1 max-h-[400px] overflow-auto pr-2 rounded-xl">
          {panier.length === 0 ? (
            <p className="opacity-60 text-center mt-10">Panier vide…</p>
          ) : (
            <div className="space-y-3">
              {panier.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center border-b pb-2 dark:border-gray-700">
                  <div>
                    <p className="font-medium">{item.nom}</p>
                    <p className="text-sm opacity-70">
                      {item.prix} € x {item.quantiteAchetee}
                    </p>
                  </div>
                  <button 
                    onClick={() => removeItem(idx)} 
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Supprimer
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between text-lg font-bold mt-4">
          <span>Total :</span>
          <span>{total.toFixed(2)} MGA</span>
        </div>

        <div className={`mt-5 flex gap-2 justify-center ${boutonsDisabled}`}>
          <button
            onClick={actualiser}
            disabled={panier.length === 0}
            className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            <ArrowPathIcon className="w-5 h-5" /> Vider
          </button>
          <button
            onClick={ouvrirConfirmation}
            disabled={panier.length === 0}
            className="flex items-center gap-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700"
          >
            <BookmarkSquareIcon className="w-5 h-5" /> Valider la vente
          </button>
        </div>
      </div>

      {/* ==================== MODAL DE CONFIRMATION ==================== */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <DocumentTextIcon className="w-6 h-6 text-green-600" />
                Confirmer la vente
              </h3>
              <button onClick={annulerEnregistrement} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <p className="mb-4">Voulez-vous imprimer une facture pour cette vente ?</p>
              
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Total de la vente : {total.toFixed(2)} €</strong>
                </p>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg mt-4">
                <input
                  type="checkbox"
                  id="imprimerFacture"
                  checked={imprimerFacture}
                  onChange={(e) => setImprimerFacture(e.target.checked)}
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                />
                <label htmlFor="imprimerFacture" className="flex items-center gap-2 cursor-pointer">
                  <PrinterIcon className="w-5 h-5" />
                  Imprimer la facture
                </label>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={annulerEnregistrement}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Annuler
              </button>
              <button
                onClick={confirmerEnregistrement}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <BookmarkSquareIcon className="w-5 h-5" />
                Confirmer la vente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}