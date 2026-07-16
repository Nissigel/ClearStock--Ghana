package com.clearstock.backend.reports;

import com.clearstock.backend.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {

    List<Report> findByReporterOrderByCreatedAtDesc(User reporter);

    /** Complaints made *about* a user — used for their conduct history. */
    List<Report> findByReportedUserOrderByCreatedAtDesc(User reportedUser);
}
