package com.clearstock.backend.common;

import com.clearstock.backend.admin.Admin;
import com.clearstock.backend.admin.AdminRepository;
import com.clearstock.backend.admin.AdminRole;
import com.clearstock.backend.user.User;
import com.clearstock.backend.user.UserRepository;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final AdminRepository adminRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");

        if (header == null || !header.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }

        String token = header.substring(7);

        try {
            Claims claims = jwtUtil.parseToken(token);

            // Temp tokens (PIN_CREATION) are not auth tokens — skip
            String purpose = claims.get("purpose", String.class);
            if ("PIN_CREATION".equals(purpose)) {
                chain.doFilter(request, response);
                return;
            }

            // Dashboard admins live in their own table and authenticate as an
            // Admin carrying a role authority, not as a User.
            if ("ADMIN".equals(purpose)) {
                authenticateAdmin(claims, request);
                chain.doFilter(request, response);
                return;
            }

            Long userId = Long.parseLong(claims.getSubject());
            User user = userRepository.findById(userId).orElse(null);

            if (user != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                        user, null, new ArrayList<>()
                );
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        } catch (Exception ignored) {
            // Invalid or expired token — proceed without auth; Security will reject protected routes
        }

        chain.doFilter(request, response);
    }

    /**
     * The role is read from the database rather than from the token, so
     * disabling an admin or demoting them takes effect immediately instead of
     * whenever their token happens to expire.
     */
    private void authenticateAdmin(Claims claims, HttpServletRequest request) {
        Admin admin = adminRepository.findById(Long.parseLong(claims.getSubject()))
                .orElse(null);

        if (admin == null || !Boolean.TRUE.equals(admin.getActive())
                || SecurityContextHolder.getContext().getAuthentication() != null) {
            return;
        }

        List<SimpleGrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
        if (admin.getRole() == AdminRole.SUPER_ADMIN) {
            authorities.add(new SimpleGrantedAuthority("ROLE_SUPER_ADMIN"));
        }

        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(admin, null, authorities);
        auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(auth);
    }
}
