package com.clearstock.backend.listings;

import com.clearstock.backend.seller.SellerProfile;
import com.clearstock.backend.seller.VerificationStatus;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class ListingSpecification {

    public static Specification<Listing> withFilters(
            String search, String category, String region, String cityTown,
            BigDecimal minPrice, BigDecimal maxPrice, VerificationStatus verificationStatus) {

        return (root, query, cb) -> {
            query.distinct(true);
            query.orderBy(cb.desc(root.get("urgencyScore")));
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("listingStatus"), ListingStatus.ACTIVE));

            // Hide anything past its due date straight away, without waiting for
            // the sweep that flips it to EXPIRED — the free-tier server sleeps
            // and can miss that sweep, and buyers should never see a sale that
            // has already ended. "Due" means the expiry date has passed
            // (perishable stock) or the clearance sale has ended (everything
            // else); a listing with neither date set never expires this way.
            LocalDate today = LocalDate.now();
            predicates.add(cb.or(
                    cb.isNull(root.get("expiryDate")),
                    cb.greaterThanOrEqualTo(root.<LocalDate>get("expiryDate"), today)));
            predicates.add(cb.or(
                    cb.isNull(root.get("clearanceEndDate")),
                    cb.greaterThanOrEqualTo(root.<LocalDate>get("clearanceEndDate"), today)));

            Join<Listing, SellerProfile> seller = root.join("seller", JoinType.INNER);

            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("productName")), pattern),
                        cb.like(cb.lower(root.get("description")), pattern)
                ));
            }
            if (category != null && !category.isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("category")), category.toLowerCase()));
            }
            if (region != null && !region.isBlank()) {
                predicates.add(cb.like(cb.lower(seller.get("businessLocation")),
                        "%" + region.toLowerCase() + "%"));
            }
            if (cityTown != null && !cityTown.isBlank()) {
                predicates.add(cb.like(cb.lower(seller.get("businessLocation")),
                        "%" + cityTown.toLowerCase() + "%"));
            }
            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("currentPrice"), minPrice));
            }
            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("currentPrice"), maxPrice));
            }
            if (verificationStatus != null) {
                predicates.add(cb.equal(seller.get("verificationStatus"), verificationStatus));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
