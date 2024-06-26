/**
 * Our extended version of the error class which includes a type.
 * This type variable allows us to easily distinguish between errors with a
 * constant rather than relying on descriptions or instances of certain errors.
 */
export class CodedError extends Error {
  /**
   * The error code, a string that is unique to a specific type of error.
   */
  public readonly code: string;

  constructor(message: string, code: string) {
    const messageWithType = `::${code}::${message}`;
    super(messageWithType);
    this.code = code;
  }
}
