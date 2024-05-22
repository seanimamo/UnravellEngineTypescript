import { IDatabaseResponse } from "../../../database";
import { IUserStripeInfo } from "../../types/IUserStripeInfo";

/**
 * Interface for saving, retrieving & updating a users stripe info in various ways
 */
export interface IUserStripeInfoRepo {
    save(userStripeInfo: IUserStripeInfo): Promise<IDatabaseResponse<any>>;
    /**
     * Gets an internal users stripe info by their stripe customer id.
     * @param customerId The stripe customer Id
     */
    getByCustomerId(
        customerId: string
    ): Promise<IDatabaseResponse<IUserStripeInfo | null>>;
    /**
     * Gets an internal users stripe info by their internal user id.
     * @param userId The users unique Id
     */
    getByUserId(
        userId: string
    ): Promise<IDatabaseResponse<IUserStripeInfo | null>>;
}
