package com.example.backend.repository;

import com.example.backend.entity.Categorie;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CategorieRepository extends JpaRepository<Categorie, Long> {
    
    /**
     * Trouver une catégorie par nom
     */
    Optional<Categorie> findByNom(String nom);
    
    /**
     * Vérifier si une catégorie existe par nom
     */
    Boolean existsByNom(String nom);
}
