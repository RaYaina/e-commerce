package com.example.backend.service;

import com.example.backend.dto.request.ProduitRequest;
import com.example.backend.entity.Categorie;
import com.example.backend.entity.Produit;
import com.example.backend.repository.CategorieRepository;
import com.example.backend.repository.ProduitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProduitService {

    private final ProduitRepository produitRepository;
    private final CategorieRepository categorieRepository;

    /**
     * Récupérer tous les produits
     */
    public List<Produit> getAllProduits() {
        return produitRepository.findAll();
    }

    /**
     * Récupérer un produit par ID
     */
    public Produit getProduitById(Long id) {
        return produitRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Produit non trouvé avec l'ID : " + id));
    }

    /**
     * Créer un nouveau produit
     */
    @Transactional
    public Produit createProduit(ProduitRequest request) {
        // Vérifier que la catégorie existe
        Categorie categorie = categorieRepository.findById(request.getCategorieId())
            .orElseThrow(() -> new RuntimeException("Catégorie non trouvée avec l'ID : " + request.getCategorieId()));

        // Créer le produit
        Produit produit = new Produit();
        produit.setNom(request.getNom());
        produit.setPrix(request.getPrix());
        produit.setQuantite(request.getQuantite());
        produit.setImage(request.getImage() != null ? request.getImage() : "https://via.placeholder.com/150");
        produit.setCategorie(categorie);
        produit.setAttributs(request.getAttributs());

        return produitRepository.save(produit);
    }

    /**
     * Mettre à jour un produit
     */
    @Transactional
    public Produit updateProduit(Long id, ProduitRequest request) {
        Produit produit = getProduitById(id);

        // Mettre à jour la catégorie si changée
        if (!produit.getCategorie().getId().equals(request.getCategorieId())) {
            Categorie categorie = categorieRepository.findById(request.getCategorieId())
                .orElseThrow(() -> new RuntimeException("Catégorie non trouvée avec l'ID : " + request.getCategorieId()));
            produit.setCategorie(categorie);
        }

        // Mettre à jour les autres champs
        produit.setNom(request.getNom());
        produit.setPrix(request.getPrix());
        produit.setQuantite(request.getQuantite());
        produit.setImage(request.getImage());
        produit.setAttributs(request.getAttributs());

        return produitRepository.save(produit);
    }

    /**
     * Supprimer un produit
     */
    @Transactional
    public void deleteProduit(Long id) {
        Produit produit = getProduitById(id);
        produitRepository.delete(produit);
    }

    /**
     * Rechercher des produits
     */
    public List<Produit> searchProduits(String search) {
        if (search == null || search.trim().isEmpty()) {
            return getAllProduits();
        }
        return produitRepository.searchProduits(search.trim());
    }

    /**
     * Récupérer les produits d'une catégorie
     */
    public List<Produit> getProduitsByCategorie(Long categorieId) {
        Categorie categorie = categorieRepository.findById(categorieId)
            .orElseThrow(() -> new RuntimeException("Catégorie non trouvée avec l'ID : " + categorieId));
        return produitRepository.findByCategorie(categorie);
    }

    /**
     * Récupérer les produits en stock
     */
    public List<Produit> getProduitsEnStock() {
        return produitRepository.findByQuantiteGreaterThan(0);
    }
}