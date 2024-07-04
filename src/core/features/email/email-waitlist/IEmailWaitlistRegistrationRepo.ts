import { IDatabaseResponse } from "@/core/database/index";
import { IEmailWaitlistRegistration } from "./IEmailWaitlistRegistration";

/**
 * Core interface for CRUD operations with {@link IEmailWaitlistRegistration} objects.
 */
export interface IEmailWaitlistRegistrationRepo {
  /**
   * Saves an {@link IEmailWaitlistRegistration} to the database
   */
  save(
    registration: IEmailWaitlistRegistration
  ): Promise<IDatabaseResponse<any>>;

  /**
   * Gets an {@link IEmailWaitlistRegistration} by the email it was sent to
   * @remarks - the email address of the regristration is effectively a unique id
   */
  getByEmail(
    email: string
  ): Promise<IDatabaseResponse<IEmailWaitlistRegistration | null>>;

  /**
   * Deletes an {@link IEmailWaitlistRegistration} by the email it was sent to
   * @remarks - the email address of the regristration is effectively a unique id
   */
  delete(email: string): Promise<IDatabaseResponse<any>>;
}
