package com.example.backend.controller;

import com.example.backend.dto.request.UpdateProfileRequest;
import com.example.backend.dto.request.UpdatePasswordRequest;
import com.example.backend.dto.response.MessageResponse;
import com.example.backend.dto.response.UserResponse;
import com.example.backend.entity.User;
import com.example.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
@Slf4j
public class UserController {

    private final UserService userService;
    
    // Dossier où les images seront stockées
    private static final String UPLOAD_DIR = "uploads/profiles/";

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        log.info("Mise à jour du profil pour l'email: {}", request.getEmail());
        
        try {
            User updatedUser = userService.updateProfile(request);
            return ResponseEntity.ok(new UserResponse(updatedUser));
        } catch (RuntimeException e) {
            log.error("Erreur: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(new MessageResponse(e.getMessage()));
        }
    }
    
    /**
     * Upload de l'image de profil (Base64)
     * Appelé depuis le frontend avec l'image en Base64
     */
    @PutMapping("/profile-image")
    public ResponseEntity<?> updateProfileImage(
            @RequestHeader(value = "X-User-Email", required = true) String email,
            @RequestBody ProfileImageRequest request) {
        
        log.info("Mise à jour de l'image de profil pour: {}", email);
        
        try {
            User updatedUser = userService.updateProfileImage(email, request.getImageBase64());
            return ResponseEntity.ok(new UserResponse(updatedUser));
        } catch (RuntimeException e) {
            log.error("Erreur: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(new MessageResponse(e.getMessage()));
        }
    }
    
    /**
     * Alternative : Upload de fichier image (si vous préférez les fichiers)
     * Note: Pour l'instant, on utilise Base64 qui est plus simple
     */
    @PostMapping("/upload-profile-image")
    public ResponseEntity<?> uploadProfileImage(
            @RequestHeader(value = "X-User-Email", required = true) String email,
            @RequestParam("file") MultipartFile file) {
        
        log.info("Upload d'image de profil pour: {}", email);
        
        try {
            // Vérifier que c'est bien une image
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest()
                    .body(new MessageResponse("Le fichier doit être une image"));
            }
            
            // Créer le dossier s'il n'existe pas
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            
            // Générer un nom unique pour l'image
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".") 
                ? originalFilename.substring(originalFilename.lastIndexOf("."))
                : ".jpg";
            String filename = UUID.randomUUID().toString() + extension;
            
            // Sauvegarder le fichier
            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            
            // URL de l'image (relative)
            String imageUrl = "/uploads/profiles/" + filename;
            
            // Mettre à jour l'utilisateur
            User updatedUser = userService.updateProfileImage(email, imageUrl);
            
            return ResponseEntity.ok(new UserResponse(updatedUser));
            
        } catch (IOException e) {
            log.error("Erreur lors de l'upload: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Erreur lors de l'upload de l'image"));
        } catch (RuntimeException e) {
            log.error("Erreur: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(new MessageResponse(e.getMessage()));
        }
    }
    
    @PutMapping("/update-password")
    public ResponseEntity<MessageResponse> updatePassword(
            @RequestHeader(value = "X-User-Email", required = true) String email,
            @Valid @RequestBody UpdatePasswordRequest request) {
        
        log.info("Mise à jour du mot de passe pour: {}", email);
        
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Email requis dans header X-User-Email"));
        }
        
        try {
            userService.updatePassword(email, request);
            return ResponseEntity.ok(new MessageResponse("Mot de passe mis à jour avec succès"));
        } catch (RuntimeException e) {
            log.error("Erreur: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(new MessageResponse(e.getMessage()));
        }
    }
    
    // DTO pour l'image en Base64
    public static class ProfileImageRequest {
        private String imageBase64;
        
        public String getImageBase64() {
            return imageBase64;
        }
        
        public void setImageBase64(String imageBase64) {
            this.imageBase64 = imageBase64;
        }
    }
}