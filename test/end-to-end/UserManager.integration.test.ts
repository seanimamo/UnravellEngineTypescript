import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  UserNotFoundException,
} from "@aws-sdk/client-cognito-identity-provider";
import { CognitoDao } from "../../src/core/user/authentication/aws-cognito/CognitoDao";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { fromIni } from "@aws-sdk/credential-providers";
import { UserAccountManager } from "../../src/core/user/util/UserAccountManager";
import { UserResourceFactory } from "../../src/app/user/UserResourceFactory";

test("UserAccountManager Create and Delete User", async () => {
  const userPoolId = "us-east-1_ZLA22htJb";
  const userPoolClientId = "68ldgsqnmc63bbgh4mb10onhjc";

  const cognitoDao = new CognitoDao(
    new CognitoIdentityProviderClient({
      credentials: fromIni({ profile: "unravellEmailMaster" }),
    }),
    userPoolId,
    userPoolClientId
  );

  const dbClient = new DynamoDBClient({
    credentials: fromIni({ profile: "unravellEmailMaster" }),
  });

  const userFactory = new UserResourceFactory(dbClient, "UserTable");

  const userRepo = userFactory.getUserRepo();

  const userManager = new UserAccountManager(cognitoDao, userRepo, userFactory);

  const user = await userManager.signUp(
    "testPassword12",
    "seanimamo@gmail.com"
  );

  // Test user manager creates in Cognito AND app database ------

  const getUserResponse = await userRepo.getByUsername(user.userName);
  const userFromDb = getUserResponse.data;
  expect(userFromDb).toBeDefined();

  const userFromCognito = await cognitoDao.adminGetUser(user.userName);
  expect(userFromCognito).toBeDefined();

  debugger;
  // Test user manager deletes from Cognito AND app database ------

  await userManager.deleteUser(userFromDb!.userName);

  const userFromDbAfterDeletion = await userRepo.getByUsername(user.userName);
  expect(userFromDbAfterDeletion).toBeNull();

  await expect(cognitoDao.adminGetUser(user.userName)).rejects.toThrow(
    UserNotFoundException
  );

  debugger;
});
