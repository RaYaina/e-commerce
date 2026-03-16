package com.example.backend.dto.response;

import com.example.backend.entity.User;
import lombok.Data;

@Data
public class UserResponse {
    private Long id;
    private String nom;
    private String email;
    private String role;
    private String profileImage;

    public UserResponse(User user) {
        this.id = user.getId();
        this.nom = user.getNom();
        this.email = user.getEmail();
        this.role = user.getRole();
        this.profileImage = user.getProfileImage();
    }
}