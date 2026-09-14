/**
 * MountAlgo Terminal - Broker API Circuit Breaker & Exponential Backoff Engine
 * 
 * Protects broker API keys from IP rate-limiting, bans, and connection hammering
 * by monitoring failure rates and applying exponential cooldowns.
 */

export type CircuitStatus = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerState {
  status: CircuitStatus;
  consecutiveFailures: number;
  lastFailureTime: number;
  nextRetryTime: number;
  currentDelayMs: number;
  lastErrorMessage?: string;
  totalErrors: number;
  totalSuccesses: number;
}

const BASE_DELAY_MS = 5000;       // 5 seconds initial backoff
const MAX_DELAY_MS = 60000;       // 60 seconds maximum backoff
const FAILURE_THRESHOLD = 3;      // Trip after 3 consecutive network/auth errors

class BrokerCircuitBreakerManager {
  private circuits: Map<string, CircuitBreakerState> = new Map();

  private getOrCreate(accountId: string): CircuitBreakerState {
    let state = this.circuits.get(accountId);
    if (!state) {
      state = {
        status: 'CLOSED',
        consecutiveFailures: 0,
        lastFailureTime: 0,
        nextRetryTime: 0,
        currentDelayMs: BASE_DELAY_MS,
        totalErrors: 0,
        totalSuccesses: 0,
      };
      this.circuits.set(accountId, state);
    }
    return state;
  }

  /**
   * Checks whether a sync/network request can proceed or is blocked by cooldown.
   */
  public canAttemptSync(accountId: string): { allowed: boolean; reason?: string; waitSec?: number } {
    const state = this.getOrCreate(accountId);
    const now = Date.now();

    if (state.status === 'CLOSED') {
      return { allowed: true };
    }

    if (state.status === 'OPEN') {
      if (now >= state.nextRetryTime) {
        // Cooldown passed, allow a canary test probe
        state.status = 'HALF_OPEN';
        return { allowed: true };
      }
      const waitSec = Math.ceil((state.nextRetryTime - now) / 1000);
      return {
        allowed: false,
        reason: `Circuit Breaker aktif (Cooldown ${waitSec}s). Menghindari rate-limit broker.`,
        waitSec,
      };
    }

    if (state.status === 'HALF_OPEN') {
      // Allow the single canary probe
      return { allowed: true };
    }

    return { allowed: true };
  }

  /**
   * Record a successful sync to reset failures and close the circuit.
   */
  public recordSyncSuccess(accountId: string): void {
    const state = this.getOrCreate(accountId);
    state.status = 'CLOSED';
    state.consecutiveFailures = 0;
    state.currentDelayMs = BASE_DELAY_MS;
    state.lastErrorMessage = undefined;
    state.totalSuccesses += 1;
  }

  /**
   * Record a sync error or timeout, applying exponential backoff when threshold is met.
   */
  public recordSyncFailure(accountId: string, errorMessage: string): { isTripped: boolean; nextRetrySec: number; delayMs: number } {
    const state = this.getOrCreate(accountId);
    const now = Date.now();

    state.consecutiveFailures += 1;
    state.lastFailureTime = now;
    state.lastErrorMessage = errorMessage;
    state.totalErrors += 1;

    let isTripped = false;

    if (state.consecutiveFailures >= FAILURE_THRESHOLD || state.status === 'HALF_OPEN') {
      state.status = 'OPEN';
      isTripped = true;

      // Exponential backoff calculation
      if (state.consecutiveFailures > FAILURE_THRESHOLD) {
        state.currentDelayMs = Math.min(state.currentDelayMs * 1.8, MAX_DELAY_MS);
      } else {
        state.currentDelayMs = BASE_DELAY_MS;
      }

      state.nextRetryTime = now + state.currentDelayMs;
    }

    const nextRetrySec = Math.max(1, Math.ceil((state.nextRetryTime - now) / 1000));

    return {
      isTripped,
      nextRetrySec: isTripped ? nextRetrySec : 0,
      delayMs: state.currentDelayMs,
    };
  }

  /**
   * Get the current snapshot state of the circuit breaker for an account.
   */
  public getCircuitState(accountId: string): Readonly<CircuitBreakerState> {
    return { ...this.getOrCreate(accountId) };
  }

  /**
   * Manually reset the circuit breaker (e.g., when user edits API keys).
   */
  public resetCircuit(accountId: string): void {
    const state = this.getOrCreate(accountId);
    state.status = 'CLOSED';
    state.consecutiveFailures = 0;
    state.currentDelayMs = BASE_DELAY_MS;
    state.lastErrorMessage = undefined;
    state.nextRetryTime = 0;
  }
}

export const brokerCircuitBreaker = new BrokerCircuitBreakerManager();
