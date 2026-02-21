/**
 * Retry utility with exponential backoff
 * Used for API calls that may fail due to network issues
 */

const DEFAULT_OPTIONS = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  jitter: true, // Add random jitter to prevent thundering herd
  retryableErrors: [
    'NETWORK_ERROR',
    'TIMEOUT',
    'ECONNRESET',
    'ECONNREFUSED',
    'ENOTFOUND',
    'fetch failed',
    'Network request failed',
  ],
};

/**
 * Execute an async function with retry logic
 * @param {Function} fn - Async function to execute
 * @param {Object} options - Retry options
 * @returns {Promise} - Result of the function call
 */
export async function withRetry(fn, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on the last attempt
      if (attempt === opts.maxRetries) break;

      // Check if this error is retryable
      if (!isRetryable(error, opts.retryableErrors)) break;

      // Calculate delay with exponential backoff
      let delay = Math.min(
        opts.initialDelay * Math.pow(opts.backoffMultiplier, attempt),
        opts.maxDelay,
      );

      // Add jitter (±25%)
      if (opts.jitter) {
        const jitterRange = delay * 0.25;
        delay += (Math.random() * 2 - 1) * jitterRange;
      }

      console.log(
        `[Retry] Attempt ${attempt + 1}/${
          opts.maxRetries
        } failed, retrying in ${Math.round(delay)}ms`,
      );

      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Check if an error is retryable
 */
function isRetryable(error, retryableErrors) {
  const message = error?.message || String(error);
  return retryableErrors.some(
    pattern => message.includes(pattern) || error?.code === pattern,
  );
}

/**
 * Fetch with retry
 */
export async function fetchWithRetry(
  url,
  fetchOptions = {},
  retryOptions = {},
) {
  return withRetry(
    async () => {
      const response = await fetch(url, {
        timeout: 15000,
        ...fetchOptions,
      });
      if (!response.ok && response.status >= 500) {
        throw new Error(`Server error: ${response.status}`);
      }
      return response;
    },
    {
      ...retryOptions,
      retryableErrors: [
        ...DEFAULT_OPTIONS.retryableErrors,
        'Server error: 500',
        'Server error: 502',
        'Server error: 503',
        'Server error: 504',
      ],
    },
  );
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
