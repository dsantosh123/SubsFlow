package com.subsflow.common.security;

import com.subsflow.tenant.entity.Tenant;
import com.subsflow.admin.entity.PlatformAdmin;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);

    private final SecretKey signingKey;
    private final long jwtExpirationMs;

    public JwtService(
            @Value("${subsflow.jwt.secret:subsflow-super-secure-jwt-signing-secret-key-32bytes-minimum-length!}") String secret,
            @Value("${subsflow.jwt.expiration-ms:86400000}") long jwtExpirationMs) {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
        this.jwtExpirationMs = jwtExpirationMs;
    }

    public String generateToken(Tenant tenant) {
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("tenantId", tenant.getId());
        extraClaims.put("tenantName", tenant.getName());
        extraClaims.put("apiKey", tenant.getApiKey());
        extraClaims.put("status", tenant.getStatus() != null ? tenant.getStatus().name() : "ACTIVE");
        extraClaims.put("role", "ROLE_TENANT_ADMIN");

        return buildToken(extraClaims, tenant.getId(), jwtExpirationMs);
    }

    public String generateTenantUserToken(com.subsflow.tenant.entity.TenantUser user) {
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("tenantId", user.getTenant().getId());
        extraClaims.put("tenantName", user.getTenant().getName());
        extraClaims.put("apiKey", user.getTenant().getApiKey());
        extraClaims.put("status", user.getTenant().getStatus() != null ? user.getTenant().getStatus().name() : "ACTIVE");
        extraClaims.put("userId", user.getId());
        extraClaims.put("email", user.getEmail());
        extraClaims.put("name", user.getName());
        extraClaims.put("role", "ROLE_TENANT_" + user.getRole().name());

        return buildToken(extraClaims, user.getTenant().getId(), jwtExpirationMs);
    }

    public String generateAdminToken(PlatformAdmin admin) {
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("adminId", admin.getId());
        extraClaims.put("adminEmail", admin.getEmail());
        extraClaims.put("role", admin.getRole());

        return buildToken(extraClaims, admin.getId(), jwtExpirationMs);
    }

    private String buildToken(Map<String, Object> extraClaims, String subject, long expiration) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .claims(extraClaims)
                .subject(subject)
                .issuedAt(new Date(now))
                .expiration(new Date(now + expiration))
                .signWith(signingKey)
                .compact();
    }

    public String extractTenantId(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public String extractRole(String token) {
        return extractClaim(token, claims -> claims.get("role", String.class));
    }

    public String extractUserId(String token) {
        return extractClaim(token, claims -> claims.get("userId", String.class));
    }

    public String extractEmail(String token) {
        return extractClaim(token, claims -> claims.get("email", String.class));
    }

    public String extractName(String token) {
        return extractClaim(token, claims -> claims.get("name", String.class));
    }

    public String extractAdminEmail(String token) {
        return extractClaim(token, claims -> claims.get("adminEmail", String.class));
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claims != null ? claimsResolver.apply(claims) : null;
    }

    public Claims extractAllClaims(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(signingKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("Invalid JWT token: {}", e.getMessage());
            return null;
        }
    }

    public boolean isTokenValid(String token) {
        try {
            Claims claims = extractAllClaims(token);
            if (claims == null) {
                return false;
            }
            return !claims.getExpiration().before(new Date());
        } catch (Exception e) {
            return false;
        }
    }

    public long getJwtExpirationMs() {
        return jwtExpirationMs;
    }
}
