import { PreSignUpTriggerEvent } from "aws-lambda";
import { DataValidator } from "@/core/util";
import {
  IUser,
  IUserResourceFactory,
  USER_AUTH_TYPES,
} from "@/core/user/types";
import { ICognitoPreSignUpEventHandler } from ".";
import { IUserRepo } from "@/core/user/database";
import { IStripeUserDataRepo } from "../../../../../payments/stripe/user-data/database";
import Stripe from "stripe";
import { IStripeUserData } from "../../../../../payments/stripe/user-data";
import { SignUpClosedError } from "@/core/api/public/error";
import { z } from "zod";
import { validateApiRequestWithZod } from "@/core/api/utils/validationUtils";

/**
 * This is a basic implementation of {@link ICognitoPreSignUpEventHandler } which has logic for
 * persisting a cognito user to your own applications database and running some simple checks.
 *
 * The logic for this is intended to be wrapped within the expected AWS lambda function handler
 */
export class BasicCognitoPreSignUpEventHandler
  implements ICognitoPreSignUpEventHandler
{
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

  extractAndValidateEvent(event: PreSignUpTriggerEvent) {
    const eventPayload = {
      userName: event.userName,
      email: event.request.userAttributes.email,
      given_name: event.request.userAttributes.given_name,
      family_name: event.request.userAttributes.family_name,
      rawPassword: event.request.clientMetadata?.rawPassword,
    };

    const validationSchema = z.object({
      email: z.string().email(),
      given_name: z.string().min(1),
      family_name: z.string().min(1),
      rawPassword: z.string().min(1),
    });

    validateApiRequestWithZod(validationSchema, eventPayload);

    return eventPayload;
  }

  async handleEvent(event: PreSignUpTriggerEvent) {
    const loggedEvent = { ...event };
    loggedEvent.request.clientMetadata!["rawPassword"] = "***";
    console.log("recieved pre sign up event: ", loggedEvent);

    if (!this.isSignUpAllowed) {
      throw new SignUpClosedError();
    }

    const eventPayload = this.extractAndValidateEvent(event);

    const userName = eventPayload.userName; // This will be a UUID when cognito is not configured to have a username.
    const email = eventPayload.email;
    const rawPassword = eventPayload.rawPassword;
    const firstName = eventPayload.given_name;
    const lastName = eventPayload.family_name;

    const user = this.userFactory.createUser({
      email: email,
      id: userName,
      textPassword: rawPassword,
      authType: USER_AUTH_TYPES.INTERNAL,
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
