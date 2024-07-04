import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { DynamoDbIndex } from "./DynamoDBConstants";
import { IPaginatedDatabaseResponse } from "..";

export type QueryHint = {
  index: DynamoDbIndex;
};

export interface PaginatedDynamoDbResponse<T>
  extends IPaginatedDatabaseResponse<T> {
  data: T;
  paginationToken: Record<string, AttributeValue> | null;
  queryHint?: QueryHint;
}
