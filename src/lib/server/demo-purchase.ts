import { createAnalyticsClient } from "@decode-analytics/sdk/server";

const PLANS = {
  Starter: 0,
  Pro: 29,
  Entreprise: null,
} as const;

type PlanName = keyof typeof PLANS;

export interface DemoPurchaseInput {
  plan: PlanName;
  sessionId: string;
}

export interface DemoPurchaseConfig {
  endpoint: string;
  appId: string;
  appSecret: string;
  tagSlug?: string;
}

type AnalyticsClientFactory = typeof createAnalyticsClient;

export function createDemoPurchaseEvent(
  input: unknown,
  tagSlug = "purchase_confirmed",
) {
  if (!isRecord(input) || typeof input.plan !== "string" || !(input.plan in PLANS)) {
    throw new TypeError("Offre inconnue.");
  }

  if (typeof input.sessionId !== "string" || !input.sessionId.trim()) {
    throw new TypeError("Session invalide.");
  }

  const plan = input.plan as PlanName;

  return {
    type: "event",
    tagSlug,
    sessionId: input.sessionId.trim(),
    payload: {
      plan,
      amount: PLANS[plan],
      currency: "EUR",
    },
    metadata: { source: "showcase" },
  };
}

export async function sendDemoPurchase(
  input: unknown,
  config: DemoPurchaseConfig,
  createClient: AnalyticsClientFactory = createAnalyticsClient,
): Promise<void> {
  const client = createClient({
    endpoint: config.endpoint,
    appId: config.appId,
    appSecret: config.appSecret,
  });

  await client.track(createDemoPurchaseEvent(input, config.tagSlug));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
