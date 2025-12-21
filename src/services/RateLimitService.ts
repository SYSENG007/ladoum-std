/**
 * Rate Limiting Service
 * Prevents spam by limiting invitation creation rate
 */

interface RateLimitRecord {
    count: number;
    firstAttempt: number; // timestamp
    resetAt: number; // timestamp
}

const RATE_LIMIT_KEY = 'invitation_rate_limit';
const MAX_INVITATIONS_PER_HOUR = 10;
const HOUR_IN_MS = 60 * 60 * 1000;

export const RateLimitService = {
    /**
     * Check if user can create another invitation
     */
    canCreateInvitation(userId: string): { allowed: boolean; remaining: number; resetAt: Date | null } {
        const key = `${RATE_LIMIT_KEY}_${userId}`;
        const stored = localStorage.getItem(key);
        const now = Date.now();

        if (!stored) {
            // First invitation
            return { allowed: true, remaining: MAX_INVITATIONS_PER_HOUR - 1, resetAt: null };
        }

        const record: RateLimitRecord = JSON.parse(stored);

        // Check if hour has passed - reset counter
        if (now >= record.resetAt) {
            localStorage.removeItem(key);
            return { allowed: true, remaining: MAX_INVITATIONS_PER_HOUR - 1, resetAt: null };
        }

        // Check if limit reached
        if (record.count >= MAX_INVITATIONS_PER_HOUR) {
            return {
                allowed: false,
                remaining: 0,
                resetAt: new Date(record.resetAt)
            };
        }

        // Still within limit
        return {
            allowed: true,
            remaining: MAX_INVITATIONS_PER_HOUR - record.count - 1,
            resetAt: new Date(record.resetAt)
        };
    },

    /**
     * Record an invitation creation
     */
    recordInvitation(userId: string): void {
        const key = `${RATE_LIMIT_KEY}_${userId}`;
        const stored = localStorage.getItem(key);
        const now = Date.now();

        if (!stored) {
            // First invitation
            const record: RateLimitRecord = {
                count: 1,
                firstAttempt: now,
                resetAt: now + HOUR_IN_MS
            };
            localStorage.setItem(key, JSON.stringify(record));
            return;
        }

        const record: RateLimitRecord = JSON.parse(stored);

        // If hour passed, reset
        if (now >= record.resetAt) {
            const newRecord: RateLimitRecord = {
                count: 1,
                firstAttempt: now,
                resetAt: now + HOUR_IN_MS
            };
            localStorage.setItem(key, JSON.stringify(newRecord));
            return;
        }

        // Increment counter
        record.count += 1;
        localStorage.setItem(key, JSON.stringify(record));
    },

    /**
     * Get current status for display
     */
    getStatus(userId: string): { count: number; limit: number; resetAt: Date | null } {
        const key = `${RATE_LIMIT_KEY}_${userId}`;
        const stored = localStorage.getItem(key);
        const now = Date.now();

        if (!stored) {
            return { count: 0, limit: MAX_INVITATIONS_PER_HOUR, resetAt: null };
        }

        const record: RateLimitRecord = JSON.parse(stored);

        // Check if expired
        if (now >= record.resetAt) {
            localStorage.removeItem(key);
            return { count: 0, limit: MAX_INVITATIONS_PER_HOUR, resetAt: null };
        }

        return {
            count: record.count,
            limit: MAX_INVITATIONS_PER_HOUR,
            resetAt: new Date(record.resetAt)
        };
    },

    /**
     * Reset rate limit for a user (admin function)
     */
    reset(userId: string): void {
        const key = `${RATE_LIMIT_KEY}_${userId}`;
        localStorage.removeItem(key);
    }
};
