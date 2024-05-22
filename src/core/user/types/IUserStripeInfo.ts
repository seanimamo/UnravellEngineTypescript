/**
 * Used to map a user id to stripe information which is keyed on Stripe customer id.
 */
export interface IUserStripeInfo {
    /**
     * The unique user id
     */
    userId: string;
    /**
     * The Stripe customer id that belongs to the user
     */
    customerId: string;
}
