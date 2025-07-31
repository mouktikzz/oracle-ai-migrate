import React, { useState, useCallback, useRef, useEffect } from 'react';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  throttleMs?: number;
}

interface RateLimitState {
  count: number;
  resetTime: number;
  lastRequestTime: number;
}

export function useProductionRateLimit(config: RateLimitConfig) {
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const rateLimitRef = useRef<RateLimitState>({ 
    count: 0, 
    resetTime: Date.now() + config.windowMs,
    lastRequestTime: 0
  });

  // Reset rate limit on mount to ensure clean state
  useEffect(() => {
    rateLimitRef.current = { 
      count: 0, 
      resetTime: Date.now() + config.windowMs,
      lastRequestTime: 0
    };
    setIsRateLimited(false);
    setRetryAfter(null);
  }, [config.windowMs, config.maxRequests]);

  const checkRateLimit = useCallback((): boolean => {
    const now = Date.now();
    
    // Reset if window has passed
    if (now > rateLimitRef.current.resetTime) {
      rateLimitRef.current = { 
        count: 0, 
        resetTime: now + config.windowMs,
        lastRequestTime: 0
      };
    }

    // Check throttling
    if (config.throttleMs && now - rateLimitRef.current.lastRequestTime < config.throttleMs) {
      const timeUntilThrottle = config.throttleMs - (now - rateLimitRef.current.lastRequestTime);
      const retrySeconds = Math.ceil(timeUntilThrottle / 1000);
      setIsRateLimited(true);
      setRetryAfter(retrySeconds);
      return false;
    }

    // Check if limit exceeded
    if (rateLimitRef.current.count >= config.maxRequests) {
      const timeUntilReset = Math.ceil((rateLimitRef.current.resetTime - now) / 1000);
      const retrySeconds = Math.max(1, timeUntilReset); // Ensure at least 1 second
      setIsRateLimited(true);
      setRetryAfter(retrySeconds);
      return false;
    }

    // Increment count and update last request time
    rateLimitRef.current.count++;
    rateLimitRef.current.lastRequestTime = now;
    setIsRateLimited(false);
    setRetryAfter(null);
    return true;
  }, [config.maxRequests, config.windowMs, config.throttleMs]);

  const getRateLimitInfo = useCallback(() => {
    const now = Date.now();
    const remaining = Math.max(0, config.maxRequests - rateLimitRef.current.count);
    const resetTime = rateLimitRef.current.resetTime;
    
    return {
      limit: config.maxRequests,
      remaining,
      reset: resetTime,
      used: rateLimitRef.current.count,
      isThrottled: config.throttleMs ? (now - rateLimitRef.current.lastRequestTime < config.throttleMs) : false
    };
  }, [config.maxRequests, config.throttleMs]);

  const resetRateLimit = useCallback(() => {
    rateLimitRef.current = { 
      count: 0, 
      resetTime: Date.now() + config.windowMs,
      lastRequestTime: 0
    };
    setIsRateLimited(false);
    setRetryAfter(null);
  }, [config.windowMs]);

  return {
    checkRateLimit,
    isRateLimited,
    retryAfter,
    getRateLimitInfo,
    resetRateLimit
  };
} 