package com.clearstock.backend.transactions.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SubmitReviewRequest {

    @NotNull
    private Long transactionId;

    @NotNull
    private Long revieweeId;

    @NotNull
    @Min(1) @Max(5)
    private Integer rating;

    @Size(max = 500)
    private String comment;
}
