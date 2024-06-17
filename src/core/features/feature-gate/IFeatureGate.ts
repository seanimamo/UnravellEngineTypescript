/**
 * Core interface for Feature gates. A feature gate enables us to limit how much access a user has to a given feature based on a given payment plan
 */
export interface IFeatureGate {
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
   * A Link back to the parent object this feature gate belongs to.
   * Feature gates can be used in a variety of different ways, attached to payment plans or to user roles and so forth.
   */
  parent: {
    type: string;
    id: string;
  };
  /**
   * Unique name of the feature.
   *
   * @remarks You should make these nice and readable, no need for a randomly generated string.
   */
  featureName: string;
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
