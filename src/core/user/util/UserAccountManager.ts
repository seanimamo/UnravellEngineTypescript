import { CognitoDao } from "../authentication/aws-cognito/CognitoDao";
import { IUserRepo } from "../database/types";
import { IUser, IUserResourceFactory } from "../types";

export class UserAccountManager {
  constructor(
    private readonly cognitoDao: CognitoDao,
    private readonly userRepo: IUserRepo,
    private readonly userFactory: IUserResourceFactory
  ) {}

  /**
   * Creates a new user, saving them both our database as well as AWS Cognito.
   * **Important: This method expects you are using a Cognito userpool that uses email for sign up and NOT username.
   *
   * @remarks - saving to both databases decouples us from cognito while still being able to use
   * it for general authentications
   */
  async signUp(rawPassword: string, email: string) {
    const cognitoSignUpResult = await this.cognitoDao.signUp(
      email,
      rawPassword,
      email
    );

    // This value is globally unique, essentially a UUID since username is changeable.
    const cognitoUserUUid = cognitoSignUpResult.UserSub;

    if (!cognitoUserUUid) {
      console.error("Cognito returned undefined for the user sub value.");

      // delete user from cognito, we're expected this.

      throw new Error("Cognito returned undefined for the user sub value.");
    }

    const user: IUser = this.userFactory.createUser({
      id: cognitoUserUUid,
      textPassword: rawPassword,
      email,
    });

    await this.userRepo.save(user);

    return user;
  }

  /**
   * Confirm users account using a unique verification code.
   *
   * @param uuid The UUID of the user
   * @param verificationCode The verification code sent to the user when they signed up.
   */
  async confirmSignUp(uuid: string, verificationCode: string) {
    try {
      await this.cognitoDao.confirmSignUp(verificationCode, uuid);
    } catch (error) {
      console.log(`Failed to confirm user sign up user uuid: ${uuid}`);
      throw error;
    }

    await this.userRepo.update(uuid, {
      isAccountConfirmed: true,
    });
  }

  /**
   * Initiates the forgot password process for a user.git
   * This typically means sending the user either an email or an SMS message with a code
   * that they must enter to reset their password.
   *
   * @remarks - The UI can do this using AWS amplify. This not be expoed via in API for now.
   *
   * @param uuid - the UUID of the user
   */
  async initiateForgotUserPassword(uuid: string) {
    await this.cognitoDao.forgotPassword(uuid);
  }

  /**
   * Completes the password reset process, using {@link CognitoDao.confirmForgotPassword} to update the password
   * as well as updating the password in our own database.
   *
   * @param newRawPassword - Should be a plain text password
   */
  async confirmForgottenPassword(
    uuid: string,
    confirmationCode: string,
    newRawPassword: string
  ) {
    const getUserResponse = await this.userRepo.getById(uuid);
    const user = getUserResponse.data;
    if (user !== null) {
      // We attempt to confirm the forgotten password with cognito first
      // because the confirmation code could be incorrect.

      try {
        await this.cognitoDao.confirmForgotPassword(
          uuid,
          confirmationCode,
          newRawPassword
        );
      } catch (error) {
        // TODO: Catch the error type if the confirmation code is incorrect. Perhaps an error is not thrown.

        console.error(
          `Failed to confirm new password with AWS Cognito uuid: ${uuid}`
        );

        console.warn("Rolling backing user password update from database");
        const oldUserPassword = user.password;
        try {
          await this.userRepo.update(uuid, {
            password: oldUserPassword,
          });
        } catch (error) {
          console.error(`Failed to resave old password for user uuid: ${uuid}`);
        }
      }

      // Update user password in our own database
      const newPassword = this.userFactory.createUserPassword(newRawPassword);
      try {
        await this.userRepo.update(uuid, {
          password: newPassword,
        });
      } catch (error) {
        console.error(
          `failed to update database with new password for uuid ${uuid}`
        );
        throw error;
      }
    }
  }

  /**
   * Deletes the given user and all their stored user data.
   * Because deleting a user AWS Cognito could potentially fail, this function will attempt to
   * re-save the user to our own database if the deletion from cognito does not work.
   *
   * @todo - get all linked emails for the user account and delete data for them.
   */
  async deleteUser(uuid: string) {
    const getUserResponse = await this.userRepo.getById(uuid);
    const user = getUserResponse.data;
    if (user !== null) {
      try {
        await this.cognitoDao.adminDeleteUser(uuid);
      } catch (error) {
        console.error(`Failed to delete user from aws cognito uuid: ${uuid}`);
        throw error;
      }

      try {
        await this.userRepo.delete(user);
        console.log(`deleted user from database uuid: ${uuid}`);
      } catch (error) {
        console.error(`Failed to delete user from database uuid: ${uuid}`);
        throw error;
      }
    }
  }

  /**
   * Deletes all user data
   */
  // private async deleteUserData(username: string, emailAddresses: string[]) {
  //     const emailClassificationLlmTaskRepo =
  //         new EmailClassificationLlmTaskRepository(this.dbClient);
  //     const emailPrioritizationLlmTaskRepo =
  //         new EmailPrioritizationLlmTaskRepository(this.dbClient);
  //     const emailActionItemsLlmTaskRepo =
  //         new EmailActionItemsLlmTaskRepository(this.dbClient);
  //     const emailLlmTaskGroupRepo = new EmailLlmTaskGroupRepository(
  //         this.dbClient
  //     );
  //     const emailLlmTaskReportRepository = new EmailLlmTaskReportRepository(
  //         this.dbClient
  //     );
  //     for (const emailAddress of emailAddresses) {
  //         // Delete user email LLM classification tasks for the user
  //         const classificationTasks =
  //             await emailClassificationLlmTaskRepo.listByUserNameAndEmailAddress(
  //                 username,
  //                 emailAddress
  //             );
  //         for (let task of classificationTasks.data) {
  //             await emailClassificationLlmTaskRepo.delete(task);
  //         }

  //         // Delete user email LLM prioritization tasks for the user
  //         const prioritizationTask =
  //             await emailPrioritizationLlmTaskRepo.listByUserNameAndEmailAddress(
  //                 username,
  //                 emailAddress
  //             );
  //         await emailPrioritizationLlmTaskRepo.delete(
  //             prioritizationTask.data[0]
  //         );

  //         // Delete user email LLM action item tasks for the user
  //         const actionItemsTask =
  //             await emailActionItemsLlmTaskRepo.listByUserNameAndEmailAddress(
  //                 username,
  //                 emailAddress
  //             );
  //         await emailActionItemsLlmTaskRepo.delete(actionItemsTask.data[0]);

  //         // Delete user email LLM task groups item tasks for the user
  //         const taskGroups =
  //             await emailLlmTaskGroupRepo.listByUserNameAndEmailAddress(
  //                 username,
  //                 emailAddress
  //             );
  //         for (let taskGroup of taskGroups.data) {
  //             await emailLlmTaskGroupRepo.delete(taskGroup);
  //         }

  //         // Delete user task reports
  //         const taskReports = await emailLlmTaskReportRepository.list(
  //             username,
  //             emailAddress
  //         );

  //         for (let report of taskReports.data) {
  //             await emailLlmTaskReportRepository.delete(report);
  //         }
  //     }
  // }
}
