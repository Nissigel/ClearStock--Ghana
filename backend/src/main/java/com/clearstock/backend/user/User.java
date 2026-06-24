package com.clearstock.backend.user;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "phone_number", unique = true, nullable = false)
    private String phone;

    @Column(name = "phone", nullable = false)
    private String phoneAlt;

    @Column(nullable = false)
    private String pinHash;

    @Column(name = "full_name", nullable = false)
    private String name;

    private String email;

    @Column(nullable = false)
    private String region;

    @Column(name = "city_town", nullable = false)
    private String cityTown;

    @Column(name = "profile_image_url")
    private String profileImageUrl;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
