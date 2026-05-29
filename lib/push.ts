import webpush from "web-push";
import { query } from "./db";
import type { PushSubscriptionRecord } from "./types";

let configured = false;

function configure() {
  if (configured) return;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@example.com";
  if (!publicKey || !privateKey) {
    throw new Error("VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY are not set");
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  doseId?: number;
  url?: string;
}

/** Send a payload to every stored subscription, pruning dead ones. */
export async function sendToAll(payload: PushPayload): Promise<{
  sent: number;
  removed: number;
}> {
  configure();
  const subs = await query<PushSubscriptionRecord>(
    "select endpoint, p256dh, auth from push_subscriptions",
  );
  let sent = 0;
  let removed = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth },
          },
          JSON.stringify(payload),
        );
        sent++;
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await query("delete from push_subscriptions where endpoint = $1", [
            s.endpoint,
          ]);
          removed++;
        } else {
          console.error("push send failed", statusCode, err);
        }
      }
    }),
  );
  return { sent, removed };
}
