import "server-only";
import { GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { db, tableName } from "@/lib/db/client";
import { withDb } from "@/lib/db/errors";
import { keys } from "@/lib/db/keys";
import { stripKeys } from "@/lib/db/utils";
import { queryOwnerItems } from "@/lib/db/repositories/owner-items";
import type { Order, OrderStatus, PaymentStatus } from "@/types";

// In-memory fallback for local development if DynamoDB is not yet connected
const globalForOrders = globalThis as unknown as { __lumoraOrders?: Map<string, Order> };
if (!globalForOrders.__lumoraOrders) {
  globalForOrders.__lumoraOrders = new Map<string, Order>();
}

function toItem(order: Order) {
  return {
    ...keys.order(order.id),
    entityType: "Order",
    ...order,
  };
}

function toOwnerItem(order: Order) {
  return {
    ...keys.ownerOrder(order.ownerId, order.id),
    entityType: "OwnerOrder",
    ...order,
  };
}

export const orderRepository = {
  async create(order: Order): Promise<Order> {
    globalForOrders.__lumoraOrders?.set(order.id, order);

    try {
      await withDb("order.create", async () => {
        // Write the primary order record
        await db().send(
          new PutCommand({
            TableName: tableName(),
            Item: toItem(order),
          }),
        );
        // Also index under owner for owner order queries
        await db().send(
          new PutCommand({
            TableName: tableName(),
            Item: toOwnerItem(order),
          }),
        );
      });
    } catch (error) {
      console.warn("[orderRepository.create] DynamoDB write failed, stored in-memory for dev:", error);
    }

    return order;
  },

  async getById(id: string): Promise<Order | null> {
    try {
      const item = await withDb("order.getById", async () => {
        const res = await db().send(
          new GetCommand({
            TableName: tableName(),
            Key: keys.order(id),
          }),
        );
        return res.Item ? stripKeys<Order>(res.Item) : null;
      });
      if (item) return item;
    } catch {
      // Fallback to in-memory store in dev
    }

    return globalForOrders.__lumoraOrders?.get(id) ?? null;
  },

  async listByOwner(ownerId: string): Promise<Order[]> {
    try {
      const items = await queryOwnerItems(ownerId, keys.orderPrefix);
      if (items.length > 0) {
        return items.map((i) => stripKeys<Order>(i));
      }
    } catch {
      // Fallback to in-memory store in dev
    }

    const inMemory: Order[] = [];
    for (const ord of globalForOrders.__lumoraOrders?.values() ?? []) {
      if (ord.ownerId === ownerId) {
        inMemory.push(ord);
      }
    }
    return inMemory.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async updateStatus(
    id: string,
    status: OrderStatus,
    paymentStatus?: PaymentStatus,
    stripeSessionId?: string,
  ): Promise<Order | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const updated: Order = {
      ...existing,
      status,
      paymentStatus: paymentStatus ?? existing.paymentStatus,
      stripeSessionId: stripeSessionId ?? existing.stripeSessionId,
      updatedAt: now,
    };

    globalForOrders.__lumoraOrders?.set(id, updated);

    try {
      await withDb("order.updateStatus", async () => {
        await db().send(
          new UpdateCommand({
            TableName: tableName(),
            Key: keys.order(id),
            UpdateExpression:
              "SET #status = :s, paymentStatus = :ps, stripeSessionId = :sid, updatedAt = :u",
            ExpressionAttributeNames: { "#status": "status" },
            ExpressionAttributeValues: {
              ":s": status,
              ":ps": paymentStatus ?? existing.paymentStatus,
              ":sid": stripeSessionId ?? existing.stripeSessionId ?? null,
              ":u": now,
            },
          }),
        );

        // Also update the owner reference
        await db().send(
          new UpdateCommand({
            TableName: tableName(),
            Key: keys.ownerOrder(existing.ownerId, id),
            UpdateExpression:
              "SET #status = :s, paymentStatus = :ps, stripeSessionId = :sid, updatedAt = :u",
            ExpressionAttributeNames: { "#status": "status" },
            ExpressionAttributeValues: {
              ":s": status,
              ":ps": paymentStatus ?? existing.paymentStatus,
              ":sid": stripeSessionId ?? existing.stripeSessionId ?? null,
              ":u": now,
            },
          }),
        );
      });
    } catch (error) {
      console.warn("[orderRepository.updateStatus] DynamoDB update failed, updated in-memory:", error);
    }

    return updated;
  },
};

