package com.example.backend.service;

import com.example.backend.dto.request.LoginRequest;
import com.example.backend.dto.request.RegisterRequest;
import com.example.backend.dto.response.AuthResponse;
import com.example.backend.entity.User;
import com.example.backend.repository.UserRepository;
import com.example.backend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    /**
     * Enregistrement d'un nouvel utilisateur — mot de passe hashé avec BCrypt
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Cet email est déjà utilisé");
        }

        User user = new User();
        user.setNom(request.getNom());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword())); // ✅ hashé
        user.setRole("USER");
        user.setProfileImage(null);

        User savedUser = userRepository.save(user);

        String token = jwtUtil.generateToken(savedUser.getEmail());

        return new AuthResponse(
            savedUser.getId(),
            savedUser.getNom(),
            savedUser.getEmail(),
            savedUser.getRole(),
            savedUser.getProfileImage(),
            token
        );
    }

    /**
     * Connexion — vérifie le mot de passe avec BCrypt.
     * Gère aussi la migration douce des anciens mots de passe en clair :
     * si le mot de passe stocké n'est pas un hash BCrypt (ne commence pas
     * par $2a$/$2b$/$2y$), on compare en clair une dernière fois, puis on
     * le re-hash automatiquement pour la prochaine connexion.
     */
    public User loginAndGetUser(LoginRequest request) {
        
        log.info("Tentative de connexion pour: {}", request.getEmail());
        
        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new RuntimeException("Email ou mot de passe incorrect"));

        boolean passwordMatches;
        boolean isLegacyPlainPassword = !user.getPassword().startsWith("$2a$") 
                                      && !user.getPassword().startsWith("$2b$") 
                                      && !user.getPassword().startsWith("$2y$");

        if (isLegacyPlainPassword) {
            // Ancien compte avec mot de passe en clair
            passwordMatches = user.getPassword().equals(request.getPassword());
            if (passwordMatches) {
                // Migration automatique vers BCrypt
                user.setPassword(passwordEncoder.encode(request.getPassword()));
                userRepository.save(user);
                log.info("Mot de passe migré vers BCrypt pour: {}", user.getEmail());
            }
        } else {
            passwordMatches = passwordEncoder.matches(request.getPassword(), user.getPassword());
        }

        if (!passwordMatches) {
            throw new RuntimeException("Email ou mot de passe incorrect");
        }

        log.info("✅ Connexion réussie pour: {}", user.getEmail());

        return user;
    }

    public AuthResponse login(LoginRequest request) {
        User user = loginAndGetUser(request);
        String token = jwtUtil.generateToken(user.getEmail());
        
        return new AuthResponse(
            user.getId(),
            user.getNom(),
            user.getEmail(),
            user.getRole(),
            user.getProfileImage(),
            token
        );
    }
}