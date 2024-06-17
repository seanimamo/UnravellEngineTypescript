import { IPaymentPlan } from "../../types";

/**
 * Core interface for subscriptions. This interface allows our system to be payment-processor agnostic.
 */
export interface ISubscription extends IPaymentPlan {
  billingType: "SUBSCRIPTION";
  /**
   * The current status of the subscription
   */
  status: SubscriptionStatus;
  /**
   * The start date of the subscription
   */
  startDate: Date;
  /**
   * The end date of the subscription
   */
  endDate: Date;
}

/**
 * An enum of contanining different types of payment processors.
 */
export const SubscriptionStatus = {
  ACTIVE: "ACTIVE",
  CANCELLED: "CANCELLED",
  PAUSED: "PAUSED",
} as const;
/**
 * The typescript type for different subscription statuses.
 */
export type SubscriptionStatus =
  (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];
