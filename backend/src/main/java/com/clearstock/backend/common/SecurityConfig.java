package com.clearstock.backend.common;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.beans.factory.annotation.Value;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    /** Comma-separated. The deployed dashboard origin is added via env var. */
    @Value("${admin.cors.origins:http://localhost:5173}")
    private String allowedOrigins;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/auth/**").permitAll()
                        .requestMatchers("/payments/**").permitAll()
                        // Only the login route is open; /admin/auth/me still
                        // needs a token, or it would dereference a null principal.
                        .requestMatchers("/admin/auth/login").permitAll()
                        // Managing staff accounts is the super admin's alone.
                        .requestMatchers("/admin/admins/**").hasRole("SUPER_ADMIN")
                        // Everything else under /admin needs a staff token, so
                        // a trader's token can never reach it.
                        .requestMatchers("/admin/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/listings/**", "/products/**").permitAll()
                        // A seller's rating and reviews are public trust
                        // signals. Requiring a token to read them meant a
                        // guest browsing a listing was told the seller had no
                        // reviews when they had plenty — the one moment the
                        // rating matters most is before someone signs up.
                        // Writing a review still needs an account.
                        .requestMatchers(HttpMethod.GET, "/seller/*/rating").permitAll()
                        .requestMatchers(HttpMethod.GET, "/reviews/user/**").permitAll()
                        .requestMatchers("/reviews", "/reviews/**").authenticated()
                        .anyRequest().authenticated()
                )
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, e) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType("application/json");
                            response.getWriter().write(
                                    "{\"success\":false,\"message\":\"Authentication required\",\"data\":null}"
                            );
                        })
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * The mobile app is not a browser and is unaffected by CORS, but the admin
     * dashboard is, and without this every request from it fails before it
     * reaches the server.
     *
     * Origins are configured rather than wildcarded: the dashboard can approve
     * sellers and suspend accounts, so it should not be callable from any page
     * that happens to have a staff token.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(Arrays.stream(allowedOrigins.split(","))
                .map(String::strip)
                .filter(origin -> !origin.isEmpty())
                .toList());
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
