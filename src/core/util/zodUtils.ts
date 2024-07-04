import { ZodError } from "zod";

/**
 * Combines all the issue messages from a Zod error into a single message.
 */
export function combineZodErrorMessages(error: ZodError) {
  let errorMessage = "";

  error.issues.forEach((issue) => {
    errorMessage += ` ${issue.message},`;
  });

  for (let i = 0; i < error.issues.length; i++) {
    if (i !== error.issues.length - 1) {
      errorMessage += ` ${error.issues[i].message}`;
    } else {
      errorMessage += ` ${error.issues[i].message},`;
    }
  }

  return errorMessage;
}
