package com.example.backend.controller;

import com.example.backend.dto.request.CategorieRequest;
import com.example.backend.dto.response.MessageResponse;
import com.example.backend.entity.Categorie;
import com.example.backend.service.CategorieService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class CategorieController {

    private final CategorieService categorieService;

    /**
     * GET /api/categories
     * Récupérer toutes les catégories
     */
    @GetMapping
    public ResponseEntity<List<Categorie>> getAllCategories() {
        List<Categorie> categories = categorieService.getAllCategories();
        return ResponseEntity.ok(categories);
    }

    /**
     * GET /api/categories/{id}
     * Récupérer une catégorie par ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getCategorieById(@PathVariable Long id) {
        try {
            Categorie categorie = categorieService.getCategorieById(id);
            return ResponseEntity.ok(categorie);
        } catch (RuntimeException e) {
            return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(new MessageResponse(e.getMessage()));
        }
    }

    /**
     * POST /api/categories
     * Créer une nouvelle catégorie
     */
    @PostMapping
    public ResponseEntity<?> createCategorie(@Valid @RequestBody CategorieRequest request) {
        try {
            Categorie categorie = categorieService.createCategorie(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(categorie);
        } catch (RuntimeException e) {
            return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new MessageResponse(e.getMessage()));
        }
    }

    /**
     * PUT /api/categories/{id}
     * Mettre à jour une catégorie
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateCategorie(
            @PathVariable Long id,
            @Valid @RequestBody CategorieRequest request) {
        try {
            Categorie categorie = categorieService.updateCategorie(id, request);
            return ResponseEntity.ok(categorie);
        } catch (RuntimeException e) {
            return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new MessageResponse(e.getMessage()));
        }
    }

    /**
     * DELETE /api/categories/{id}
     * Supprimer une catégorie
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<MessageResponse> deleteCategorie(@PathVariable Long id) {
        try {
            categorieService.deleteCategorie(id);
            return ResponseEntity.ok(new MessageResponse("Catégorie supprimée avec succès"));
        } catch (RuntimeException e) {
            return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new MessageResponse(e.getMessage()));
        }
    }
}