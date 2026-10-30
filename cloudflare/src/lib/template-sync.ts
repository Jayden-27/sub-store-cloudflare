import { BUILTIN_TEMPLATE_IDS } from "./defaults";
import { readResponseText } from "./read";
import type { TemplateRecord } from "../types";

const MAX_TEMPLATE_BYTES = 256 * 1024;
const TEMPLATE_FETCH_TIMEOUT_MS = 15000;

export function resolveTemplateRemoteUrl(
  env: { SUB_STORE_TEMPLATE_BASE_URL?: string },
  template: Pick<TemplateRecord, "id" | "remoteUrl">,
): string | undefined {
  if (template.remoteUrl !== undefined) {
    return template.remoteUrl.trim() || undefined;
  }
  if (!BUILTIN_TEMPLATE_IDS.has(template.id)) return undefined;
  const base = String(env.SUB_STORE_TEMPLATE_BASE_URL || "").trim().replace(/\/+$/, "");
  return base ? `${base}/${template.id}.yaml` : undefined;
}

export async function templateConfigHash(config: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(config));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function fetchTemplateContent(url: string) {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Template URL is invalid");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Template URL must use http or https");
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TEMPLATE_FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(parsed.toString(), {
      signal: controller.signal,
      headers: { "user-agent": "sub-store-cloudflare/template-sync" },
    });
    if (!response.ok) throw new Error(`Template URL returned ${response.status}`);
    return await readResponseText(response, MAX_TEMPLATE_BYTES, "Remote template");
  } catch (error) {
    if (controller.signal.aborted) throw new Error("Template URL timed out");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export type TemplateSyncStatus = "updated" | "conflict" | "error" | "no-url" | "not-due";

export type TemplateSyncResult = {
  id: string;
  status: TemplateSyncStatus;
  message?: string;
};
