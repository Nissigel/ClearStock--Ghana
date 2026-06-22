package com.clearstock.backend.listings.dto;

import com.clearstock.backend.listings.ListingStatus;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class UpdateListingRequest {

    private String productName;

    private String category;

    private String description;

    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;

    private String unitOfMeasurement;

    @DecimalMin(value = "0.01", message = "Price must be positive")
    private BigDecimal currentPrice;

    private Boolean expirySensitive;

    private LocalDate expiryDate;

    private LocalDate clearanceEndDate;

    @DecimalMin(value = "0.01", message = "Discount step must be positive")
    @DecimalMax(value = "100.00", message = "Discount step cannot exceed 100%")
    private BigDecimal discountStepPercent;

    @Min(value = 1, message = "Discount interval must be at least 1 day")
    private Integer discountIntervalDays;

    @DecimalMin(value = "0.01", message = "Minimum acceptable price must be positive")
    private BigDecimal minimumAcceptablePrice;

    @Size(min = 1, max = 5, message = "Must provide between 1 and 5 images")
    private List<String> images;

    private ListingStatus listingStatus;
}
