package com.clearstock.backend.seller;

import com.clearstock.backend.seller.dto.BecomeSellerRequest;
import com.clearstock.backend.seller.dto.SellerProfileResponse;
import com.clearstock.backend.seller.dto.UpdateSellerProfileRequest;
import com.clearstock.backend.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@Service
@RequiredArgsConstructor
public class SellerService {

    private final SellerRepository sellerRepository;

    public SellerProfileResponse becomeSeller(User user, BecomeSellerRequest request) {
        try {
            if (sellerRepository.existsByUser(user)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Seller profile already exists");
            }

            SellerProfile profile = SellerProfile.builder()
                    .user(user)
                    .businessName(request.getBusinessName())
                    .businessDescription(request.getBusinessDescription())
                    .businessLocation(request.getBusinessLocation())
                    .businessPhone(request.getBusinessPhone())
                    .businessCategory(request.getBusinessCategory())
                    .marketHub(request.getMarketHub())
                    .sellerType(request.getSellerType())
                    .verificationStatus(VerificationStatus.UNVERIFIED)
                    .build();

            return mapToResponse(sellerRepository.save(profile));
        } catch (Exception e) {
            log.error("becomeSeller failed for userId={}", user.getId(), e);
            throw e;
        }
    }

    public SellerProfileResponse getSellerProfile(User user) {
        SellerProfile profile = sellerRepository.findByUser(user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No seller profile found"));
        return mapToResponse(profile);
    }

    public SellerProfileResponse updateSellerProfile(User user, UpdateSellerProfileRequest request) {
        SellerProfile profile = sellerRepository.findByUser(user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No seller profile found"));

        if (request.getBusinessName() != null) profile.setBusinessName(request.getBusinessName());
        if (request.getBusinessDescription() != null) profile.setBusinessDescription(request.getBusinessDescription());
        if (request.getBusinessLocation() != null) profile.setBusinessLocation(request.getBusinessLocation());
        if (request.getBusinessPhone() != null) profile.setBusinessPhone(request.getBusinessPhone());
        if (request.getBusinessCategory() != null) profile.setBusinessCategory(request.getBusinessCategory());
        if (request.getMarketHub() != null) profile.setMarketHub(request.getMarketHub());

        return mapToResponse(sellerRepository.save(profile));
    }

    private SellerProfileResponse mapToResponse(SellerProfile profile) {
        return SellerProfileResponse.builder()
                .id(profile.getId())
                .userId(profile.getUser().getId())
                .businessName(profile.getBusinessName())
                .businessDescription(profile.getBusinessDescription())
                .businessLocation(profile.getBusinessLocation())
                .businessPhone(profile.getBusinessPhone())
                .businessCategory(profile.getBusinessCategory())
                .marketHub(profile.getMarketHub())
                .verificationStatus(profile.getVerificationStatus())
                .createdAt(profile.getCreatedAt())
                .build();
    }
}
