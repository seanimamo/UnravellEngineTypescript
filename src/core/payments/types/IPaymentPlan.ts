/**
 * Core interfaces for payments plans. A payment plan could be a subscription or a one time payment.
 */
export interface IPaymentPlan {
  /**
   * The internal unique id of the object
   */
  id: string;
  /**
   * This is used to prevent concurrent database updates from
   * clobbering eachother.
   */
  objectVersion: number;
  /**
   * The type of payment plan
   */
  type: PaymentPlanType;
  /**
   * The type of payment processor used to handle this subscription
   */
  paymentProcessor: PaymentProcessorType;
  /**
   * The Id of the user
   */
  userId: string;
  /**
   * The unique ID of the specific plan
   */
  planId: string;
  /**
   * The display name of the specific plan.
   */
  planDisplayName: string;
}

/**
 * An object that acts as an enum contanining different types of payment plan.
 */
export const PaymentPlanType = {
  ONE_TIME: "ONE_TIME",
  SUBSCRIPTION: "SUBSCRIPTION",
} as const;
/**
 * The typescript type for different Payment plan types.
 */
export type PaymentPlanType =
  (typeof PaymentPlanType)[keyof typeof PaymentPlanType];

/**
 * An object of contanining different types of payment processors.
 */
export const PaymentProcessorType = {
  /**
   * The Stripe service payment processor
   */
  STRIPE: "stripe",
  /**
   *  A custom build payment processor solution
   */
  CUSTOM: "custom",
} as const;
/**
 * The typescript type for different Payment Processor types.
 */
export type PaymentProcessorType =
  (typeof PaymentProcessorType)[keyof typeof PaymentProcessorType];
