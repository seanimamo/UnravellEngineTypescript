import { CodedError } from "@/core/common/error";

export const USER_REPO_ERROR_CODES = {
  USERNAME_ALREADY_EXISTS: "USER_REPO_USERNAME_ALREADY_EXISTS",
  EMAIL_ALREADY_EXISTS: "USER_REPO_EMAIL_ALREADY_EXISTS",
} as const;

export type USER_REPO_ERROR_CODES =
  (typeof USER_REPO_ERROR_CODES)[keyof typeof USER_REPO_ERROR_CODES];

export class EmailAlreadyInUseError extends CodedError {
  constructor(message: string = "The email is already in use") {
    super(message, USER_REPO_ERROR_CODES.EMAIL_ALREADY_EXISTS);
  }
}

export class UsernameAlreadyInUseError extends CodedError {
  constructor(message: string = "Username already exists") {
    super(message, USER_REPO_ERROR_CODES.USERNAME_ALREADY_EXISTS);
  }
}
