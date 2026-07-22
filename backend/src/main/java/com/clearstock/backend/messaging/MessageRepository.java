package com.clearstock.backend.messaging;

import com.clearstock.backend.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByConversationOrderByCreatedAtAsc(Conversation conversation);

    Optional<Message> findByIdAndSender(Long id, User sender);

    /** Most recent message, for the preview line in the inbox. */
    Optional<Message> findFirstByConversationOrderByCreatedAtDesc(Conversation conversation);

    /** Messages from the other party that this user hasn't seen yet. */
    long countByConversationAndSenderNotAndSeenFalse(Conversation conversation, User me);
}
