import { PreSignUpTriggerEvent } from "aws-lambda";
import { ApiError, InvalidRequestApiError } from "../../../../../api/ApiError";
import { DataValidationError, DataValidator } from "../../../../../util";
import { IUser, IUserResourceFactory } from "../../../../types";
import { ICognitoPreSignUpWebhook } from ".";
import { IUserRepo } from "../../../../database/types";
import { IStripeUserDataRepo } from "../../../../../payments/stripe/user-data/database";
import Stripe from "stripe";
import { IStripeUserData } from "../../../../../payments/stripe/user-data";

/**
 * This is a basic implementation of {@link ICognitoPreSignUpWebhook} which has logic for
 * handling persisting a user to your own applications database and running some simple checks.
 * It does not include the logic for AWS Lambda.
 *
 * The logic for this is intended to be wrapped within the expected AWS lambda function handler {@link CognitoPreSignUpTriggerLambda}
 *
 */
export class BasicCognitoPreSignUpWebhook implements ICognitoPreSignUpWebhook {
  static dataValidator = new DataValidator();
  private readonly userRepo: IUserRepo;
  private readonly userStripeDataRepo: IStripeUserDataRepo;

  constructor(
    private readonly userFactory: IUserResourceFactory,
    /**
     * When a {@link Stripe} client is provided, the webhook will create a new stripe customer
     * for the user as save the customer data {@link IStripeUserData} to the database.
     */
    private readonly stripeClient?: Stripe
  ) {
    this.userRepo = this.userFactory.getUserRepo();
    this.userStripeDataRepo = this.userFactory.getUserStripeDataRepo();
  }

  /**
   * If you do not specifiy the IS_SIGN_UP_ALLOWED environment variable then by default we'll set it to true.
   * Keeping this as a enviornment variable enables us to easily turn it off and on like a switch.
   */
  get isSignUpAllowed() {
    if (process.env.IS_SIGN_UP_ALLOWED === undefined) {
      return true;
    }
    return process.env.IS_SIGN_UP_ALLOWED == "true" ?? false;
  }

  validateRequest(event: PreSignUpTriggerEvent) {
    try {
      BasicCognitoPreSignUpWebhook.dataValidator
        .validate(event.request.userAttributes["email"], "userAttributes.email")
        .notUndefined()
        .notNull()
        .isString()
        .notEmpty();
      BasicCognitoPreSignUpWebhook.dataValidator
        .validate(
          event.request.userAttributes["custom:firstName"],
          "userAttributes[custom:firstName]"
        )
        .ifNotUndefined()
        .notNull()
        .isString()
        .notEmpty();
      BasicCognitoPreSignUpWebhook.dataValidator
        .validate(
          event.request.userAttributes["custom:lastName"],
          "userAttributes[custom:lastName]"
        )
        .ifNotUndefined()
        .notNull()
        .isString()
        .notEmpty();
      BasicCognitoPreSignUpWebhook.dataValidator
        .validate(event.request.clientMetadata, "clientMetadata")
        .notUndefined()
        .notNull();
      BasicCognitoPreSignUpWebhook.dataValidator
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

  async handleEvent(event: PreSignUpTriggerEvent) {
    const loggedEvent = { ...event };
    loggedEvent.request.clientMetadata!["rawPassword"] = "***";
    console.log("recieved pre sign up event: ", loggedEvent);

    if (!this.isSignUpAllowed) {
      throw new SignUpClosedError();
    }

    this.validateRequest(event);

    const userName = event.userName; // This will be a UUID when cognito is not configured to have a username.
    const email = event.request.userAttributes["email"];
    const rawPassword = event.request.clientMetadata!["rawPassword"];
    const firstName = event.request.userAttributes["custom:firstName"];
    const lastName = event.request.userAttributes["custom:lastName"];

    const user = this.userFactory.createUser({
      email: email,
      id: userName,
      textPassword: rawPassword,
      firstName,
      lastName,
    });

    await this.userRepo.save(user);
    console.log(`successfully created and saved new user ${userName}`);

    if (this.stripeClient) {
      await this.createStripeCustomer(user, this.stripeClient);
    }
    return;
  }

  async createStripeCustomer(user: IUser, stripeClient: Stripe) {
    const stripeName = user.id;
    let stripeCustomer: Stripe.Customer;

    try {
      // Create Customer from body params.
      const params: Stripe.CustomerCreateParams = {
        email: user.email,
        name: stripeName,
        metadata: {
          externalUserId: user.id,
        },
      };

      stripeCustomer = await stripeClient.customers.create(params);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Error trying to create a stripe customer.";
      console.log(errorMessage);
      throw err;
    }

    const customerId = stripeCustomer.id;

    const userStripeData: IStripeUserData = {
      customerId: customerId,
      userId: user.id,
    };

    await this.userStripeDataRepo.save(userStripeData);
    console.log(
      `successfully created and saved new stripe customer with id ${customerId} for user with id ${user.id}`
    );
  }
}

export class SignUpClosedError extends ApiError {
  static type = "SignUpClosed";
  constructor(message: string = SignUpClosedError.type, statusCode = 400) {
    super(statusCode, SignUpClosedError.type, message);
  }
}
