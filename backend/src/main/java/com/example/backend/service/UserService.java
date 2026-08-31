package com.example.backend.service;

import com.example.backend.dto.request.UpdatePasswordRequest;
import com.example.backend.dto.request.UpdateProfileRequest;
import com.example.backend.entity.User;
import com.example.backend.repository.UserRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;

    public String register(String name, String email, String password, String image) {
        // Vérifier si l'utilisateur existe déjà
        if (userRepository.existsByEmail(email)) {
            return "Email déjà utilisé";
        }
        
        // Créer et sauvegarder l'utilisateur
        User user = new User();
        user.setNom(name);
        user.setEmail(email);
        user.setPassword(password);  // À hasher en production!
        user.setProfileImage(image);
        user.setRole("USER");
        
        userRepository.save(user);
        return "Inscription réussie";
    }

    public String login(String email, String password) {
        // Chercher l'utilisateur
        User user = userRepository.findByEmail(email)
                .orElse(null);
        
        if (user == null || !user.getPassword().equals(password)) {
            return "Email ou mot de passe incorrect";
        }
        
        return "Connexion réussie";
    }

    @Transactional
    public User updateProfile(UpdateProfileRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        user.setNom(request.getNom());
        
        return userRepository.save(user);
    }
    
    /**
     * Mettre à jour l'image de profil
     */
    @Transactional
    public User updateProfileImage(String email, String imageBase64) {
        log.info("Mise à jour de l'image pour: {}", email);
        
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        
        // Sauvegarder l'image en Base64 directement dans la BDD
        user.setProfileImage(imageBase64);
        
        User savedUser = userRepository.save(user);
        log.info("Image de profil mise à jour avec succès pour: {}", email);
        
        return savedUser;
    }

    @Transactional
    public void updatePassword(String email, UpdatePasswordRequest request) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        // Vérifier l'ancien mot de passe
        if (!user.getPassword().equals(request.getAncienMotDePasse())) {
            throw new RuntimeException("Ancien mot de passe incorrect");
        }

        // Vérifier que le nouveau est différent
        if (request.getAncienMotDePasse().equals(request.getNouveauMotDePasse())) {
            throw new RuntimeException("Le nouveau mot de passe doit être différent de l'ancien");
        }

        // Vérifier la confirmation
        if (!request.getNouveauMotDePasse().equals(request.getConfirmationMotDePasse())) {
            throw new RuntimeException("La confirmation du mot de passe ne correspond pas");
        }

        user.setPassword(request.getNouveauMotDePasse());
        userRepository.save(user);
    }
}