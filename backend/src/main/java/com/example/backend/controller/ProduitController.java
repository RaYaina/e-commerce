package com.example.backend.controller;

import com.example.backend.dto.request.ProduitRequest;
import com.example.backend.dto.response.MessageResponse;
import com.example.backend.entity.Produit;
import com.example.backend.service.ProduitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/produits")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class ProduitController {

    private final ProduitService produitService;

    /**
     * GET /api/produits
     * Récupérer tous les produits
     */
    @GetMapping
    public ResponseEntity<List<Produit>> getAllProduits() {
        List<Produit> produits = produitService.getAllProduits();
        return ResponseEntity.ok(produits);
    }

    /**
     * GET /api/produits/{id}
     * Récupérer un produit par ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getProduitById(@PathVariable Long id) {
        try {
            Produit produit = produitService.getProduitById(id);
            return ResponseEntity.ok(produit);
        } catch (RuntimeException e) {
            return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(new MessageResponse(e.getMessage()));
        }
    }

    /**
     * POST /api/produits
     * Créer un nouveau produit
     */
    @PostMapping
    public ResponseEntity<?> createProduit(@Valid @RequestBody ProduitRequest request) {
        try {
            Produit produit = produitService.createProduit(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(produit);
        } catch (RuntimeException e) {
            return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new MessageResponse(e.getMessage()));
        }
    }

    /**
     * PUT /api/produits/{id}
     * Mettre à jour un produit
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateProduit(
            @PathVariable Long id,
            @Valid @RequestBody ProduitRequest request) {
        try {
            Produit produit = produitService.updateProduit(id, request);
            return ResponseEntity.ok(produit);
        } catch (RuntimeException e) {
            return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new MessageResponse(e.getMessage()));
        }
    }

    /**
     * DELETE /api/produits/{id}
     * Supprimer un produit
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<MessageResponse> deleteProduit(@PathVariable Long id) {
        try {
            produitService.deleteProduit(id);
            return ResponseEntity.ok(new MessageResponse("Produit supprimé avec succès"));
        } catch (RuntimeException e) {
            return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(new MessageResponse(e.getMessage()));
        }
    }

    /**
     * GET /api/produits/search?q=...
     * Rechercher des produits
     */
    @GetMapping("/search")
    public ResponseEntity<List<Produit>> searchProduits(@RequestParam(required = false) String q) {
        List<Produit> produits = produitService.searchProduits(q);
        return ResponseEntity.ok(produits);
    }

    /**
     * GET /api/produits/categorie/{categorieId}
     * Récupérer les produits d'une catégorie
     */
    @GetMapping("/categorie/{categorieId}")
    public ResponseEntity<?> getProduitsByCategorie(@PathVariable Long categorieId) {
        try {
            List<Produit> produits = produitService.getProduitsByCategorie(categorieId);
            return ResponseEntity.ok(produits);
        } catch (RuntimeException e) {
            return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(new MessageResponse(e.getMessage()));
        }
    }

    /**
     * GET /api/produits/stock
     * Récupérer les produits en stock
     */
    @GetMapping("/stock")
    public ResponseEntity<List<Produit>> getProduitsEnStock() {
        List<Produit> produits = produitService.getProduitsEnStock();
        return ResponseEntity.ok(produits);
    }
}