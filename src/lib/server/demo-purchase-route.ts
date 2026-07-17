import {
  createDemoPurchaseEvent,
  sendDemoPurchase,
  type DemoPurchaseConfig,
} from "./demo-purchase.ts";

export interface DemoPurchaseEnv {
  SDK_SERVER_ENDPOINT?: string;
  SDK_APP_ID?: string;
  SDK_APP_SECRET?: string;
  SDK_PURCHASE_TAG_SLUG?: string;
}

type PurchaseSender = (input: unknown, config: DemoPurchaseConfig) => Promise<void>;

export async function handleDemoPurchase(
  request: Request,
  env: DemoPurchaseEnv,
  sender: PurchaseSender = sendDemoPurchase,
): Promise<Response> {
  const config = readConfig(env);
  if (!config) {
    return json(500, { ok: false, error: "Démonstration serveur non configurée." });
  }

  let input: unknown;
  try {
    input = await request.json();
    createDemoPurchaseEvent(input, config.tagSlug);
  } catch {
    return json(400, { ok: false, error: "Requête invalide." });
  }

  try {
    await sender(input, config);
    return json(200, { ok: true });
  } catch {
    return json(502, { ok: false, error: "Événement analytics non envoyé." });
  }
}

function readConfig(env: DemoPurchaseEnv): DemoPurchaseConfig | null {
  const endpoint = env.SDK_SERVER_ENDPOINT?.trim();
  const appId = env.SDK_APP_ID?.trim();
  const appSecret = env.SDK_APP_SECRET?.trim();

  if (!endpoint || !appId || !appSecret) {
    return null;
  }

  return {
    endpoint,
    appId,
    appSecret,
    tagSlug: env.SDK_PURCHASE_TAG_SLUG?.trim() || "purchase_confirmed",
  };
}

function json(status: number, body: Record<string, unknown>): Response {
  return Response.json(body, { status });
}
