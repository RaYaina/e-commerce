package com.example.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdatePasswordRequest {
    
    @NotBlank(message = "L'ancien mot de passe est requis")
    private String ancienMotDePasse;
    
    @NotBlank(message = "Le nouveau mot de passe est requis")
    @Size(min = 6, message = "Le nouveau mot de passe doit contenir au moins 6 caractères")
    private String nouveauMotDePasse;
    
    @NotBlank(message = "La confirmation du mot de passe est requise")
    private String confirmationMotDePasse;
}