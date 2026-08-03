package com.clearstock.backend.admin.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AdminReviewResponse {
    private Long id;
    private Integer rating;
    private String comment;
    private String reviewerName;
    private String revieweeName;
    private Long revieweeUserId;
    private Long reviewerUserId;
    // Contact details for both parties, so an admin can reach out over a review.
    private String reviewerPhone;
    private String reviewerEmail;
    private String revieweePhone;
    private String revieweeEmail;
    private String listingTitle;
    private LocalDateTime createdAt;
}
