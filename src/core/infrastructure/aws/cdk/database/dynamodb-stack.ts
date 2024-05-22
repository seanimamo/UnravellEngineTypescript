import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Stage } from "../../../common/Stage";
import { Construct } from "constructs";
import {
    AttributeType,
    Billing,
    Table,
    TableV2,
} from "aws-cdk-lib/aws-dynamodb";
import { InfraResourceIdBuilder } from "../../../common/InfraResourceIdBuilder";
import {
    DynamoDbIndex,
    GENERIC_DYNAMODB_INDEXES,
} from "../../../../database/dynamodb";
import { IDatabaseTableData } from ".";

/**
 * Props given to the constructor of {@link DynamoDBStack}
 */
interface DynamoDBStackProps extends StackProps {
    /**
     * The infrastructure stage this DynamoDB Stack is a part of e.g. Beta, Prod.
     */
    stage: Stage;
    /**
     * Utility Tool used for creating consistent id's & names for our AWS resources.
     */
    idBuilder: InfraResourceIdBuilder;
    tableProps: {
        /**
         * Creates the user table name with the given name
         */
        user: {
            tableName: string;
        };
        /**
         *  If provided, creates a table for storing Stripe Subscriptions.
         */
        stripeSubscriptionCache?: {
            tableName: string;
        };
    };
}

/**
 * A simple interface for consolidating DynamoDb table information that isn't directly accessible from the {@link TableV2}
 */
export interface DynamoTableData extends IDatabaseTableData {
    databaseType: "dynamodb";
    table: TableV2;
    tableName: string;
    /**
     * AWS ARN's for the tables Global Secondary Indexes 1 through 20
     */
    globalSecondaryIndexes: (DynamoDbIndex & { arn: string })[];
}

/**
 * This class is used to produce NOSQL databases on AWS using AWS DnamoDB.
 * It creates the necessary DynamoDB tables required for our core application
 */
export class DynamoDBStack extends Stack {
    /**
     * A utility for creating consistent resource names in AWS.
     */
    private readonly idBuilder: InfraResourceIdBuilder;

    public readonly userTableData: DynamoTableData;
    public readonly stripeCacheTableData?: DynamoTableData;

    constructor(scope: Construct, id: string, props: DynamoDBStackProps) {
        super(scope, id, props);

        this.idBuilder = props.idBuilder;

        const { stage, tableProps } = props;

        /**
         * By simply creating this obect, this DynamoDbStack will produce a new DynamoDB Table.
         * Creates Table used for storing user data enitities as well leaving potential for other data entities
         */
        this.userTableData = this.createGenericDynamoDBTable(
            tableProps.user.tableName
        );

        if (tableProps.stripeSubscriptionCache) {
            /**
             * Creates Table used for storing a cache of stripe subscription data enitities
             * as well leaving potential for other data entities.
             */
            this.stripeCacheTableData = this.createGenericDynamoDBTable(
                tableProps.stripeSubscriptionCache.tableName
            );
        }
    }

    /**
     * Helper function to produce a new DynamoDB Table with generic partition, sort and GSI keys
     * which enables flexilbity by being able to hold multiple types of entities. By default, all 20 GSI's are created
     * since there is no added cost with AWS.
     */
    private createGenericDynamoDBTable(resourceName: string): DynamoTableData {
        const tableName = this.idBuilder.createStageBasedId(resourceName);

        /**
         * By simply creating this class, this DynamoDbStack will produce a new DynamoDB Table.
         * In this case, it is the Table used for storing a cache of stripe subscription data enitities
         * as well leaving potential for other data entities.
         *
         * Because this table uses generic names for parition and sort keys, we give ourselves extendability for the future
         * with being able to store more than one entity type in a single table.
         */
        const table = new TableV2(this, tableName, {
            tableName: tableName,
            /**
             * This billing mode will provide significant cost savings at smaller scale
             * because we only pay for requests we make. It's only worth switching to a provisioned mode
             * at large scale.
             */
            billing: Billing.onDemand(),
            /**
             * Enabling point in time recovery enables us to reset or our table back to a given point in time, like a backup.
             */
            pointInTimeRecovery: true,
            /**
             * When the stack that this table belongs to is deleted, the database will be retained.
             * This means you have to go manually delete it but it protects you from losing all your application data.
             */
            removalPolicy: RemovalPolicy.RETAIN,
            partitionKey: {
                name: GENERIC_DYNAMODB_INDEXES.PRIMARY.partitionKeyName,
                type: AttributeType.STRING,
            },
            sortKey: {
                name: GENERIC_DYNAMODB_INDEXES.PRIMARY.sortKeyName,
                type: AttributeType.STRING,
            },
            /**
             * This may or may not be in use but we add it here incase we want to use it later.
             * The timeToLiveAttribute enables creating records that can expire after a certain amount of time,
             * triggering deletion, an AWS Lambda for some processing, and more.
             */
            timeToLiveAttribute: "database-ttl",
        });

        const gsiIndexesToAdd = [
            GENERIC_DYNAMODB_INDEXES.GSI1,
            GENERIC_DYNAMODB_INDEXES.GSI2,
            GENERIC_DYNAMODB_INDEXES.GSI3,
            GENERIC_DYNAMODB_INDEXES.GSI4,
            GENERIC_DYNAMODB_INDEXES.GSI5,
            GENERIC_DYNAMODB_INDEXES.GSI6,
            GENERIC_DYNAMODB_INDEXES.GSI8,
            GENERIC_DYNAMODB_INDEXES.GSI9,
            GENERIC_DYNAMODB_INDEXES.GSI10,
            GENERIC_DYNAMODB_INDEXES.GSI11,
            GENERIC_DYNAMODB_INDEXES.GSI12,
            GENERIC_DYNAMODB_INDEXES.GSI13,
            GENERIC_DYNAMODB_INDEXES.GSI14,
            GENERIC_DYNAMODB_INDEXES.GSI15,
            GENERIC_DYNAMODB_INDEXES.GSI16,
            GENERIC_DYNAMODB_INDEXES.GSI17,
            GENERIC_DYNAMODB_INDEXES.GSI18,
            GENERIC_DYNAMODB_INDEXES.GSI19,
            GENERIC_DYNAMODB_INDEXES.GSI20,
        ];

        for (const gsiIndex of gsiIndexesToAdd) {
            table.addGlobalSecondaryIndex({
                indexName: gsiIndex.indexName!,
                partitionKey: {
                    name: gsiIndex.partitionKeyName,
                    type: AttributeType.STRING,
                },
                sortKey: {
                    name: gsiIndex.sortKeyName,
                    type: AttributeType.STRING,
                },
            });
        }

        const globalSecondaryIndexes: (DynamoDbIndex & { arn: string })[] =
            gsiIndexesToAdd.map((index) => {
                return {
                    partitionKeyName: index.partitionKeyName,
                    sortKeyName: index.sortKeyName,
                    indexName: index.indexName,
                    arn: getDynamoDbGsiArn(table, index.indexName),
                };
            });

        return {
            databaseType: "dynamodb",
            table,
            tableName,
            globalSecondaryIndexes: globalSecondaryIndexes,
        };
    }
}

/**
 * Utility function for getting the ARN for an given GSI on a DynamoDB table since it cannot be accessed
 * from the table directly.
 */
export function getDynamoDbGsiArn(table: TableV2 | Table, indexName: string) {
    return `${table.tableArn}/index/${indexName!}`;
}
