package com.clearstock.backend.transactions;

import com.clearstock.backend.common.ApiResponse;
import com.clearstock.backend.transactions.dto.*;
import com.clearstock.backend.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    @PostMapping
    public ResponseEntity<ApiResponse<TransactionResponse>> createTransaction(
            Authentication authentication,
            @RequestBody @Valid CreateTransactionRequest request) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Transaction created",
                        transactionService.createTransaction(user, request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TransactionResponse>>> getTransactions(
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(transactionService.getTransactions(user)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TransactionResponse>> getTransaction(
            Authentication authentication,
            @PathVariable Long id) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(transactionService.getTransaction(user, id)));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<TransactionResponse>> updateStatus(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody @Valid UpdateTransactionStatusRequest request) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success("Transaction status updated",
                transactionService.updateTransactionStatus(user, id, request)));
    }

    @PostMapping("/{id}/verify-otp")
    public ResponseEntity<ApiResponse<TransactionResponse>> verifyOtp(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody @Valid VerifyOtpRequest request) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success("Transaction completed",
                transactionService.verifyOtp(user, id, request)));
    }

    @PostMapping("/{id}/evidence")
    public ResponseEntity<ApiResponse<List<EvidenceResponse>>> uploadEvidence(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody @Valid UploadEvidenceRequest request) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Evidence uploaded",
                        transactionService.uploadEvidence(user, id, request)));
    }
}
