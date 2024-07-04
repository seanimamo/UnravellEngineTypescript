/**
 * Our extended version of the error class includes an error code both in the error message
 * and as an attribute. This class provides the following benefits:
 *
 * 1) This error code allows us to easily distinguish between errors with a
 * constant rather than relying on descriptions or instances of certain errors classes.
 *
 * 2) We know that any instance of CodedError comes from our application code since we created it.
 *
 * 3) In certain edge cases where code we can't control wraps/transforms our CodedError,
 * (For example, AWS cognito lambda triggers) we can also parse the error message and code
 * out of the message and recreate the CodedError.
 */
export class CodedError extends Error {
  public static MESSAGE_DELIMITER = "::::";

  /**
   * The error code, a string that is unique to a specific type of error.
   */
  public readonly code: string;

  constructor(message: string, code: string) {
    const messageWithCode = `${CodedError.MESSAGE_DELIMITER}${code}${CodedError.MESSAGE_DELIMITER}${message}`;
    super(messageWithCode);
    this.code = code;
  }

  /**
   * Gets the error message without the code included in it.
   */
  getMessageWithoutCode(): string {
    return this.message.split(CodedError.MESSAGE_DELIMITER)[1]!;
  }

  /**
   * Takes a coded message in the format "_::_<error code>_::_<message>" and produces a CodedError.
   * @param errorMessage An error message that may or may not be in the format "::<error code>::<message>"
   */
  static fromMessage(errorMessage: string): CodedError | undefined {
    const errorParts = errorMessage.split(CodedError.MESSAGE_DELIMITER);
    if (errorParts.length != 3) {
      console.warn(
        "failed to produce CodedError from provided error message",
        errorMessage
      );
      return;
    }

    const code = errorParts[1];
    const message = errorParts[2];
    return new CodedError(message, code);
  }
}
