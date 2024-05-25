import { BasicUserPassword } from "../../../../src/core/user";

describe("BasicUserPassword", () => {
  const plainTextPassword = "testPwrd";
  const userPassword =
    BasicUserPassword.fromPlainTextPassword(plainTextPassword);

  test("Check the correct password returns true", () => {
    expect(userPassword.isPasswordCorrect(plainTextPassword)).toEqual(true);
  });

  test("Check the wrong password returns false", () => {
    expect(userPassword.isPasswordCorrect("incorrectPwrd")).toEqual(false);
  });
});
