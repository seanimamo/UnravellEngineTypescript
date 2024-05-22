/**
 * A simple, custom interface for DynamoDb index information.
 */
export interface DynamoDbIndex {
    partitionKeyName: string;
    sortKeyName: string;
    /**
     * The name of the index. The primary index will not have a name.
     */
    indexName?: string;
}

/**
 * Constants for generic dynamodb index names.
 */
export const GENERIC_DYNAMODB_INDEXES = {
    PRIMARY: {
        partitionKeyName: "PKEY",
        sortKeyName: "SKEY",
    },

    GSI1: {
        partitionKeyName: "GSI1PKEY",
        sortKeyName: "GSI1SKEY",
        indexName: "GSI1",
    },

    GSI2: {
        partitionKeyName: "GSI2PKEY",
        sortKeyName: "GSI2SKEY",
        indexName: "GSI2",
    },

    GSI3: {
        partitionKeyName: "GSI3PKEY",
        sortKeyName: "GSI3SKEY",
        indexName: "GSI3",
    },

    GSI4: {
        partitionKeyName: "GSI4PKEY",
        sortKeyName: "GSI4SKEY",
        indexName: "GSI4",
    },

    GSI5: {
        partitionKeyName: "GSI5PKEY",
        sortKeyName: "GSI5SKEY",
        indexName: "GSI5",
    },

    GSI6: {
        partitionKeyName: "GSI6PKEY",
        sortKeyName: "GSI6SKEY",
        indexName: "GSI6",
    },

    GSI7: {
        partitionKeyName: "GSI7PKEY",
        sortKeyName: "GSI7SKEY",
        indexName: "GSI7",
    },

    GSI8: {
        partitionKeyName: "GSI8PKEY",
        sortKeyName: "GSI8SKEY",
        indexName: "GSI8",
    },

    GSI9: {
        partitionKeyName: "GSI9PKEY",
        sortKeyName: "GSI9SKEY",
        indexName: "GSI9",
    },

    GSI10: {
        partitionKeyName: "GSI10PKEY",
        sortKeyName: "GSI10SKEY",
        indexName: "GSI10",
    },

    GSI11: {
        partitionKeyName: "GSI11PKEY",
        sortKeyName: "GSI11SKEY",
        indexName: "GSI11",
    },

    GSI12: {
        partitionKeyName: "GSI12PKEY",
        sortKeyName: "GSI12SKEY",
        indexName: "GSI12",
    },

    GSI13: {
        partitionKeyName: "GSI13PKEY",
        sortKeyName: "GSI13SKEY",
        indexName: "GSI13",
    },

    GSI14: {
        partitionKeyName: "GSI14PKEY",
        sortKeyName: "GSI14SKEY",
        indexName: "GSI14",
    },

    GSI15: {
        partitionKeyName: "GSI15PKEY",
        sortKeyName: "GSI15SKEY",
        indexName: "GSI15",
    },

    GSI16: {
        partitionKeyName: "GSI16PKEY",
        sortKeyName: "GSI16SKEY",
        indexName: "GSI16",
    },

    GSI17: {
        partitionKeyName: "GSI17PKEY",
        sortKeyName: "GSI17SKEY",
        indexName: "GSI17",
    },

    GSI18: {
        partitionKeyName: "GSI18PKEY",
        sortKeyName: "GSI18SKEY",
        indexName: "GSI18",
    },

    GSI19: {
        partitionKeyName: "GSI19PKEY",
        sortKeyName: "GSI19SKEY",
        indexName: "GSI19",
    },

    GSI20: {
        partitionKeyName: "GSI20PKEY",
        sortKeyName: "GSI20SKEY",
        indexName: "GSI20",
    },
} as const;
