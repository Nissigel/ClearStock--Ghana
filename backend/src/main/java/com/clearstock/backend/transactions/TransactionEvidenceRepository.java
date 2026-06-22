package com.clearstock.backend.transactions;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionEvidenceRepository extends JpaRepository<TransactionEvidence, Long> {

    List<TransactionEvidence> findByTransactionOrderByCreatedAtAsc(Transaction transaction);
}
