package com.example.backend.service;

import com.example.backend.dto.request.LoginRequest;
import com.example.backend.dto.request.RegisterRequest;
import com.example.backend.dto.response.AuthResponse;
import com.example.backend.entity.User;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;

    /**
     * Enregistrement d'un nouvel utilisateur
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        
        // Vérifier si l'email existe déjà
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Cet email est déjà utilisé");
        }

        // Créer le nouvel utilisateur
        User user = new User();
        user.setNom(request.getNom());
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword()); // À hasher en production
        user.setRole("USER");
        user.setProfileImage(null); // Pas d'image à l'inscription

        // Sauvegarder
        User savedUser = userRepository.save(user);

        // Retourner la réponse AVEC profileImage (null au début)
        return new AuthResponse(
            savedUser.getId(),
            savedUser.getNom(),
            savedUser.getEmail(),
            savedUser.getRole(),
            savedUser.getProfileImage() // ✅ Inclure l'image (null)
        );
    }

    /**
     * Connexion d'un utilisateur (ancienne méthode - garde pour compatibilité)
     */
    public AuthResponse login(LoginRequest request) {
        User user = loginAndGetUser(request);
        
        return new AuthResponse(
            user.getId(),
            user.getNom(),
            user.getEmail(),
            user.getRole(),
            user.getProfileImage() // ✅ Inclure l'image
        );
    }
    
    /**
     * ✅ NOUVELLE MÉTHODE : Connexion et retour de l'utilisateur complet
     */
    public User loginAndGetUser(LoginRequest request) {
        
        log.info("Tentative de connexion pour: {}", request.getEmail());
        
        // Chercher l'utilisateur par email
        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new RuntimeException("Email ou mot de passe incorrect"));

        // Vérifier le mot de passe
        if (!user.getPassword().equals(request.getPassword())) {
            throw new RuntimeException("Email ou mot de passe incorrect");
        }

        log.info("✅ Connexion réussie pour: {} (Image: {})", 
                 user.getEmail(), 
                 user.getProfileImage() != null ? "Oui" : "Non");

        // Retourner l'utilisateur complet (avec image)
        return user;
    }
}