import { parse as parseYaml } from "yaml";
import type { SubscriptionTarget } from "../types";

type JsonMap = Record<string, unknown>;

export function parseTemplateConfig(input: unknown, target: SubscriptionTarget = "mihomo") {
  const normalize = (value: JsonMap) => (target === "sing-box" ? { ...value } : normalizeMihomoTemplateConfig(value));
  if (input && typeof input === "object" && !Array.isArray(input)) return normalize(input as JsonMap);
  if (typeof input !== "string" || !input.trim()) throw new Error("Template config is required");
  try {
    const parsed = input.trim().startsWith("{") ? JSON.parse(input) : parseYaml(input);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return normalize(parsed as JsonMap);
  } catch {
    throw new Error("Template config must be valid JSON or YAML");
  }
  throw new Error("Template config must be an object");
}

export function normalizeMihomoTemplateConfig(input: JsonMap) {
  const aliases: Record<string, string> = {
    "mixed-port": "mixedPort",
    "allow-lan": "allowLan",
    "log-level": "logLevel",
    "proxy-groups": "proxyGroups",
    "rule-providers": "ruleProviders",
  };
  const values: JsonMap = {
    mixedPort: input.mixedPort ?? input["mixed-port"],
    allowLan: input.allowLan ?? input["allow-lan"],
    logLevel: input.logLevel ?? input["log-level"],
    proxyGroups: input.proxyGroups ?? input["proxy-groups"],
    ruleProviders: input.ruleProviders ?? input["rule-providers"],
  };
  const seen = new Set<string>();
  const output: JsonMap = {};
  for (const [key, value] of Object.entries(input)) {
    const normalizedKey = aliases[key] || key;
    if (seen.has(normalizedKey)) continue;
    seen.add(normalizedKey);
    output[normalizedKey] = values[normalizedKey] ?? value;
  }
  return output;
}
