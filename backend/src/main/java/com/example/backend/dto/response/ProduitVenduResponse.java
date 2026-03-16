// com.example.backend.dto.response.ProduitVenduResponse.java
package com.example.backend.dto.response;

import com.example.backend.entity.ProduitVendu;
import lombok.Data;

import java.time.LocalDate;
import java.util.Map;

@Data
public class ProduitVenduResponse {
    private Long id;
    private String nom;
    private Double prix;
    private Integer quantite;
    private String image;
    private String categorie;
    private LocalDate dateVendu;
    private Map<String, String> attributs;
    
    // 👤 Inclure l'objet user complet
    private UserResponse user;  // ← Changement important !

    public ProduitVenduResponse(ProduitVendu produitVendu) {
        this.id = produitVendu.getId();
        this.nom = produitVendu.getNom();
        this.prix = produitVendu.getPrix();
        this.quantite = produitVendu.getQuantite();
        this.image = produitVendu.getImage();
        this.categorie = produitVendu.getCategorie();
        this.dateVendu = produitVendu.getDateVendu();
        this.attributs = produitVendu.getAttributs();
        
        // 👤 Inclure l'utilisateur complet
        if (produitVendu.getUser() != null) {
            this.user = new UserResponse(produitVendu.getUser());
        }
    }
}