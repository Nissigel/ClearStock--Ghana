package com.clearstock.backend.admin;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Writes audit entries. Failures here are logged and swallowed: losing an
 * audit line is bad, but failing the admin's actual action because the log
 * write failed would be worse.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public void record(Admin admin, AuditAction action, String targetType,
                       Long targetId, String targetLabel, String note) {
        try {
            auditLogRepository.save(AuditLog.builder()
                    .admin(admin)
                    .action(action)
                    .targetType(targetType)
                    .targetId(targetId)
                    .targetLabel(targetLabel)
                    .note(note)
                    .build());
        } catch (Exception e) {
            log.error("Failed to write audit log: {} {} {}", action, targetType, targetId, e);
        }
    }
}
