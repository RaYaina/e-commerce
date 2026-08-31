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
    private String profileImage;
    private String token; // ✅ NOUVEAU : le JWT à stocker côté frontend
    private String message;
    
    // Constructeur pour succès login/register (AVEC image ET token)
    public AuthResponse(Long id, String nom, String email, String role, String profileImage, String token) {
        this.id = id;
        this.nom = nom;
        this.email = email;
        this.role = role;
        this.profileImage = profileImage;
        this.token = token;
        this.message = "Authentification réussie";
    }
    
    // Constructeur de compatibilité (sans token - déprécié, à ne plus utiliser)
    public AuthResponse(Long id, String nom, String email, String role, String profileImage) {
        this(id, nom, email, role, profileImage, null);
    }
}