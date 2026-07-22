package com.clearstock.backend.messaging;

import com.clearstock.backend.common.ApiResponse;
import com.clearstock.backend.messaging.dto.ConversationResponse;
import com.clearstock.backend.messaging.dto.MessageResponse;
import com.clearstock.backend.messaging.dto.SendMessageRequest;
import com.clearstock.backend.messaging.dto.StartConversationRequest;
import com.clearstock.backend.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class MessagingController {

    private final MessagingService messagingService;

    @PostMapping("/conversations")
    public ResponseEntity<ApiResponse<ConversationResponse>> startConversation(
            Authentication authentication,
            @RequestBody @Valid StartConversationRequest request) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Conversation started",
                        messagingService.startConversation(user, request)));
    }

    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse<List<ConversationResponse>>> getInbox(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(messagingService.getInbox(user)));
    }

    @GetMapping("/conversations/listing/{listingId}")
    public ResponseEntity<ApiResponse<ConversationResponse>> getConversationByListing(
            Authentication authentication,
            @PathVariable Long listingId) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(
                messagingService.getConversationByListing(user, listingId)));
    }

    @GetMapping("/conversations/{id}")
    public ResponseEntity<ApiResponse<ConversationResponse>> getConversation(
            Authentication authentication,
            @PathVariable Long id) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(messagingService.getConversation(user, id)));
    }

    @PostMapping("/messages")
    public ResponseEntity<ApiResponse<MessageResponse>> sendMessage(
            Authentication authentication,
            @RequestBody @Valid SendMessageRequest request) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Message sent", messagingService.sendMessage(user, request)));
    }

    @GetMapping("/conversations/{id}/messages")
    public ResponseEntity<ApiResponse<List<MessageResponse>>> getMessages(
            Authentication authentication,
            @PathVariable Long id) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(messagingService.getMessages(user, id)));
    }

    @DeleteMapping("/messages/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteMessage(
            Authentication authentication,
            @PathVariable Long id) {
        User user = (User) authentication.getPrincipal();
        messagingService.deleteMessage(user, id);
        return ResponseEntity.ok(ApiResponse.success("Message deleted", null));
    }
}
