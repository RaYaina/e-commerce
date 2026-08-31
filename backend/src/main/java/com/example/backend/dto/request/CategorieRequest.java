package com.example.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategorieRequest {

    @NotBlank(message = "Le nom de la catégorie est obligatoire")
    private String nom;

    // Liste des attributs (ex: ["Taille", "Couleur", "Matériau"])
    private List<String> attributs = new ArrayList<>();
}











