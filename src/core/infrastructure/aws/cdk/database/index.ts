export { DynamoDBStack } from "./dynamodb-stack";

/**
 * Core interface for Database table data.
 * This enables modularity with different types of databases in the future.
 */
export interface IDatabaseTableData {
    databaseType: "dynamodb";
}
