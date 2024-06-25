import { CodedError } from "@/core/common/index";

export class ApiError extends CodedError {
  constructor(
    /**
     * The HTTP status code
     */
    public readonly httpCode: number,
    type: string,
    message: string
  ) {
    super(message, type);
    this.httpCode = httpCode;
  }
}

export class UnauthorizedApiError extends ApiError {
  static type = "Unauthorized";
  constructor(
    message: string = `Requester is unauthorized to perform the operation`,
    statusCode = 401
  ) {
    super(statusCode, UnauthorizedApiError.type, message);
  }
}

export class InvalidRequestApiError extends ApiError {
  static type = "InvalidRequest";
  constructor(
    message: string = `Request contains one or more missing or invalid attributes`,
    statusCode = 400
  ) {
    super(statusCode, InvalidRequestApiError.type, message);
  }
}

export class InternalServerApiError extends ApiError {
  static type = "InternalServerError";
  constructor(
    message: string = `An Interal Server Error Occured`,
    statusCode = 500
  ) {
    super(statusCode, InternalServerApiError.type, message);
  }
}

export class RetryAttemptsExhaustedApiError extends ApiError {
  static type = "RetryAttemptsExhausted";
  constructor(
    message: string = `All retry attempts have been exhausted`,
    statusCode = 503
  ) {
    super(statusCode, RetryAttemptsExhaustedApiError.type, message);
  }
}

export class UniqueObjectAlreadyExistsApiError extends ApiError {
  static type = "ObjectAlreadyExistsError";
  constructor(
    message: string = `The Unique Object Already Exists`,
    statusCode = 400
  ) {
    super(statusCode, UniqueObjectAlreadyExistsApiError.type, message);
  }
}
