import assert from "node:assert/strict";
import test from "node:test";

import {
  createDemoPurchaseEvent,
  sendDemoPurchase,
} from "../src/lib/server/demo-purchase.ts";

test("maps the Pro plan to a purchase event", () => {
  assert.deepEqual(
    createDemoPurchaseEvent({ plan: "Pro", sessionId: "session-123" }, "purchase_confirmed"),
    {
      type: "purchase",
      tagSlug: "purchase_confirmed",
      sessionId: "session-123",
      payload: { plan: "Pro", amount: 29, currency: "EUR" },
      metadata: { source: "showcase" },
    },
  );
});

test("maps every showcase plan on the server", () => {
  assert.equal(createDemoPurchaseEvent({ plan: "Starter", sessionId: "s" }).payload.amount, 0);
  assert.equal(createDemoPurchaseEvent({ plan: "Entreprise", sessionId: "s" }).payload.amount, null);
});

test("rejects an unknown plan", () => {
  assert.throws(
    () => createDemoPurchaseEvent({ plan: "Pirate", sessionId: "s" }),
    /Offre inconnue/,
  );
});

test("rejects an empty session id", () => {
  assert.throws(
    () => createDemoPurchaseEvent({ plan: "Pro", sessionId: "  " }),
    /Session invalide/,
  );
});

test("sends the event through the configured server SDK client", async () => {
  const calls = [];
  const createClient = (config) => ({
    async track(event) {
      calls.push({ config, event });
    },
  });

  await sendDemoPurchase(
    { plan: "Pro", sessionId: "session-123" },
    {
      endpoint: "http://analytics.test/api/v1/server-events",
      appId: "app-id",
      appSecret: "secret",
      tagSlug: "checkout-complete",
    },
    createClient,
  );

  assert.deepEqual(calls, [{
    config: {
      endpoint: "http://analytics.test/api/v1/server-events",
      appId: "app-id",
      appSecret: "secret",
    },
    event: {
      type: "purchase",
      tagSlug: "checkout-complete",
      sessionId: "session-123",
      payload: { plan: "Pro", amount: 29, currency: "EUR" },
      metadata: { source: "showcase" },
    },
  }]);
});
