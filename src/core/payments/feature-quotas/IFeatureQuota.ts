/**
 * Core interface for Feature quotas. A feature quota enables us to limit how much access a user has to a given feature based on a given payment plan
 */
export interface IFeatureQuota {
  /**
   * Unique identifier for the quota object
   */
  id: string;
  /**
   * This is used to prevent concurrent database updates from
   * clobbering eachother.
   */
  objectVersion: number;
  /**
   * Id of the user this featuer quota belongs to
   */
  userId: string;
  /**
   * Link back to the IPaymentPlan object
   */
  paymentPlanId: string;
  /**
   * Unique id of the feature.
   *
   * @remarks You should make these nice and readable, no need for a randomly generated string.
   */
  featureId: string;
  /**
   * Total allowed usages in the specified period
   */
  maxUsage?: number;
  /**
   * How many times the feature has been used
   */
  used?: number;
  /**
   * When the quota resets
   */
  resetDate?: Date;
  /**
   * Determines if the user has unlimited access to the feature. True if the user has unlimited access, false otherwise
   */
  unlimitedAccess: boolean;
}
