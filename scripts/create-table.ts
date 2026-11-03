/**
 * Creates the single DynamoDB table with its two GSIs and enables TTL.
 * Safe to run more than once.
 *
 *   npm run db:create
 */
import {
  CreateTableCommand,
  DescribeTableCommand,
  ResourceInUseException,
  UpdateTimeToLiveCommand,
  waitUntilTableExists,
} from "@aws-sdk/client-dynamodb";
import { TABLE, describeTarget, rawClient } from "./env";

async function main() {
  console.log(`Creating table "${TABLE}" on ${describeTarget()}...`);
  try {
    await rawClient.send(
      new CreateTableCommand({
        TableName: TABLE,
        BillingMode: "PAY_PER_REQUEST",
        AttributeDefinitions: [
          { AttributeName: "PK", AttributeType: "S" },
          { AttributeName: "SK", AttributeType: "S" },
          { AttributeName: "GSI1PK", AttributeType: "S" },
          { AttributeName: "GSI1SK", AttributeType: "S" },
          { AttributeName: "GSI2PK", AttributeType: "S" },
          { AttributeName: "GSI2SK", AttributeType: "S" },
        ],
        KeySchema: [
          { AttributeName: "PK", KeyType: "HASH" },
          { AttributeName: "SK", KeyType: "RANGE" },
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: "GSI1",
            KeySchema: [
              { AttributeName: "GSI1PK", KeyType: "HASH" },
              { AttributeName: "GSI1SK", KeyType: "RANGE" },
            ],
            Projection: { ProjectionType: "ALL" },
          },
          {
            IndexName: "GSI2",
            KeySchema: [
              { AttributeName: "GSI2PK", KeyType: "HASH" },
              { AttributeName: "GSI2SK", KeyType: "RANGE" },
            ],
            Projection: { ProjectionType: "ALL" },
          },
        ],
      }),
    );
    await waitUntilTableExists({ client: rawClient, maxWaitTime: 120 }, { TableName: TABLE });
    console.log("Table created.");
  } catch (error) {
    if (error instanceof ResourceInUseException || (error as Error).name === "ResourceInUseException") {
      console.log("Table already exists, skipping creation.");
    } else {
      throw error;
    }
  }

  // Guest carts and wishlists carry an `expiresAt` attribute; TTL deletes them automatically.
  try {
    await rawClient.send(
      new UpdateTimeToLiveCommand({
        TableName: TABLE,
        TimeToLiveSpecification: { Enabled: true, AttributeName: "expiresAt" },
      }),
    );
    console.log("TTL enabled on `expiresAt`.");
  } catch (error) {
    const name = (error as Error).name;
    if (name === "ValidationException") console.log("TTL already enabled.");
    else console.warn(`Could not enable TTL (${name}). You can enable it in the AWS console.`);
  }

  const { Table } = await rawClient.send(new DescribeTableCommand({ TableName: TABLE }));
  console.log(`Status: ${Table?.TableStatus}. Indexes: ${Table?.GlobalSecondaryIndexes?.map((i) => i.IndexName).join(", ")}`);
}

main().catch((error) => {
  console.error("Failed to create table:", error);
  process.exit(1);
});
