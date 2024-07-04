import { ApiError } from "./ApiError";

export class SignUpClosedError extends ApiError {
  static type = "SignUpClosed";
  constructor(message: string = SignUpClosedError.type) {
    super(400, SIGN_UP_ERROR_CODE.SIGN_UP_CLOSED, message);
  }
}

export const SIGN_UP_ERROR_CODE = {
  SIGN_UP_CLOSED: "SIGN_UP_CLOSED",
} as const;

export type SignUpApiErrorCode =
  (typeof SIGN_UP_ERROR_CODE)[keyof typeof SIGN_UP_ERROR_CODE];
