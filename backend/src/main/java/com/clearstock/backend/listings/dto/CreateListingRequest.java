package com.clearstock.backend.listings.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class CreateListingRequest {

    @NotBlank(message = "Product name is required")
    private String productName;

    @NotBlank(message = "Category is required")
    private String category;

    private String description;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;

    @NotBlank(message = "Unit of measurement is required")
    private String unitOfMeasurement;

    @NotNull(message = "Original price is required")
    @DecimalMin(value = "0.01", message = "Price must be positive")
    private BigDecimal originalPrice;

    private boolean expirySensitive = false;

    private boolean isDiscountActive = false;

    private LocalDate expiryDate;

    private LocalDate clearanceEndDate;

    @DecimalMin(value = "0.01", message = "Manual discount must be positive")
    @DecimalMax(value = "100.00", message = "Manual discount cannot exceed 100%")
    private BigDecimal manualDiscountPercent;

    @DecimalMin(value = "0.01", message = "Discount step must be positive")
    @DecimalMax(value = "100.00", message = "Discount step cannot exceed 100%")
    private BigDecimal discountStepPercent;

    @Min(value = 1, message = "Discount interval must be at least 1 day")
    private Integer discountIntervalDays;

    @DecimalMin(value = "0.01", message = "Minimum acceptable price must be positive")
    private BigDecimal minimumAcceptablePrice;

    @NotEmpty(message = "At least one image is required")
    @Size(min = 1, max = 5, message = "Must provide between 1 and 5 images")
    private List<String> images;
}
