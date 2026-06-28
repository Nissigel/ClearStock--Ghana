package com.clearstock.backend.listings;

import com.clearstock.backend.common.ApiResponse;
import com.clearstock.backend.listings.dto.CreateDealAlertRequest;
import com.clearstock.backend.listings.dto.DealAlertResponse;
import com.clearstock.backend.listings.dto.UpdateDealAlertRequest;
import com.clearstock.backend.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/deal-alerts")
@RequiredArgsConstructor
public class DealAlertController {

    private final DealAlertService dealAlertService;

    @PostMapping
    public ResponseEntity<ApiResponse<DealAlertResponse>> createAlert(
            Authentication authentication,
            @RequestBody CreateDealAlertRequest request) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Deal alert created", dealAlertService.createAlert(user, request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<DealAlertResponse>>> getAlerts(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(dealAlertService.getBuyerAlerts(user)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DealAlertResponse>> updateAlert(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody UpdateDealAlertRequest request) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success("Deal alert updated", dealAlertService.updateAlert(user, id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAlert(
            Authentication authentication,
            @PathVariable Long id) {
        User user = (User) authentication.getPrincipal();
        dealAlertService.deleteAlert(user, id);
        return ResponseEntity.ok(ApiResponse.success("Deal alert deactivated", null));
    }
}
