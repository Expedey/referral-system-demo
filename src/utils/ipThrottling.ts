/**
 * Basic IP throttling for fraud prevention
 * Implements simple rate limiting per IP address
 */

interface ThrottleConfig {
  maxAttemptsPerHour: number;
  maxVerificationsPerDay: number;
}

// Default configuration
const DEFAULT_CONFIG: ThrottleConfig = {
  maxAttemptsPerHour: 10,
  maxVerificationsPerDay: 1,
};

// In-memory storage for IP attempts (in production, use Redis or database)
const ipAttempts = new Map<string, { attempts: number[]; verifications: number[] }>();

/**
 * Checks if an IP is throttled based on attempts and verifications
 * @param ip - The IP address to check
 * @param config - Throttling configuration
 * @returns Object with throttled status and remaining limits
 */
export function checkIPThrottle(
  ip: string, 
  config: ThrottleConfig = DEFAULT_CONFIG
): { 
  throttled: boolean; 
  reason?: string; 
  remainingAttempts: number; 
  remainingVerifications: number; 
} {
  const now = Date.now();
  const oneHourAgo = now - (60 * 60 * 1000);
  const oneDayAgo = now - (24 * 60 * 60 * 1000);

  // Get or create IP record
  const ipRecord = ipAttempts.get(ip) || { attempts: [], verifications: [] };

  // Filter recent attempts
  const recentAttempts = ipRecord.attempts.filter(timestamp => timestamp > oneHourAgo);
  const recentVerifications = ipRecord.verifications.filter(timestamp => timestamp > oneDayAgo);

  // Check limits
  const remainingAttempts = Math.max(0, config.maxAttemptsPerHour - recentAttempts.length);
  const remainingVerifications = Math.max(0, config.maxVerificationsPerDay - recentVerifications.length);

  // Determine if throttled
  let throttled = false;
  let reason: string | undefined;

  if (recentAttempts.length >= config.maxAttemptsPerHour) {
    throttled = true;
    reason = `Maximum ${config.maxAttemptsPerHour} attempts per hour reached`;
  } else if (recentVerifications.length >= config.maxVerificationsPerDay) {
    throttled = true;
    reason = `Maximum ${config.maxVerificationsPerDay} verifications per day reached`;
  }

  return {
    throttled,
    reason,
    remainingAttempts,
    remainingVerifications,
  };
}

/**
 * Records an attempt for an IP address
 * @param ip - The IP address
 * @param isVerification - Whether this is a verification attempt
 */
export function recordIPAttempt(ip: string, isVerification: boolean = false): void {
  const now = Date.now();
  const ipRecord = ipAttempts.get(ip) || { attempts: [], verifications: [] };

  if (isVerification) {
    ipRecord.verifications.push(now);
  } else {
    ipRecord.attempts.push(now);
  }

  ipAttempts.set(ip, ipRecord);
}

/**
 * Cleans up old records to prevent memory leaks
 * Should be called periodically in production
 */
export function cleanupOldRecords(): void {
  const now = Date.now();
  const oneDayAgo = now - (24 * 60 * 60 * 1000);

  for (const [ip, record] of ipAttempts.entries()) {
    record.attempts = record.attempts.filter(timestamp => timestamp > oneDayAgo);
    record.verifications = record.verifications.filter(timestamp => timestamp > oneDayAgo);

    // Remove IP if no recent activity
    if (record.attempts.length === 0 && record.verifications.length === 0) {
      ipAttempts.delete(ip);
    }
  }
}

/**
 * Gets current stats for an IP
 * @param ip - The IP address
 * @returns Current attempt and verification counts
 */
export function getIPStats(ip: string): { 
  attemptsLastHour: number; 
  verificationsLastDay: number; 
} {
  const now = Date.now();
  const oneHourAgo = now - (60 * 60 * 1000);
  const oneDayAgo = now - (24 * 60 * 60 * 1000);

  const ipRecord = ipAttempts.get(ip) || { attempts: [], verifications: [] };

  const attemptsLastHour = ipRecord.attempts.filter(timestamp => timestamp > oneHourAgo).length;
  const verificationsLastDay = ipRecord.verifications.filter(timestamp => timestamp > oneDayAgo).length;

  return {
    attemptsLastHour,
    verificationsLastDay,
  };
} 