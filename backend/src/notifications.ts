import { config } from "./config";

type Params = Record<string, string | number | null | undefined>;

/**
 * Trigger one of the Firebase functions in ../functions that deliver push
 * notifications (FCM) to the mobile apps. Fire-and-forget: failures are
 * logged and never fail the API request that caused them.
 */
export async function notify(fn: string, params: Params): Promise<void> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) query.set(key, String(value ?? ""));
  if (!config.functionsBaseUrl) {
    console.log(`[notify] ${fn}?${query}`);
    return;
  }
  try {
    const response = await fetch(`${config.functionsBaseUrl}/${fn}?${query}`);
    if (!response.ok) console.error(`[notify] ${fn} failed with ${response.status}`);
  } catch (error) {
    console.error(`[notify] ${fn} failed`, error);
  }
}
