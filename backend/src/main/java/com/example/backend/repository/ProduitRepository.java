package com.example.backend.repository;

import com.example.backend.entity.Categorie;
import com.example.backend.entity.Produit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProduitRepository extends JpaRepository<Produit, Long> {
    
    /**
     * Trouver tous les produits d'une catégorie
     */
    List<Produit> findByCategorie(Categorie categorie);
    
    /**
     * Trouver les produits par nom (recherche partielle, insensible à la casse)
     */
    List<Produit> findByNomContainingIgnoreCase(String nom);
    
    /**
     * Trouver les produits dont le prix est entre min et max
     */
    List<Produit> findByPrixBetween(Double minPrix, Double maxPrix);
    
    /**
     * Trouver les produits en stock (quantite > 0)
     */
    List<Produit> findByQuantiteGreaterThan(Integer quantite);
    
    /**
     * Recherche globale (nom, catégorie, prix)
     */
    @Query("SELECT p FROM Produit p WHERE " +
           "LOWER(p.nom) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(p.categorie.nom) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "CAST(p.prix AS string) LIKE CONCAT('%', :search, '%')")
    List<Produit> searchProduits(@Param("search") String search);
}