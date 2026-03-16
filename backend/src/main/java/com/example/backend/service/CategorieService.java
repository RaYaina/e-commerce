package com.example.backend.service;

import com.example.backend.dto.request.CategorieRequest;
import com.example.backend.entity.Categorie;
import com.example.backend.repository.CategorieRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategorieService {

    private final CategorieRepository categorieRepository;

    /**
     * Récupérer toutes les catégories
     */
    public List<Categorie> getAllCategories() {
        return categorieRepository.findAll();
    }

    /**
     * Récupérer une catégorie par ID
     */
    public Categorie getCategorieById(Long id) {
        return categorieRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Catégorie non trouvée avec l'ID : " + id));
    }

    /**
     * Créer une nouvelle catégorie
     */
    @Transactional
    public Categorie createCategorie(CategorieRequest request) {
        // Vérifier si la catégorie existe déjà
        if (categorieRepository.existsByNom(request.getNom())) {
            throw new RuntimeException("Une catégorie avec ce nom existe déjà : " + request.getNom());
        }

        Categorie categorie = new Categorie();
        categorie.setNom(request.getNom());
        categorie.setAttributs(request.getAttributs());

        return categorieRepository.save(categorie);
    }

    /**
     * Mettre à jour une catégorie
     */
    @Transactional
    public Categorie updateCategorie(Long id, CategorieRequest request) {
        Categorie categorie = getCategorieById(id);

        // Vérifier si le nouveau nom n'est pas déjà utilisé par une autre catégorie
        if (!categorie.getNom().equals(request.getNom()) && categorieRepository.existsByNom(request.getNom())) {
            throw new RuntimeException("Une catégorie avec ce nom existe déjà : " + request.getNom());
        }

        categorie.setNom(request.getNom());
        categorie.setAttributs(request.getAttributs());

        return categorieRepository.save(categorie);
    }

    /**
     * Supprimer une catégorie
     */
    @Transactional
    public void deleteCategorie(Long id) {
        Categorie categorie = getCategorieById(id);
        
        // Vérifier si des produits utilisent cette catégorie
        if (!categorie.getProduits().isEmpty()) {
            throw new RuntimeException("Impossible de supprimer cette catégorie car elle contient " + 
                                     categorie.getProduits().size() + " produit(s)");
        }
        
        categorieRepository.delete(categorie);
    }
}