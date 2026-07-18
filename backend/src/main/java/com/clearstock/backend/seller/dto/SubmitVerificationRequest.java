package com.clearstock.backend.seller.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Documents a seller submits to be verified.
 *
 * Kept separate from the profile update: editing a shop's name shouldn't send
 * it back for review, and submitting identity documents shouldn't be able to
 * quietly change the business details behind them.
 */
@Data
public class SubmitVerificationRequest {

    @NotBlank(message = "Ghana Card number is required")
    private String ghanaCardNumber;

    @NotBlank(message = "A photo of your Ghana Card is required")
    private String ghanaCardPhotoUrl;

    /** Only businesses have one — individuals leave it empty. */
    private String businessRegUrl;
}
