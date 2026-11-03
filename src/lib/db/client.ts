import "server-only";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { getConfig } from "@/lib/config";

/**
 * A single DynamoDB Document Client shared across requests.
 * In development the instance is cached on globalThis so hot reloads
 * don't create a new connection pool on every change.
 */
const globalForDb = globalThis as unknown as { __lumoraDb?: DynamoDBDocumentClient };

function createClient(): DynamoDBDocumentClient {
  const { aws } = getConfig();
  const base = new DynamoDBClient({
    region: aws.region,
    endpoint: aws.endpoint,
    credentials: aws.credentials,
    maxAttempts: 3,
  });
  return DynamoDBDocumentClient.from(base, {
    marshallOptions: { removeUndefinedValues: true, convertEmptyValues: false },
  });
}

export function db(): DynamoDBDocumentClient {
  if (!globalForDb.__lumoraDb) {
    globalForDb.__lumoraDb = createClient();
  }
  return globalForDb.__lumoraDb;
}

export function tableName(): string {
  return getConfig().tableName;
}
