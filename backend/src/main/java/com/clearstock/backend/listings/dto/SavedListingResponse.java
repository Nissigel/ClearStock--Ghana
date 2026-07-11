package com.clearstock.backend.listings.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class SavedListingResponse {

    private Long id;
    private ListingResponse listing;
    private LocalDateTime savedAt;
}
