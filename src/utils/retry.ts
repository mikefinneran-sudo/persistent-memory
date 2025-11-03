/**
 * Retry utility for handling transient failures
 */

export interface RetryOptions {
  attempts: number;
  delay: number; // in milliseconds
  backoff?: boolean; // exponential backoff
  onRetry?: (error: Error, attempt: number) => void;
}

/**
 * Sleeps for the specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retries a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const { attempts, delay, backoff = true, onRetry } = options;

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on the last attempt
      if (attempt === attempts) {
        break;
      }

      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(lastError, attempt);
      }

      // Calculate delay with optional exponential backoff
      const delayMs = backoff ? delay * Math.pow(2, attempt - 1) : delay;
      await sleep(delayMs);
    }
  }

  throw lastError || new Error('Retry failed with unknown error');
}

/**
 * Checks if an error is retryable
 */
export function isRetryableError(error: any): boolean {
  // Network errors
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
    return true;
  }

  // Airtable rate limit (429)
  if (error.statusCode === 429) {
    return true;
  }

  // Airtable server errors (5xx)
  if (error.statusCode >= 500 && error.statusCode < 600) {
    return true;
  }

  return false;
}
