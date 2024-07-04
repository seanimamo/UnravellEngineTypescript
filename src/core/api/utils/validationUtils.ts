import { z } from "zod";
import { combineZodErrorMessages } from "../../util/zodUtils";
import { InvalidRequestApiError } from "../public/error";

/**
 * Validates an api request using Zod and a provided valication schema.
 * @throws - {@link InvalidRequestApiError} if the schema is invalid
 */
export function validateApiRequestWithZod(
  validationSchema: z.ZodObject<any>,
  apiRequest: unknown
) {
  const result = validationSchema.safeParse(apiRequest);
  if (!result.success) {
    let errorMessage =
      "Unexpected data validation error(s): " +
      combineZodErrorMessages(result.error);

    console.info(errorMessage, result.error);
    throw new InvalidRequestApiError(errorMessage);
  }
}
