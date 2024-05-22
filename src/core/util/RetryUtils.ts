import { ClassConstructor } from "./types";

/**
 * A sleep function that can be used with async/await syntax.
 */
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getExponentialBackOffJitterMs(
  retryCount: number,
  exponentBase: number
) {
  return (
    exponentBase ** (retryCount + 1) +
    (Math.floor(Math.random() * (200 - 10 + 1)) + 10)
  );
}

/**
 * Utility function for retrying an asynchronous function up to a certain number of times
 * and using an expontential backoff with jitter function to determine how long to wait time between subsequent retries.
 *
 * @param methodToRetry - the method to be retried if it fails with a error that is retryable
 * @param maxRetries - The maximum number of times to retry before failing
 * @param retryableErrorClasses - A list of errors that the method can be retried on
 * @returns
 */
export async function retryAsyncMethodWithExpBackoffJitter<T>(
  methodToRetry: (...args: unknown[]) => Promise<T>,
  maxRetries: number,
  retryableErrorClasses: ClassConstructor<unknown>[]
): Promise<T> {
  return await retryAsyncMethod(
    methodToRetry,
    (retryCount) => getExponentialBackOffJitterMs(retryCount, 2),
    retryableErrorClasses,
    0,
    maxRetries
  );
}

/**
 * Utility function for retrying an asynchronous function up to a certain number of times.
 *
 * @param methodToRetry - the method to be retried if it fails with a error that is retryable
 * @param timeoutCalculator - Function for calculating how long to wait before the next retry
 * @param retryableErrorClasses - A list of errors that the method can be retried on
 * @param retryCount - The current retry count, you can set this
 * @param maxRetries - The maximum number of times to retry before failing
 */
async function retryAsyncMethod<T>(
  methodToRetry: (...args: unknown[]) => Promise<T>,
  timeoutCalculator: (retryCount: number) => number,
  retryableErrorClasses: ClassConstructor<unknown>[],
  retryCount: number,
  maxRetries: number
): Promise<T> {
  try {
    return await methodToRetry();
  } catch (error) {
    // Determine if the error is a known retryable one.
    let isRetryableError = false;
    retryableErrorClasses.forEach((retryableErrorClass) => {
      if (error instanceof retryableErrorClass) {
        isRetryableError = true;
      }
    });

    // Throw an error if we hit the maximum number of retries
    if (retryCount === maxRetries) {
      throw new RetryAttemptsExhaustedError();
    }

    if (isRetryableError && retryCount < maxRetries) {
      await sleep(timeoutCalculator(retryCount));
      return await retryAsyncMethod(
        methodToRetry,
        timeoutCalculator,
        retryableErrorClasses,
        retryCount + 1,
        maxRetries
      );
    }
    throw error;
  }
}

/**
 * Method thrown by {@link retryAsyncMethod} when hitting the maximum number of retry attempts.
 */
export class RetryAttemptsExhaustedError extends Error {
  constructor() {
    super("All retry attempts exhausted");
  }
}
