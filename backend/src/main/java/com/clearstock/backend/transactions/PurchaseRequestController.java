package com.clearstock.backend.transactions;

import com.clearstock.backend.common.ApiResponse;
import com.clearstock.backend.transactions.dto.CreatePurchaseRequestRequest;
import com.clearstock.backend.transactions.dto.PurchaseRequestResponse;
import com.clearstock.backend.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/purchase-requests")
@RequiredArgsConstructor
public class PurchaseRequestController {

    private final PurchaseRequestService purchaseRequestService;

    @PostMapping
    public ResponseEntity<ApiResponse<PurchaseRequestResponse>> createPurchaseRequest(
            Authentication authentication,
            @RequestBody @Valid CreatePurchaseRequestRequest request) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Purchase request submitted",
                        purchaseRequestService.createPurchaseRequest(user, request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PurchaseRequestResponse>>> getBuyerRequests(
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(purchaseRequestService.getBuyerRequests(user)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PurchaseRequestResponse>> getPurchaseRequest(
            Authentication authentication,
            @PathVariable Long id) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(purchaseRequestService.getPurchaseRequest(user, id)));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<PurchaseRequestResponse>> cancelPurchaseRequest(
            Authentication authentication,
            @PathVariable Long id) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success("Purchase request cancelled",
                purchaseRequestService.cancelPurchaseRequest(user, id)));
    }

    @GetMapping("/incoming")
    public ResponseEntity<ApiResponse<List<PurchaseRequestResponse>>> getSellerRequests(
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(purchaseRequestService.getSellerRequests(user)));
    }

    @PutMapping("/{id}/decline")
    public ResponseEntity<ApiResponse<PurchaseRequestResponse>> declinePurchaseRequest(
            Authentication authentication,
            @PathVariable Long id) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success("Purchase request declined",
                purchaseRequestService.declinePurchaseRequest(user, id)));
    }
}
