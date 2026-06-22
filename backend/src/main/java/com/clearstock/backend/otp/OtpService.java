package com.clearstock.backend.otp;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class OtpService {

    private final OtpRepository otpRepository;
    private final Random random = new Random();

    @Transactional
    public String generateAndSaveOtp(String phone, OtpPurpose purpose) {
        otpRepository.invalidateExistingOtps(phone, purpose);

        String otp = String.format("%06d", random.nextInt(1_000_000));

        OtpRecord record = OtpRecord.builder()
                .phone(phone)
                .otpCode(otp)
                .purpose(purpose)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .used(false)
                .createdAt(LocalDateTime.now())
                .build();

        otpRepository.save(record);
        return otp;
    }

    @Transactional
    public boolean verifyOtp(String phone, String otp, OtpPurpose purpose) {
        return otpRepository.findValidOtp(phone, otp, purpose, LocalDateTime.now())
                .map(record -> {
                    record.setUsed(true);
                    otpRepository.save(record);
                    return true;
                })
                .orElse(false);
    }
}
