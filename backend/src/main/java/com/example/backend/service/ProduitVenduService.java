// com.example.backend.service.ProduitVenduService.java
package com.example.backend.service;

import com.example.backend.dto.request.ProduitVenduRequest;
import com.example.backend.dto.response.ProduitVenduResponse;
import com.example.backend.entity.ProduitVendu;
import com.example.backend.entity.User;
import com.example.backend.repository.ProduitVenduRepository;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProduitVenduService {

    private final ProduitVenduRepository produitVenduRepository;
    private final UserRepository userRepository; // 👤 Injection du repository User

    public List<ProduitVendu> getAllProduitsVendus() {
        return produitVenduRepository.findAll();
    }
    
    // 👤 Version avec DTO
    public List<ProduitVenduResponse> getAllProduitsVendusWithUser() {
        return produitVenduRepository.findAll().stream()
            .map(ProduitVenduResponse::new)
            .collect(Collectors.toList());
    }

    public ProduitVendu getProduitVenduById(Long id) {
        return produitVenduRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Produit vendu non trouvé avec l'ID : " + id));
    }

    @Transactional
    public ProduitVendu createProduitVendu(ProduitVenduRequest request) {
        // 👤 Récupérer l'utilisateur
        User user = userRepository.findById(request.getUserId())
            .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé avec l'ID : " + request.getUserId()));
        
        ProduitVendu produitVendu = new ProduitVendu();
        
        produitVendu.setNom(request.getNom());
        produitVendu.setPrix(request.getPrix());
        produitVendu.setQuantite(request.getQuantite());
        produitVendu.setImage(request.getImage() != null ? request.getImage() : "https://via.placeholder.com/150");
        produitVendu.setCategorie(request.getCategorie());
        produitVendu.setDateVendu(request.getDateVendu() != null ? request.getDateVendu() : LocalDate.now());
        produitVendu.setUser(user); // 👤 Association avec l'utilisateur
        produitVendu.setAttributs(request.getAttributs() != null ? request.getAttributs() : new HashMap<>());

        return produitVenduRepository.save(produitVendu);
    }

    @Transactional
    public List<ProduitVendu> createMultipleProduitsVendus(List<ProduitVenduRequest> requests) {
        // 👤 Récupérer tous les utilisateurs uniques (optimisation)
        Map<Long, User> userCache = new HashMap<>();
        
        List<ProduitVendu> produitsVendus = requests.stream()
            .map(request -> {
                // Récupérer l'utilisateur du cache ou de la BD
                User user = userCache.computeIfAbsent(request.getUserId(), 
                    id -> userRepository.findById(id)
                        .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé avec l'ID : " + id)));
                
                ProduitVendu produitVendu = new ProduitVendu();
                produitVendu.setNom(request.getNom());
                produitVendu.setPrix(request.getPrix());
                produitVendu.setQuantite(request.getQuantite());
                produitVendu.setImage(request.getImage() != null ? request.getImage() : "https://via.placeholder.com/150");
                produitVendu.setCategorie(request.getCategorie());
                produitVendu.setDateVendu(request.getDateVendu() != null ? request.getDateVendu() : LocalDate.now());
                produitVendu.setUser(user); // 👤 Association avec l'utilisateur
                produitVendu.setAttributs(request.getAttributs() != null ? request.getAttributs() : new HashMap<>());
                return produitVendu;
            })
            .toList();

        return produitVenduRepository.saveAll(produitsVendus);
    }

    @Transactional
    public ProduitVendu updateProduitVendu(Long id, ProduitVenduRequest request) {
        ProduitVendu produitVendu = getProduitVenduById(id);

        produitVendu.setNom(request.getNom());
        produitVendu.setPrix(request.getPrix());
        produitVendu.setQuantite(request.getQuantite());
        produitVendu.setImage(request.getImage());
        produitVendu.setCategorie(request.getCategorie());
        produitVendu.setDateVendu(request.getDateVendu());
        
        // 👤 Mise à jour de l'utilisateur si différent
        if (request.getUserId() != null && !request.getUserId().equals(produitVendu.getUser().getId())) {
            User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé avec l'ID : " + request.getUserId()));
            produitVendu.setUser(user);
        }
        
        produitVendu.setAttributs(request.getAttributs());

        return produitVenduRepository.save(produitVendu);
    }

    @Transactional
    public void deleteProduitVendu(Long id) {
        ProduitVendu produitVendu = getProduitVenduById(id);
        produitVenduRepository.delete(produitVendu);
    }

    public List<ProduitVendu> searchProduitsVendus(String search) {
        if (search == null || search.trim().isEmpty()) {
            return getAllProduitsVendus();
        }
        return produitVenduRepository.searchProduitsVendus(search.trim());
    }

    public List<ProduitVendu> getProduitsVendusByDate(LocalDate date) {
        return produitVenduRepository.findByDateVendu(date);
    }

    public List<ProduitVendu> getProduitsVendusBetweenDates(LocalDate debut, LocalDate fin) {
        return produitVenduRepository.findByDateVenduBetween(debut, fin);
    }
    
    // 👤 Récupérer les ventes d'un utilisateur spécifique
    public List<ProduitVendu> getProduitsVendusByUserId(Long userId) {
        return produitVenduRepository.findByUserId(userId);
    }

    public Map<String, Object> getStatistiques() {
        Map<String, Object> stats = new HashMap<>();
        
        stats.put("totalVentes", produitVenduRepository.getTotalVentes());
        stats.put("totalAujourdhui", produitVenduRepository.getTotalVentesByDate(LocalDate.now()));
        stats.put("totalVentesParCategorie", produitVenduRepository.getTotalVentesParCategorie());
        stats.put("totalVentesParVendeur", produitVenduRepository.getTotalVentesParVendeur()); // 👤 AJOUT
        stats.put("nombreProduitsVendus", produitVenduRepository.count());
        
        return stats;
    }
}