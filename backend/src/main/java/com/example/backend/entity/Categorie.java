package com.example.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "categories")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Categorie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le nom de la catégorie est obligatoire")
    @Column(nullable = false, unique = true, length = 100)
    private String nom;

    // Liste des attributs dynamiques (ex: ["Taille", "Couleur", "Matériau"])
    @ElementCollection
    @CollectionTable(name = "categorie_attributs", joinColumns = @JoinColumn(name = "categorie_id"))
    @Column(name = "attribut")
    private List<String> attributs = new ArrayList<>();

    @OneToMany(mappedBy = "categorie", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore // Éviter la boucle infinie lors de la sérialisation JSON
    private List<Produit> produits = new ArrayList<>();

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // Constructeur pour faciliter la création
    public Categorie(String nom, List<String> attributs) {
        this.nom = nom;
        this.attributs = attributs;
    }
}