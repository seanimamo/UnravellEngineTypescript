import { CodedError } from "@/core/common";
import { CommonApiErrorCode } from "./CommonApiErrors";
import { SignUpApiErrorCode } from "./SignUpApiErrors";

export type ApiErrorCode = CommonApiErrorCode | SignUpApiErrorCode;

export class ApiError extends CodedError {
  constructor(
    /**
     * The HTTP status code
     */
    public readonly httpStatusCode: number,
    errorCode: ApiErrorCode,
    message: string
  ) {
    super(message, errorCode);
    this.httpStatusCode = httpStatusCode;
  }
}
