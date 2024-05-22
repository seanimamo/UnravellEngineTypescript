import { Stage } from "./Stage";

/**
 * A utility for creating consistent resource names for infrastructure.
 */
export class InfraResourceIdBuilder {
    constructor(
        public readonly appName: string,
        public readonly stage: Stage
    ) {}

    createStageBasedId(resourceName: string) {
        return `${this.stage}-${this.appName}-${resourceName}`;
    }
}
