import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db/client";
import { cartRepository } from "@/lib/db/repositories/cart.repository";
import { orderRepository, type NewOrder } from "@/lib/db/repositories/order.repository";
import { maintenanceRepository } from "@/lib/db/repositories/maintenance.repository";
import { productRepository } from "@/lib/db/repositories/product.repository";
import type { Owner } from "@/types";
import { address, resetDatabase, stockOf } from "./helpers";

const guest = (): Owner => ({ id: `guest-${randomUUID()}`, kind: "guest" });

function orderFor(lines: { slug: string; quantity: number; price?: number }[], method: "cod" | "stripe" = "cod"): NewOrder {
  const items = lines.map((l) => ({ slug: l.slug, name: l.slug, price: l.price ?? 1000, quantity: l.quantity, lineTotal: (l.price ?? 1000) * l.quantity }));
  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  return {
    id: `ord_${randomUUID().slice(0, 8)}`,
    customer: { name: "Test Buyer", email: "buyer@example.com", phone: "01700000000" },
    shippingAddress: address,
    items,
    itemCount: items.reduce((s, i) => s + i.quantity, 0),
    subtotal,
    shipping: 0,
    savings: 0,
    total: subtotal,
    paymentMethod: method,
    paymentStatus: method === "cod" ? "pending_cod" : "pending_payment",
  };
}

describe("orders", () => {
  beforeEach(resetDatabase);

  it("reserves stock, saves the order and empties the cart in one go", async () => {
    const owner = guest();
    await cartRepository.setQuantity(owner, "glide-wireless-mouse", 2);
    const before = await stockOf("glide-wireless-mouse");

    const order = await orderRepository.create(owner, orderFor([{ slug: "glide-wireless-mouse", quantity: 2 }]), { clearCart: true });

    expect(await stockOf("glide-wireless-mouse")).toBe(before - 2);
    expect(await cartRepository.list(owner)).toEqual([]);
    expect((await orderRepository.getById(order.id))?.items).toHaveLength(1);
    expect((await orderRepository.listByOwner(owner)).map((o) => o.id)).toEqual([order.id]);
  });

  it("writes nothing when one product doesn't have enough stock", async () => {
    const owner = guest();
    await cartRepository.setQuantity(owner, "glide-wireless-mouse", 1);
    const mouse = await stockOf("glide-wireless-mouse");
    const draft = orderFor([
      { slug: "glide-wireless-mouse", quantity: 1 },
      { slug: "loopback-open-ear-headphones", quantity: 1 }, // stock is 0 in the seed data
    ]);

    await expect(orderRepository.create(owner, draft, { clearCart: true })).rejects.toMatchObject({ code: "OUT_OF_STOCK" });

    expect(await stockOf("glide-wireless-mouse")).toBe(mouse); // rolled back
    expect(await db().order.count()).toBe(0);
    expect(await cartRepository.list(owner)).toHaveLength(1);
  });

  it("never sells the last unit twice, even when buyers check out at the same moment", async () => {
    await db().product.update({ where: { slug: "glide-wireless-mouse" }, data: { stock: 1 } });
    const attempts = await Promise.allSettled(
      [guest(), guest(), guest()].map((owner) =>
        orderRepository.create(owner, orderFor([{ slug: "glide-wireless-mouse", quantity: 1 }]), { clearCart: false }),
      ),
    );
    expect(attempts.filter((a) => a.status === "fulfilled")).toHaveLength(1);
    expect(await stockOf("glide-wireless-mouse")).toBe(0);
  });

  it("returns stock when an unpaid card order is cancelled, only once", async () => {
    const before = await stockOf("arc-led-desk-lamp");
    const order = await orderRepository.create(guest(), orderFor([{ slug: "arc-led-desk-lamp", quantity: 3 }], "stripe"), {
      clearCart: false,
    });
    await orderRepository.cancelUnpaid(order.id);
    await orderRepository.cancelUnpaid(order.id);
    expect(await stockOf("arc-led-desk-lamp")).toBe(before);
    expect((await orderRepository.getById(order.id))?.status).toBe("cancelled");
  });

  it("marks a card order paid once, empties the cart, and won't cancel it afterwards", async () => {
    const owner = guest();
    await cartRepository.setQuantity(owner, "arc-led-desk-lamp", 1);
    const order = await orderRepository.create(owner, orderFor([{ slug: "arc-led-desk-lamp", quantity: 1 }], "stripe"), {
      clearCart: false,
    });
    await orderRepository.markPaid(order.id, "cs_test_1");
    await orderRepository.markPaid(order.id, "cs_test_1");
    await orderRepository.cancelUnpaid(order.id);

    const saved = await orderRepository.getById(order.id);
    expect(saved).toMatchObject({ paymentStatus: "paid", status: "confirmed", stripeSessionId: "cs_test_1" });
    expect(await cartRepository.list(owner)).toEqual([]);
  });

  it("keeps the order line when its product is deleted later", async () => {
    const order = await orderRepository.create(guest(), orderFor([{ slug: "glide-wireless-mouse", quantity: 1 }]), { clearCart: false });
    await productRepository.delete("glide-wireless-mouse");
    const saved = await orderRepository.getById(order.id);
    expect(saved?.items[0]).toMatchObject({ name: "glide-wireless-mouse", quantity: 1 });
  });
});

describe("guest data cleanup", () => {
  beforeEach(resetDatabase);

  it("deletes only expired guest rows", async () => {
    const stale = guest();
    const fresh = guest();
    await cartRepository.setQuantity(stale, "glide-wireless-mouse", 1);
    await cartRepository.setQuantity(fresh, "glide-wireless-mouse", 1);
    await db().cartItem.updateMany({ where: { guestId: stale.id }, data: { expiresAt: new Date(Date.now() - 1000) } });

    const deleted = await maintenanceRepository.deleteExpiredGuestData();

    expect(deleted.cartItems).toBe(1);
    expect(await cartRepository.list(fresh)).toHaveLength(1);
  });
});

describe("signing in after buying as a guest", () => {
  beforeEach(resetDatabase);

  it("moves the guest's orders onto the account", async () => {
    const g = guest();
    const order = await orderRepository.create(g, orderFor([{ slug: "glide-wireless-mouse", quantity: 1 }]), { clearCart: false });
    const user = await db().user.create({
      data: { email: "claim@example.com", name: "Claimer", passwordHash: "x" },
    });

    expect(await orderRepository.claimGuestOrders(g.id, user.id)).toBe(1);
    expect((await orderRepository.listByOwner({ id: user.id, kind: "user" })).map((o) => o.id)).toEqual([order.id]);
    expect(await orderRepository.listByOwner(g)).toEqual([]);
  });
});
