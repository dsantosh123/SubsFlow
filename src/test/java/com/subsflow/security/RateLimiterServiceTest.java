package com.subsflow.security;

import com.subsflow.common.security.RateLimiterService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

public class RateLimiterServiceTest {

    private StringRedisTemplate redisTemplate;
    private ValueOperations<String, String> valueOperations;
    private RateLimiterService rateLimiterService;

    @BeforeEach
    void setUp() {
        redisTemplate = Mockito.mock(StringRedisTemplate.class);
        valueOperations = Mockito.mock(ValueOperations.class);
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);

        rateLimiterService = new RateLimiterService(redisTemplate, 100);
    }

    @Test
    void testRequestAllowedWithinQuota() {
        when(valueOperations.increment(anyString(), eq(1L))).thenReturn(50L);

        boolean allowed = rateLimiterService.isAllowed("tenant_abc");
        assertThat(allowed).isTrue();
    }

    @Test
    void testRequestBlockedWhenQuotaExceeded() {
        when(valueOperations.increment(anyString(), eq(1L))).thenReturn(150L);

        boolean allowed = rateLimiterService.isAllowed("tenant_abc");
        assertThat(allowed).isFalse();
    }

    @Test
    void testFailOpenOnRedisException() {
        when(valueOperations.increment(anyString(), eq(1L))).thenThrow(new RuntimeException("Redis connection refused"));

        boolean allowed = rateLimiterService.isAllowed("tenant_abc");
        assertThat(allowed).isTrue();
    }
}
