import { config } from "dotenv";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// Scripts run outside Next.js, so load .env.local / .env manually.
config({ path: ".env.local" });
config({ path: ".env" });

export const TABLE = process.env.DYNAMODB_TABLE || "lumora-store";
const endpoint = process.env.DYNAMODB_ENDPOINT || undefined;
const accessKeyId = process.env.LUMORA_AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.LUMORA_AWS_SECRET_ACCESS_KEY;

export const rawClient = new DynamoDBClient({
  region: process.env.LUMORA_AWS_REGION || "ap-south-1",
  endpoint,
  credentials:
    accessKeyId && secretAccessKey
      ? { accessKeyId, secretAccessKey }
      : endpoint
        ? { accessKeyId: "local", secretAccessKey: "local" }
        : undefined,
});

export const docClient = DynamoDBDocumentClient.from(rawClient, {
  marshallOptions: { removeUndefinedValues: true },
});

export function describeTarget(): string {
  return endpoint ? `local DynamoDB at ${endpoint}` : `AWS (${process.env.LUMORA_AWS_REGION || "ap-south-1"})`;
}
