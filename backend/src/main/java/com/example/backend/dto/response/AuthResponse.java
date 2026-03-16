package com.example.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    
    private Long id;
    private String nom;
    private String email;
    private String role;
    private String profileImage; // ✅ AJOUTER CE CHAMP
    private String message;
    
    // Constructeur pour succès login/register (AVEC image)
    public AuthResponse(Long id, String nom, String email, String role, String profileImage) {
        this.id = id;
        this.nom = nom;
        this.email = email;
        this.role = role;
        this.profileImage = profileImage; // ✅ AJOUTER
        this.message = "Authentification réussie";
    }
    
    // Constructeur pour compatibilité (SANS image - déprécié)
    public AuthResponse(Long id, String nom, String email, String role) {
        this(id, nom, email, role, null);
    }
}