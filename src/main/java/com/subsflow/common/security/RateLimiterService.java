package com.subsflow.common.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
public class RateLimiterService {

    private static final Logger log = LoggerFactory.getLogger(RateLimiterService.class);

    private final StringRedisTemplate redisTemplate;
    private final int maxRequestsPerMinute;

    public RateLimiterService(
            StringRedisTemplate redisTemplate,
            @Value("${subsflow.rate-limit.requests-per-minute:10000}") int maxRequestsPerMinute) {
        this.redisTemplate = redisTemplate;
        this.maxRequestsPerMinute = maxRequestsPerMinute;
    }

    /**
     * Checks if the given tenant is within their allowed rate limit quota.
     * Uses an atomic Redis sliding counter with automatic 60-second expiration.
     *
     * @param tenantId The unique tenant identifier
     * @return true if request is allowed, false if quota exceeded (429)
     */
    public boolean isAllowed(String tenantId) {
        if (tenantId == null || tenantId.trim().isEmpty()) {
            return true;
        }

        try {
            long currentMinuteWindow = System.currentTimeMillis() / 60000;
            String key = "ratelimit:" + tenantId + ":" + currentMinuteWindow;

            Long count = redisTemplate.opsForValue().increment(key, 1);
            if (count != null && count == 1) {
                // Set TTL on the first increment
                redisTemplate.expire(key, Duration.ofSeconds(70));
            }

            if (count != null && count > maxRequestsPerMinute) {
                log.warn("Rate limit exceeded for tenant {}: {}/{} reqs in current minute window",
                        tenantId, count, maxRequestsPerMinute);
                return false;
            }

            return true;
        } catch (Exception e) {
            // Fail open if Redis is experiencing connectivity issues so traffic isn't dropped
            log.warn("Redis rate limiter unavailable. Failing open for tenant {}: {}", tenantId, e.getMessage());
            return true;
        }
    }

    public int getMaxRequestsPerMinute() {
        return maxRequestsPerMinute;
    }
}
