// src/pages/Vente.jsx
import { useState, useMemo, useEffect } from "react";
import {
  ArrowPathIcon,
  BookmarkSquareIcon,
  ShoppingCartIcon,
  XMarkIcon,
  PrinterIcon,
  DocumentTextIcon,
  TrashIcon,
  PlusIcon,
  MinusIcon,
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
  const [categorieActive, setCategorieActive] = useState('toutes');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [imprimerFacture, setImprimerFacture] = useState(true);
  const [loading, setLoading] = useState(false);

  const { searchTerm } = useSearch();
  const { user } = useUser();

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
        confirmButtonColor: "#D97706"
      });
    } finally {
      setLoading(false);
    }
  };

  // Catégories dynamiques présentes dans le catalogue
  const categoriesDisponibles = useMemo(() => {
    const noms = new Set();
    produits.forEach(p => {
      if (p.categorie?.nom) noms.add(p.categorie.nom);
    });
    return Array.from(noms);
  }, [produits]);

  const produitsFiltres = useMemo(() => {
    let filtered = produits;

    if (categorieActive !== 'toutes') {
      filtered = filtered.filter(p => p.categorie?.nom === categorieActive);
    }

    if (searchTerm) {
      filtered = filtered.filter((p) =>
        p.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.prix?.toString().includes(searchTerm) ||
        p.categorie?.nom?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [searchTerm, produits, categorieActive]);

  const verifierStock = (produit, quantiteDemandee) => {
    if (!produit) return false;
    if (produit.quantite < quantiteDemandee) {
      Swal.fire({
        title: "Stock insuffisant",
        html: `
          <div class="text-left">
            <p>Le produit <strong>"${produit.nom}"</strong> n'a pas assez de stock.</p>
            <p class="mt-2">Stock disponible: <strong>${produit.quantite} unités</strong></p>
            <p>Quantité demandée: <strong>${quantiteDemandee} unités</strong></p>
          </div>
        `,
        icon: "warning",
        confirmButtonColor: "#D97706",
        confirmButtonText: "OK"
      });
      return false;
    }
    return true;
  };

  const ajouterPanier = (produit) => {
    const qte = quantites[produit.id] || 1;
    
    const existant = panier.find(p => p.id === produit.id);
    const quantiteTotale = existant 
      ? existant.quantiteAchetee + qte 
      : qte;
    
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
    
    setQuantites({ ...quantites, [produit.id]: 1 });
    
    Swal.fire({
      title: "Ajouté au panier",
      text: `${qte} x ${produit.nom} ajouté au panier`,
      icon: "success",
      timer: 1200,
      showConfirmButton: false,
      position: "top-end",
      toast: true,
    });
  };

  const removeItem = (idx) => {
    setPanier(panier.filter((_, i) => i !== idx));
  };

  // Ajuster la quantité directement dans le panier
  const ajusterQuantitePanier = (idx, delta) => {
    setPanier(panier.map((item, i) => {
      if (i !== idx) return item;
      const produitOriginal = produits.find(p => p.id === item.id);
      const nouvelleQte = item.quantiteAchetee + delta;
      if (nouvelleQte < 1) return item;
      if (produitOriginal && nouvelleQte > produitOriginal.quantite) {
        Swal.fire({
          title: "Stock insuffisant",
          text: `Stock disponible: ${produitOriginal.quantite} unités`,
          icon: "warning",
          confirmButtonColor: "#D97706",
        });
        return item;
      }
      return { ...item, quantiteAchetee: nouvelleQte };
    }));
  };

  const actualiser = () => {
    if (panier.length > 0) {
      Swal.fire({
        title: "Vider le panier?",
        text: "Êtes-vous sûr de vouloir vider le panier?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#D97706",
        confirmButtonText: "Oui, vider",
        cancelButtonText: "Annuler"
      }).then((result) => {
        if (result.isConfirmed) {
          setPanier([]);
        }
      });
    }
  };

  const ouvrirConfirmation = () => {
    if (panier.length > 0) {
      setShowConfirmation(true);
    }
  };

  const confirmerEnregistrement = async () => {
    setShowConfirmation(false);
    
    try {
      if (!user || !user.id) {
        Swal.fire({
          title: "Erreur!",
          text: "Vous devez être connecté pour effectuer une vente",
          icon: "error",
          confirmButtonColor: "#d33"
        });
        return;
      }
      for (const item of panier) {
        const produitOriginal = produits.find(p => p.id === item.id);
        if (!verifierStock(produitOriginal, item.quantiteAchetee)) {
          return;
        }
      }

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

      await produitVenduService.createMultiple(produitsVendusData);

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
          title: "Vente enregistrée !",
          text: "La vente a été effectuée avec succès",
          icon: "success",
          confirmButtonText: "OK",
          confirmButtonColor: "#D97706",
          timer: 3000,
        });
      }

      setPanier([]);
      
    } catch (error) {
      Swal.fire({
        title: "Erreur",
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

  const highlightText = (text = "") => {
    if (!searchTerm || !text) return text;
    const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");
    const parts = String(text).split(regex);
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === searchTerm.toLowerCase() ? (
            <mark key={i} style={{ background: "#fde047", color: "#111827", borderRadius: "3px", padding: "0 2px" }}>
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  const total = panier.reduce((somme, item) => somme + item.prix * item.quantiteAchetee, 0);
  const nbArticles = panier.reduce((n, item) => n + item.quantiteAchetee, 0);

  const boutonsDisabled = panier.length === 0 ? "opacity-40 pointer-events-none" : "";

  const genererPDF = () => {
    const doc = new jsPDF();
    const numeroFacture = `FACT-${Date.now().toString().slice(-6)}`;
    const dateFacture = new Date().toLocaleDateString("fr-FR");
    const heureFacture = new Date().toLocaleTimeString("fr-FR");
    const primaryColor = [217, 119, 6];
    const secondaryColor = [107, 114, 128];

    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("FACTURE", 105, 15, { align: "center" });
    doc.setFontSize(10);
    doc.text("Mon Application", 105, 22, { align: "center" });
    doc.text("Fianarantsoa, Madagascar", 105, 27, { align: "center" });

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
      doc.text(`${item.prix.toFixed(2)} MGA`, 135, yPosition, { align: "right" });
      doc.text(`${(item.prix * item.quantiteAchetee).toFixed(2)} MGA`, 185, yPosition, { align: "right" });
      yPosition += 8;
    });

    doc.setDrawColor(...secondaryColor);
    doc.line(20, yPosition + 5, 190, yPosition + 5);

    yPosition += 15;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...primaryColor);
    doc.text(`TOTAL: ${total.toFixed(2)} MGA`, 150, yPosition, { align: "right" });

    doc.setTextColor(...secondaryColor);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Merci pour votre achat !", 105, 270, { align: "center" });
    doc.text("Cette facture est électronique et est valable sans signature.", 105, 275, { align: "center" });

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
        title: "PDF Téléchargé !",
        text: "Votre facture a été téléchargée avec succès",
        icon: "success",
        confirmButtonText: "OK",
        confirmButtonColor: "#D97706",
        timer: 3000,
      });
    }, 1500);
  };

  const genererEtAfficherFacture = () => {
    const factureHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; border-bottom: 2px solid #D97706; padding-bottom: 20px; margin-bottom: 20px;">
          <h1 style="color: #D97706; margin: 0; font-size: 28px;">FACTURE</h1>
          <p style="margin: 5px 0; color: #666;">Mon Application</p>
          <p style="margin: 5px 0; color: #666;">Fianarantsoa, Madagascar</p>
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
            <tr style="background-color: #fffbeb;">
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #fde68a;">Produit</th>
              <th style="padding: 12px; text-align: center; border-bottom: 2px solid #fde68a;">Quantité</th>
              <th style="padding: 12px; text-align: right; border-bottom: 2px solid #fde68a;">Prix Unitaire</th>
              <th style="padding: 12px; text-align: right; border-bottom: 2px solid #fde68a;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${panier.map((item) => `
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${item.nom}</td>
                <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e2e8f0;">${item.quantiteAchetee}</td>
                <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e2e8f0;">${item.prix.toFixed(2)} MGA</td>
                <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e2e8f0;">${(item.prix * item.quantiteAchetee).toFixed(2)} MGA</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
        <div style="text-align: right; border-top: 2px solid #e2e8f0; padding-top: 20px;">
          <div style="font-size: 20px; font-weight: bold; color: #D97706;">TOTAL: ${total.toFixed(2)} MGA</div>
        </div>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #666; font-size: 12px;">
          <p>Merci pour votre achat !</p>
          <p>Cette facture est électronique et est valable sans signature.</p>
        </div>
      </div>
    `;

    Swal.fire({
      title: "Vente enregistrée !",
      text: "Votre vente est enregistrée avec facture",
      icon: "success",
      confirmButtonText: "Voir la facture",
      confirmButtonColor: "#D97706",
      showCancelButton: true,
      cancelButtonText: "Fermer",
      background: "#ffffff",
      iconColor: "#D97706",
      customClass: {
        popup: "rounded-xl shadow-2xl",
        title: "text-lg font-bold text-gray-800",
        confirmButton: "px-4 py-2 rounded-lg font-medium",
        cancelButton: "px-4 py-2 rounded-lg font-medium",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: "Facture de vente",
          html: factureHTML,
          width: 700,
          padding: "3em",
          background: "#fff",
          showCloseButton: true,
          showConfirmButton: true,
          confirmButtonText: "Imprimer",
          confirmButtonColor: "#D97706",
          showCancelButton: true,
          cancelButtonText: "Télécharger PDF",
          cancelButtonColor: "#334155",
          customClass: { popup: "rounded-xl shadow-2xl" },
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
          <button onclick="window.print()" style="padding: 10px 20px; background: #D97706; color: white; border: none; border-radius: 5px; cursor: pointer;">
            Imprimer la facture
          </button>
          <button onclick="window.close()" style="padding: 10px 20px; background: #6B7280; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">
            Fermer
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
      <div className="w-full lg:w-2/3 bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-100 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-brand text-lg md:text-xl font-bold text-gray-800 dark:text-white">Produits en vente</h2>
          {searchTerm && (
            <span className="text-sm bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-2.5 py-0.5 rounded-full font-medium">
              {produitsFiltres.length} résultat(s)
            </span>
          )}
        </div>

        {/* Filtre catégories dynamique */}
        {categoriesDisponibles.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-4">
            <button
              onClick={() => setCategorieActive('toutes')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                categorieActive === 'toutes'
                  ? "bg-amber-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Toutes
            </button>
            {categoriesDisponibles.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategorieActive(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  categorieActive === cat
                    ? "bg-amber-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          </div>
        ) : produitsFiltres.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-500">
            <ShoppingCartIcon className="w-12 h-12 mb-3 opacity-30" />
            <p className="font-medium">Aucun produit trouvé</p>
            <p className="text-sm mt-1">Essayez avec un autre terme de recherche</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[500px] overflow-auto rounded-xl pr-2">
            {produitsFiltres.map((prod) => {
              const stockPct = Math.min(100, (prod.quantite / 20) * 100);
              const stockColor = prod.quantite <= 0 ? "bg-red-500" : prod.quantite < 10 ? "bg-orange-400" : "bg-emerald-500";
              const qte = quantites[prod.id] || 1;
              return (
                <div
                  key={prod.id}
                  className="bg-white dark:bg-gray-700 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-600 hover:shadow-md duration-200 flex flex-col"
                >
                  <img
                    src={prod.image || "https://via.placeholder.com/150"}
                    alt={prod.nom}
                    className="h-24 w-full object-cover rounded-lg mb-2"
                    onError={(e) => { e.target.src = "https://via.placeholder.com/150"; }}
                  />

                  <p className="font-semibold text-sm truncate">{highlightText(prod.nom)}</p>
                  <p className="text-xs opacity-70 mb-1.5">{prod.prix} MGA</p>

                  {/* Barre de stock visuelle */}
                  <div className="mb-2">
                    <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div className={`h-full ${stockColor} rounded-full transition-all`} style={{ width: `${stockPct}%` }} />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">{prod.quantite} en stock</p>
                  </div>

                  <div className="flex items-center justify-between mt-auto gap-2">
                    {/* Stepper quantité */}
                    <div className="flex items-center border border-gray-200 dark:border-gray-500 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setQuantites({ ...quantites, [prod.id]: Math.max(1, qte - 1) })}
                        disabled={prod.quantite <= 0}
                        className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-30"
                      >
                        <MinusIcon className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-7 text-center text-sm font-medium">{qte}</span>
                      <button
                        onClick={() => setQuantites({ ...quantites, [prod.id]: Math.min(prod.quantite, qte + 1) })}
                        disabled={prod.quantite <= 0}
                        className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-30"
                      >
                        <PlusIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button
                      onClick={() => ajouterPanier(prod)}
                      disabled={prod.quantite <= 0}
                      className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                        prod.quantite > 0
                          ? "bg-amber-600 text-white hover:bg-amber-700"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      <ShoppingCartIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================= PANIER ========================= */}
      <div className="w-full lg:w-1/3 bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-brand text-lg md:text-xl font-bold text-gray-800 dark:text-white">Panier</h2>
          {panier.length > 0 && (
            <span className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full font-medium">
              {nbArticles} article(s)
            </span>
          )}
        </div>

        <div className="flex-1 max-h-[400px] overflow-auto pr-1">
          {panier.length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-10 text-gray-400 dark:text-gray-500">
              <ShoppingCartIcon className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">Panier vide…</p>
            </div>
          ) : (
            <div className="space-y-2">
              {panier.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2.5 border-b border-gray-100 dark:border-gray-700 pb-2.5">
                  <img
                    src={item.image || "https://via.placeholder.com/150"}
                    alt={item.nom}
                    className="w-11 h-11 rounded-lg object-cover flex-shrink-0"
                    onError={(e) => { e.target.src = "https://via.placeholder.com/150"; }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.nom}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded">
                        <button onClick={() => ajusterQuantitePanier(idx, -1)} className="px-1.5 py-0.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600">
                          <MinusIcon className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center text-xs">{item.quantiteAchetee}</span>
                        <button onClick={() => ajusterQuantitePanier(idx, 1)} className="px-1.5 py-0.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600">
                          <PlusIcon className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-xs text-emerald-600 font-semibold">{(item.prix * item.quantiteAchetee).toFixed(0)} MGA</span>
                    </div>
                  </div>
                  <button onClick={() => removeItem(idx)} className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Total sticky */}
        <div className="border-t border-gray-100 dark:border-gray-700 pt-3 mt-3">
          <div className="flex justify-between text-base font-bold text-gray-800 dark:text-white mb-3">
            <span>Total</span>
            <span>{total.toFixed(2)} MGA</span>
          </div>

          <div className={`flex gap-2 justify-center ${boutonsDisabled}`}>
            <button
              onClick={actualiser}
              disabled={panier.length === 0}
              className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
            >
              <ArrowPathIcon className="w-4 h-4" /> Vider
            </button>
            <button
              onClick={ouvrirConfirmation}
              disabled={panier.length === 0}
              className="flex-1 flex items-center justify-center gap-1 bg-amber-600 text-white px-3 py-2 rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
            >
              <BookmarkSquareIcon className="w-4 h-4" /> Valider la vente
            </button>
          </div>
        </div>
      </div>

      {/* ==================== MODAL DE CONFIRMATION ITEMISÉE ==================== */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-md w-full p-6 max-h-[85vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-brand text-lg font-bold flex items-center gap-2 text-gray-800 dark:text-white">
                <DocumentTextIcon className="w-6 h-6 text-amber-600" />
                Confirmer la vente
              </h3>
              <button onClick={annulerEnregistrement} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Récapitulatif itemisé */}
            <div className="space-y-2 mb-4 max-h-48 overflow-auto pr-1">
              {panier.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm py-1.5 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-700 dark:text-gray-200 truncate">{item.nom} <span className="text-gray-400">x{item.quantiteAchetee}</span></span>
                  <span className="font-medium text-gray-800 dark:text-white flex-shrink-0 ml-2">{(item.prix * item.quantiteAchetee).toFixed(0)} MGA</span>
                </div>
              ))}
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Total</span>
                <span className="text-lg font-bold text-amber-700 dark:text-amber-300">{total.toFixed(2)} MGA</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg mb-6">
              <input
                type="checkbox"
                id="imprimerFacture"
                checked={imprimerFacture}
                onChange={(e) => setImprimerFacture(e.target.checked)}
                className="w-4 h-4 accent-amber-600 rounded focus:ring-amber-500"
              />
              <label htmlFor="imprimerFacture" className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-200 text-sm">
                <PrinterIcon className="w-5 h-5" />
                Imprimer la facture
              </label>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={annulerEnregistrement}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
              >
                Annuler
              </button>
              <button
                onClick={confirmerEnregistrement}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center gap-2 transition-colors text-sm font-medium"
              >
                <BookmarkSquareIcon className="w-4 h-4" />
                Confirmer la vente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}