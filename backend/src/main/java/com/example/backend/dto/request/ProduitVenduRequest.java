// com.example.backend.dto.request.ProduitVenduRequest.java
package com.example.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProduitVenduRequest {

    @NotBlank(message = "Le nom du produit est obligatoire")
    private String nom;

    @NotNull(message = "Le prix est obligatoire")
    @Positive(message = "Le prix doit être positif")
    private Double prix;

    @NotNull(message = "La quantité est obligatoire")
    @PositiveOrZero(message = "La quantité doit être positive ou zéro")
    private Integer quantite;

    private String image;

    private String categorie;

    @NotNull(message = "La date de vente est obligatoire")
    private LocalDate dateVendu;

    // 👤 ID DE L'UTILISATEUR (clé étrangère)
    @NotNull(message = "L'ID utilisateur est obligatoire")
    private Long userId;

    private Map<String, String> attributs = new HashMap<>();
}