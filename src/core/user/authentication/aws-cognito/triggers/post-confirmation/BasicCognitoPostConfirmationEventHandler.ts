import {
  PostConfirmationTriggerEvent,
  PreSignUpTriggerEvent,
} from "aws-lambda";
import { InvalidRequestApiError } from "@/core/api/public/error";
import { DataValidationError, DataValidator } from "@/core/util";
import { IUserResourceFactory } from "@/core/user/types";
import { ICognitoPostConfirmationUpEventHandler } from ".";
import { ObjectDoesNotExistDbError } from "@/core/database";
import { IUserRepo } from "@/core/user/database";
import { validateApiRequestWithZod } from "@/core/api/utils/validationUtils";
import { z } from "zod";

/**
 * This is a generic implementation of {@link (ICognitoPostConfirmationUpEventHandler)} which has logic for
 * multiple different types of post confirmation events such as after confirming a forgotten password
 * and after confirming your sign up.
 * The logic for this is intended to be wrapped within the expected AWS lambda function handler.
 *
 * @see https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools-working-with-aws-lambda-triggers.html
 */
export class BasicCognitoPostConfirmationEventHandler
  implements ICognitoPostConfirmationUpEventHandler
{
  static dataValidator = new DataValidator();
  private readonly userRepo: IUserRepo;

  constructor(private readonly userFactory: IUserResourceFactory) {
    this.userRepo = this.userFactory.getUserRepo();
  }

  isSignUpAllowed() {
    return process.env.IS_SIGN_UP_ALLOWED == "true" ?? false;
  }

  validateRequest(event: PreSignUpTriggerEvent) {
    try {
      BasicCognitoPostConfirmationEventHandler.dataValidator
        .validate(
          event.request.clientMetadata!["rawPassword"],
          "clientMetadata.rawPassword"
        )
        .notUndefined()
        .notNull()
        .isString()
        .notEmpty();
    } catch (error) {
      if (error instanceof DataValidationError) {
        throw new InvalidRequestApiError(
          `Request has one or more missing or invalid attributes: ${error.message}`
        );
      }
    }
  }

  async handleEvent(event: PostConfirmationTriggerEvent) {
    console.info("Recieved post confirmation event: ", event);
    // https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools-working-with-aws-lambda-triggers.html
    if (event.triggerSource === "PostConfirmation_ConfirmForgotPassword") {
      await this.handlePasswordResetEvent(event);
    } else if (event.triggerSource === "PostConfirmation_ConfirmSignUp") {
      await this.handlePostConfirmationSignUpEvent(event);
    }
  }

  async handlePasswordResetEvent(event: PostConfirmationTriggerEvent) {
    console.info("Event source is a password reset");
    // Validate request object
    const validationSchema = z.object({
      rawPassword: z.string().min(1),
    });

    validateApiRequestWithZod(validationSchema, event.request.clientMetadata);

    const rawPassword = event.request.clientMetadata!["rawPassword"];

    const user = await this.userRepo.getById(event.userName);
    if (user === null) {
      throw new InvalidRequestApiError("User does not exist");
    }

    try {
      await this.userRepo.update(event.userName, {
        password: this.userFactory.createUserPassword(rawPassword),
      });
    } catch (error) {
      console.error("Failed to update user password", error);
      throw error;
    }

    console.info(
      `Successfully updated user account user uuid:${event.userName}`
    );
  }

  async handlePostConfirmationSignUpEvent(event: PostConfirmationTriggerEvent) {
    console.info("Event source is a email confirmation");
    // Validate request object
    const validationSchema = z.object({
      email: z.string().min(1),
    });

    validateApiRequestWithZod(validationSchema, {
      email: event.request.userAttributes["email"],
    });

    const isAccountConfirmed =
      event.request.userAttributes["email_verified"] === "true";

    // In a cognito setup where a username isn't required, the username is instead a UUID.
    // This is the UUID we persist to the backend.
    const user = await this.userRepo.getById(event.userName);
    if (user === null) {
      throw new InvalidRequestApiError("User does not exist");
    }

    try {
      await this.userRepo.update(event.userName, {
        isAccountConfirmed,
      });
    } catch (error) {
      console.error("failed to update user isAccountConfirmed", error);
      if (error instanceof ObjectDoesNotExistDbError) {
        throw new InvalidRequestApiError("User does not exist");
      }
      throw error;
    }

    console.info(`Successfully confirmed user account: ${event.userName}`);
  }
}
