import { OAuth2Client } from "google-auth-library";
import { IApiRequestProcessor } from "../../IApiRequestProcessor";
import { IApiResponse } from "../../IApiResponse";
import { IApiRequest } from "../../IApiRequest";

export interface IGetGoogleOAuthUrlApiRequest extends IApiRequest {}

export interface IGetGoogleOAuthUrlApiResponse extends IApiResponse {
  body: {
    data: {
      url: string;
    };
  };
}

/**
 * API that returns a Google OAuthUrl that will give us an access token to retrieve the users basic google information so we
 * can create a internal account for them. When users go to this url they will be redirected to sign in with google and after
 * sigining in they will be redirecting back to theredirect url speicified in the classes constructor which is used to create the
 * {@link OAuth2Client | Google OAuth client}. This redirect URL should be set to your applications front end domain in most cases
 */
export class BasicGetGoogleSignInOAuthUrlApi<TSourceEvent, TAuthorizationData>
  implements
    IApiRequestProcessor<
      TSourceEvent,
      TAuthorizationData,
      IGetGoogleOAuthUrlApiRequest,
      IGetGoogleOAuthUrlApiResponse
    >
{
  private readonly googleOAuth2Client: OAuth2Client;

  constructor(googleOAuthClientOpts: {
    clientId: string;
    clientSecret: string;
    redirectUrl: string;
  }) {
    this.googleOAuth2Client = new OAuth2Client(
      googleOAuthClientOpts.clientId,
      googleOAuthClientOpts.clientSecret,
      googleOAuthClientOpts.redirectUrl
    );
  }

  async processRequest(): Promise<IGetGoogleOAuthUrlApiResponse> {
    // TODO - Determine if this is enough scopes.
    const authorizeUrl = await this.googleOAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
      ],
      // Determine what happens here when set to select_account.
      // When the users tries to login again later we want them to not have to enter their gmail email if necessary.
      prompt: "consent",
    });

    return {
      statusCode: 200,
      body: {
        data: {
          url: authorizeUrl,
        },
      },
    };
  }
}
