package com.clearstock.backend.otp;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface OtpRepository extends JpaRepository<OtpRecord, Long> {

    @Query("SELECT o FROM OtpRecord o WHERE o.phone = :phone AND o.otpCode = :otpCode " +
           "AND o.purpose = :purpose AND o.expiresAt > :now AND o.used = false")
    Optional<OtpRecord> findValidOtp(
            @Param("phone") String phone,
            @Param("otpCode") String otpCode,
            @Param("purpose") OtpPurpose purpose,
            @Param("now") LocalDateTime now
    );

    @Modifying
    @Transactional
    @Query("UPDATE OtpRecord o SET o.used = true WHERE o.phone = :phone AND o.purpose = :purpose AND o.used = false")
    void invalidateExistingOtps(
            @Param("phone") String phone,
            @Param("purpose") OtpPurpose purpose
    );
}
