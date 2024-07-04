/**
 * Core interface for an Email Waitlist registration
 */
export interface IEmailWaitlistRegistration {
  /**
   * The email address that was registered
   */
  email: string;
  /**
   * Date that represents when object was created
   */
  createDate: Date;
}
