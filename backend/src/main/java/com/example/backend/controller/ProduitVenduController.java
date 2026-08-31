// com.example.backend.controller.ProduitVenduController.java
package com.example.backend.controller;

import com.example.backend.dto.request.ProduitVenduRequest;
import com.example.backend.dto.response.MessageResponse;
import com.example.backend.dto.response.ProduitVenduResponse;
import com.example.backend.entity.ProduitVendu;
import com.example.backend.service.ProduitVenduService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/produits-vendus")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class ProduitVenduController {

    private final ProduitVenduService produitVenduService;

    /**
     * GET /api/produits-vendus
     * Récupérer tous les produits vendus avec infos utilisateur
     */
    @GetMapping
    public ResponseEntity<List<ProduitVenduResponse>> getAllProduitsVendus() {
        List<ProduitVendu> produitsVendus = produitVenduService.getAllProduitsVendus();
        List<ProduitVenduResponse> response = produitsVendus.stream()
            .map(ProduitVenduResponse::new)
            .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/produits-vendus/{id}
     * Récupérer un produit vendu par ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getProduitVenduById(@PathVariable Long id) {
        try {
            ProduitVendu produitVendu = produitVenduService.getProduitVenduById(id);
            return ResponseEntity.ok(new ProduitVenduResponse(produitVendu));
        } catch (RuntimeException e) {
            return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(new MessageResponse(e.getMessage()));
        }
    }

    /**
     * POST /api/produits-vendus
     * Créer un nouveau produit vendu
     */
    @PostMapping
    public ResponseEntity<?> createProduitVendu(@Valid @RequestBody ProduitVenduRequest request) {
        try {
            ProduitVendu produitVendu = produitVenduService.createProduitVendu(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(new ProduitVenduResponse(produitVendu));
        } catch (RuntimeException e) {
            return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new MessageResponse(e.getMessage()));
        }
    }

    /**
     * POST /api/produits-vendus/multiple
     * Créer plusieurs produits vendus (pour les ventes multiples)
     */
    @PostMapping("/multiple")
    public ResponseEntity<?> createMultipleProduitsVendus(@Valid @RequestBody List<ProduitVenduRequest> requests) {
        try {
            List<ProduitVendu> produitsVendus = produitVenduService.createMultipleProduitsVendus(requests);
            List<ProduitVenduResponse> response = produitsVendus.stream()
                .map(ProduitVenduResponse::new)
                .collect(Collectors.toList());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new MessageResponse(e.getMessage()));
        }
    }

    /**
     * PUT /api/produits-vendus/{id}
     * Mettre à jour un produit vendu
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateProduitVendu(
            @PathVariable Long id,
            @Valid @RequestBody ProduitVenduRequest request) {
        try {
            ProduitVendu produitVendu = produitVenduService.updateProduitVendu(id, request);
            return ResponseEntity.ok(new ProduitVenduResponse(produitVendu));
        } catch (RuntimeException e) {
            return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new MessageResponse(e.getMessage()));
        }
    }

    /**
     * DELETE /api/produits-vendus/{id}
     * Supprimer un produit vendu
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<MessageResponse> deleteProduitVendu(@PathVariable Long id) {
        try {
            produitVenduService.deleteProduitVendu(id);
            return ResponseEntity.ok(new MessageResponse("Produit vendu supprimé avec succès"));
        } catch (RuntimeException e) {
            return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(new MessageResponse(e.getMessage()));
        }
    }

    /**
     * GET /api/produits-vendus/search?q=...
     * Rechercher des produits vendus
     */
    @GetMapping("/search")
    public ResponseEntity<List<ProduitVenduResponse>> searchProduitsVendus(@RequestParam(required = false) String q) {
        List<ProduitVendu> produitsVendus = produitVenduService.searchProduitsVendus(q);
        List<ProduitVenduResponse> response = produitsVendus.stream()
            .map(ProduitVenduResponse::new)
            .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/produits-vendus/date/{date}
     * Récupérer les produits vendus par date
     */
    @GetMapping("/date/{date}")
    public ResponseEntity<?> getProduitsVendusByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        try {
            List<ProduitVendu> produitsVendus = produitVenduService.getProduitsVendusByDate(date);
            List<ProduitVenduResponse> response = produitsVendus.stream()
                .map(ProduitVenduResponse::new)
                .collect(Collectors.toList());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(new MessageResponse(e.getMessage()));
        }
    }

    /**
     * GET /api/produits-vendus/period?debut=...&fin=...
     * Récupérer les produits vendus entre deux dates
     */
    @GetMapping("/period")
    public ResponseEntity<?> getProduitsVendusBetweenDates(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate debut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fin) {
        try {
            List<ProduitVendu> produitsVendus = produitVenduService.getProduitsVendusBetweenDates(debut, fin);
            List<ProduitVenduResponse> response = produitsVendus.stream()
                .map(ProduitVenduResponse::new)
                .collect(Collectors.toList());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(new MessageResponse(e.getMessage()));
        }
    }
    
    /**
     * GET /api/produits-vendus/user/{userId}
     * Récupérer les produits vendus par un utilisateur spécifique
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getProduitsVendusByUserId(@PathVariable Long userId) {
        try {
            List<ProduitVendu> produitsVendus = produitVenduService.getProduitsVendusByUserId(userId);
            List<ProduitVenduResponse> response = produitsVendus.stream()
                .map(ProduitVenduResponse::new)
                .collect(Collectors.toList());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(new MessageResponse(e.getMessage()));
        }
    }

    /**
     * GET /api/produits-vendus/statistiques
     * Récupérer les statistiques des ventes
     */
    @GetMapping("/statistiques")
    public ResponseEntity<Map<String, Object>> getStatistiques() {
        Map<String, Object> stats = produitVenduService.getStatistiques();
        return ResponseEntity.ok(stats);
    }
}