import { ApiError } from "./ApiError";

export class UnauthorizedApiError extends ApiError {
  constructor(
    message: string = `Requester is unauthorized to perform the operation`
  ) {
    super(400, COMMON_API_ERROR_CODE.UNAUTHORIZED, message);
  }
}

export class InvalidRequestApiError extends ApiError {
  constructor(
    message: string = `Request contains one or more missing or invalid attributes`
  ) {
    super(400, COMMON_API_ERROR_CODE.INVALID_REQUEST, message);
  }
}

export class InternalServerApiError extends ApiError {
  constructor(message: string = `An Interal Server Error Occured`) {
    super(500, COMMON_API_ERROR_CODE.INTERNAL_SERVER_ERROR, message);
  }
}

export class RetryAttemptsExhaustedApiError extends ApiError {
  constructor(message: string = `All retry attempts have been exhausted`) {
    super(503, COMMON_API_ERROR_CODE.RETRY_ATTEMPTS_EXHAUSTED, message);
  }
}

export class UniqueObjectAlreadyExistsApiError extends ApiError {
  constructor(message: string = `The Unique Object Already Exists`) {
    super(400, COMMON_API_ERROR_CODE.UNIQUE_OBJECT_ALREADY_EXISTS, message);
  }
}

// -----------------------------------

/**
 * All possible API error codes.
 */
export const COMMON_API_ERROR_CODE = {
  UNAUTHORIZED: "UNAUTHORIZED",
  INVALID_REQUEST: "INVALID_REQUEST",
  UNIQUE_OBJECT_ALREADY_EXISTS: "UNIQUE_OBJECT_ALREADY_EXISTS",
  RETRY_ATTEMPTS_EXHAUSTED: "RETRY_ATTEMPTS_EXHAUSTED",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
} as const;

/**
 * The typescript type for different subscription statuses.
 */
export type CommonApiErrorCode =
  (typeof COMMON_API_ERROR_CODE)[keyof typeof COMMON_API_ERROR_CODE];
