/**
 * Core interface for tracking when an email is sent to a user.
 */
export interface ISentEmailRecord {
  /**
   * Unique id of this object
   */
  id: string;
  /**
   * The email address that the email was sent to
   */
  recipientEmail: string;
  /**
   * The subject line of the email.
   */
  subject: string;
  /**
   * The date that the email was sent.
   */
  sentDate: Date;
}
