package com.clearstock.backend.transactions;

import com.clearstock.backend.common.ApiResponse;
import com.clearstock.backend.transactions.dto.InitiatePaymentRequest;
import com.clearstock.backend.transactions.dto.PaymentResponse;
import com.clearstock.backend.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final TransactionService transactionService;

    @PostMapping("/initiate")
    public ResponseEntity<ApiResponse<PaymentResponse>> initiatePayment(
            Authentication authentication,
            @RequestBody @Valid InitiatePaymentRequest request) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success("Payment initialized",
                transactionService.initiatePayment(user, request)));
    }

    @GetMapping("/verify/{reference}")
    public ResponseEntity<ApiResponse<PaymentResponse>> verifyPayment(
            Authentication authentication,
            @PathVariable String reference) {
        return ResponseEntity.ok(ApiResponse.success("Payment verification result",
                transactionService.verifyPayment(reference)));
    }

    @PostMapping("/webhook")
    public ResponseEntity<Void> paymentWebhook(
            @RequestHeader(value = "x-paystack-signature", required = false) String signature,
            @RequestBody String payload) {
        transactionService.handleWebhook(payload, signature);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{transactionId}")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPaymentStatus(
            Authentication authentication,
            @PathVariable Long transactionId) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(
                transactionService.getPaymentStatus(user, transactionId)));
    }
}
