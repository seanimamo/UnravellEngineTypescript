// import { IUserResourceFactory } from "../../../../../user/types";
// import { IApiResponse, IApiRequestProcessor } from "../../..";

// export interface ISignInWithGoogleApiRequest {
//   userId: string;
//   authorizationCode: string;
// }

// export interface ISignInWithGoogleApiResponse extends IApiResponse {
//   body: {
//     data: {
//       creationStatus:
//         | "linked_to_existing_internal_account"
//         | "new_google_linked_account"
//         | "google_linked_account_already_exists";
//     };
//   };
// }

// export abstract class SignInWithGoogleApi<TSourceApiEvent, TAuthorizationData>
//   implements
//     IApiRequestProcessor<
//       TSourceApiEvent,
//       ISignInWithGoogleApiRequest,
//       ISignInWithGoogleApiResponse
//     >
// {
//   constructor(private readonly userResourceFactory: IUserResourceFactory) {}

//   extractRequest?(sourceEvent: TSourceApiEvent): ISignInWithGoogleApiRequest {
//     throw new Error("Method not implemented.");
//   }

//   abstract validateRequestData?(
//     request: ISignInWithGoogleApiRequest
//   ): Promise<void>;

//   abstract authorizeRequest?(
//     sourceEvent: TSourceApiEvent,
//     request?: ISignInWithGoogleApiRequest
//   ): Promise<void>;

//   async processRequest(
//     request: ISignInWithGoogleApiRequest
//   ): Promise<ISignInWithGoogleApiResponse> {
//     // 1. Use the google OAuth credentials to pull the users email address.
//     // 2. Make a call using the UserRepo to retrive the user by email and see if we can find an existing user.
//     // Scenario A: The the user already has an account in our database the provided email and an auth type 'internal'
//     // TBD - This would require an account link.
//     // Scenario B: The the user already has an account in our database the provided email and an auth type 'google'
//     // 1. Hit cognito with a sign up request using the default internal password and return the authentication token
//     // Scenario C: The user does not have an internal account with the provided email.
//     // 1. Since the users doesn't exist, we hit the cognito api to create a new user with the google email address and some hidden internal default password.
//     // Since we have a presignup cognito lambda, that will trigger the typical new user creation workflow. (maybe this logic should consolidated be in an api processor for reuse?)
//     // 2. After the user is successfully created, we'll have to hit cognito with a sign in request and return the authentication token.

//     return {
//       statusCode: 200,
//       body: {
//         data: {
//           creationStatus: "new_google_linked_account",
//         },
//       },
//     };
//   }
// }
