import { CodedError } from "@/core/common";

export class DatabaseError extends CodedError {
  constructor(message: string, errorCode: DatabaseErrorCode) {
    super(message, errorCode);
  }
}

export class ObjectDoesNotExistDbError extends DatabaseError {
  constructor(message: string = "The object does not exist") {
    super(message, DATABASE_ERROR_CODES.OBJECT_DOES_NOT_EXIST);
  }
}

export class UniqueObjectAlreadyExistsDbError extends DatabaseError {
  constructor(message: string = "The object already exists") {
    super(message, DATABASE_ERROR_CODES.UNIQUE_OBJECT_ALREADY_EXISTS);
  }
}

export class InvalidParametersDbError extends DatabaseError {
  constructor(message: string = "The provided parameters are invalid") {
    super(message, DATABASE_ERROR_CODES.INVALID_PARAMETERS);
  }
}

export class InvalidDataDbError extends DatabaseError {
  constructor(
    message: string = "The schema of the provided data is not valid"
  ) {
    super(message, DATABASE_ERROR_CODES.INVALID_DATA);
  }
}

/**
 * All possible database error codes.
 */
export const DATABASE_ERROR_CODES = {
  INVALID_DATA: "INVALID_DATA",
  UNIQUE_OBJECT_ALREADY_EXISTS: "UNIQUE_OBJECT_ALREADY_EXISTS",
  OBJECT_DOES_NOT_EXIST: "OBJECT_DOES_NOT_EXIST",
  INVALID_PARAMETERS: "INVALID_PARAMETERS",
  PARENT_OBJECT_DOES_NOT_EXIST: "PARENT_OBJECT_DOES_NOT_EXIST",
} as const;

/**
 * The typescript type for different subscription statuses.
 */
export type DatabaseErrorCode =
  (typeof DATABASE_ERROR_CODES)[keyof typeof DATABASE_ERROR_CODES];
