// com.example.backend.repository.ProduitVenduRepository.java
package com.example.backend.repository;

import com.example.backend.entity.ProduitVendu;
import com.example.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ProduitVenduRepository extends JpaRepository<ProduitVendu, Long> {
    
    List<ProduitVendu> findByCategorie(String categorie);
    
    List<ProduitVendu> findByDateVendu(LocalDate date);
    
    List<ProduitVendu> findByDateVenduBetween(LocalDate debut, LocalDate fin);
    
    List<ProduitVendu> findByNomContainingIgnoreCase(String nom);
    
    // 👤 Recherche par utilisateur
    List<ProduitVendu> findByUser(User user);
    
    // 👤 Recherche par ID utilisateur
    @Query("SELECT p FROM ProduitVendu p WHERE p.user.id = :userId")
    List<ProduitVendu> findByUserId(@Param("userId") Long userId);
    
    // Recherche globale
    @Query("SELECT p FROM ProduitVendu p WHERE " +
           "LOWER(p.nom) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(p.categorie) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(CAST(p.prix AS string)) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(CAST(p.quantite AS string)) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(p.user.nom) LIKE LOWER(CONCAT('%', :search, '%')) OR " + // 👤 Recherche par nom vendeur
           "LOWER(p.user.email) LIKE LOWER(CONCAT('%', :search, '%'))")   // 👤 Recherche par email vendeur
    List<ProduitVendu> searchProduitsVendus(@Param("search") String search);
    
    // Statistiques
    @Query("SELECT SUM(p.prix * p.quantite) FROM ProduitVendu p")
    Double getTotalVentes();
    
    @Query("SELECT SUM(p.prix * p.quantite) FROM ProduitVendu p WHERE p.dateVendu = :date")
    Double getTotalVentesByDate(@Param("date") LocalDate date);
    
    @Query("SELECT p.categorie, SUM(p.prix * p.quantite) FROM ProduitVendu p GROUP BY p.categorie")
    List<Object[]> getTotalVentesParCategorie();
    
    // 👤 Statistiques par utilisateur
    @Query("SELECT p.user.nom, SUM(p.prix * p.quantite) FROM ProduitVendu p GROUP BY p.user.nom")
    List<Object[]> getTotalVentesParVendeur();
}