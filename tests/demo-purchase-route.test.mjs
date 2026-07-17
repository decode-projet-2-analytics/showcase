import assert from "node:assert/strict";
import test from "node:test";

import { handleDemoPurchase } from "../src/lib/server/demo-purchase-route.ts";

const validEnv = {
  SDK_SERVER_ENDPOINT: "http://analytics.test/api/v1/server-events",
  SDK_APP_ID: "app-id",
  SDK_APP_SECRET: "secret",
  SDK_PURCHASE_TAG_SLUG: "purchase_confirmed",
};

function request(body) {
  return new Request("http://showcase.test/api/demo-purchase", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
}

test("returns 400 for malformed JSON", async () => {
  const response = await handleDemoPurchase(request("{"), validEnv, async () => {});
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { ok: false, error: "Requête invalide." });
});

test("returns 500 without exposing a missing private configuration value", async () => {
  const response = await handleDemoPurchase(
    request(JSON.stringify({ plan: "Pro", sessionId: "s" })),
    { ...validEnv, SDK_APP_SECRET: "" },
    async () => {},
  );
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { ok: false, error: "Démonstration serveur non configurée." });
});

test("returns 400 for invalid purchase data", async () => {
  const response = await handleDemoPurchase(
    request(JSON.stringify({ plan: "Pirate", sessionId: "s" })),
    validEnv,
    async () => { throw new TypeError("Offre inconnue."); },
  );
  assert.equal(response.status, 400);
});

test("returns 200 after analytics ingestion", async () => {
  const calls = [];
  const response = await handleDemoPurchase(
    request(JSON.stringify({ plan: "Pro", sessionId: "s" })),
    validEnv,
    async (...args) => calls.push(args),
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0][1], {
    endpoint: validEnv.SDK_SERVER_ENDPOINT,
    appId: validEnv.SDK_APP_ID,
    appSecret: validEnv.SDK_APP_SECRET,
    tagSlug: validEnv.SDK_PURCHASE_TAG_SLUG,
  });
});

test("returns 502 without exposing analytics errors", async () => {
  const response = await handleDemoPurchase(
    request(JSON.stringify({ plan: "Pro", sessionId: "s" })),
    validEnv,
    async () => { throw new Error("upstream contained secret"); },
  );
  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), { ok: false, error: "Événement analytics non envoyé." });
});
