// com.example.backend.entity.ProduitVendu.java
package com.example.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "produits_vendus")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ProduitVendu {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le nom du produit est obligatoire")
    @Column(nullable = false, length = 200)
    private String nom;

    @NotNull(message = "Le prix est obligatoire")
    @Positive(message = "Le prix doit être positif")
    @Column(nullable = false)
    private Double prix;

    @NotNull(message = "La quantité est obligatoire")
    @PositiveOrZero(message = "La quantité doit être positive ou zéro")
    @Column(nullable = false)
    private Integer quantite;

    @Column(length = 2000)
    private String image;

    @Column(length = 100)
    private String categorie;

    @NotNull(message = "La date de vente est obligatoire")
    @Column(nullable = false)
    private LocalDate dateVendu;

    // 👤 RELATION AVEC L'UTILISATEUR (clé étrangère)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"password", "createdAt", "updatedAt", "profileImage"})
    private User user;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
        name = "produit_vendu_attributs",
        joinColumns = @JoinColumn(name = "produit_vendu_id")
    )
    @MapKeyColumn(name = "attribut_key")
    @Column(name = "attribut_value")
    private Map<String, String> attributs = new HashMap<>();

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // Méthode utilitaire pour calculer le total
    public Double getTotal() {
        return prix * quantite;
    }
    
    // Méthode pour obtenir le nom du vendeur facilement
    public String getVendeurNom() {
        return user != null ? user.getNom() : "Inconnu";
    }
    
    // Méthode pour obtenir l'email du vendeur
    public String getVendeurEmail() {
        return user != null ? user.getEmail() : "inconnu@email.com";
    }
}