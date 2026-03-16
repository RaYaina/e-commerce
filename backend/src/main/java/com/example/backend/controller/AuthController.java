package com.example.backend.controller;

import com.example.backend.dto.request.LoginRequest;
import com.example.backend.dto.request.RegisterRequest;
import com.example.backend.dto.response.AuthResponse;
import com.example.backend.dto.response.MessageResponse;
import com.example.backend.entity.User;
import com.example.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class AuthController {

    private final AuthService authService;

    /**
     * POST /api/auth/register
     * Inscription d'un nouvel utilisateur
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            AuthResponse response = authService.register(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new MessageResponse(e.getMessage()));
        }
    }

    /**
     * POST /api/auth/login
     * Connexion d'un utilisateur
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            // ✅ Récupérer l'utilisateur complet (avec image)
            User user = authService.loginAndGetUser(request);
            
            // ✅ Construire la réponse avec TOUTES les infos
            AuthResponse response = new AuthResponse(
                user.getId(),
                user.getNom(),
                user.getEmail(),
                user.getRole(),
                user.getProfileImage() // ← IMPORTANT : Ajouter l'image
            );
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(new MessageResponse(e.getMessage()));
        }
    }

    /**
     * GET /api/auth/test
     * Endpoint de test pour vérifier que l'API fonctionne
     */
    @GetMapping("/test")
    public ResponseEntity<MessageResponse> test() {
        return ResponseEntity.ok(new MessageResponse("API Auth fonctionne !"));
    }
}