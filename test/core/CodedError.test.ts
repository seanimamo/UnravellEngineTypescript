import { CodedError } from "../../src/core/common/error";

describe("CodedError", () => {
  class TestError extends CodedError {
    constructor(message: string) {
      super(message, TEST_ERROR_CODE);
    }
  }

  const TEST_ERROR_CODE = "TestErrorCode";

  test("constructor works as expected", () => {
    const error = new TestError("");
    expect(error.message).toBe(`::::${TEST_ERROR_CODE}::::`);

    const error2 = new TestError("test error message");
    expect(error2.message).toBe(`::::${TEST_ERROR_CODE}::::test error message`);
  });

  test(".fromMessage() runs successfully", () => {
    const errorMessage = "test error message";
    const codedMessage = `::::${TEST_ERROR_CODE}::::${errorMessage}`;

    const codedError = CodedError.fromMessage(codedMessage);

    expect(codedError).toBeDefined();
    expect(codedError?.code).toEqual(TEST_ERROR_CODE);
    expect(codedError?.message).toEqual(codedMessage);
  });

  test(".fromMessage() extracts CodedError from wrapped Error message", () => {
    const codedError = new TestError("test error message");
    const wrappedError = new Error(codedError.message);
    const codedErrorFromMsg = CodedError.fromMessage(wrappedError.message);

    expect(codedErrorFromMsg).toBeDefined();
    expect(codedErrorFromMsg?.code).toEqual(TEST_ERROR_CODE);
    expect(codedErrorFromMsg?.message).toEqual(codedError.message);
  });
});
