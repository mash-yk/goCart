import { DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import { db, tableName } from "@/lib/db/client";
import { json, route } from "@/lib/api/handler";

export const dynamic = "force-dynamic";

/** Health check used by uptime monitors: reports whether the DynamoDB table is reachable. */
export const GET = route(async () => {
  try {
    const res = await db().send(new DescribeTableCommand({ TableName: tableName() }));
    return json({ status: "ok", database: res.Table?.TableStatus ?? "UNKNOWN" });
  } catch (error) {
    const name = (error as { name?: string }).name ?? "Error";
    return json({ status: "degraded", database: "UNREACHABLE", reason: name }, { status: 503 });
  }
});
