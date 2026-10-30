import { utf8ByteLength } from "./read";
import { buildSubscriptionResult, getTargetContentType, normalizeTargetAlias } from "./subscription";
import {
  getRoutingTemplate,
  getSettings,
  getSource,
  getSubscriptionCollection,
  getSubscriptionSources,
  pendingSourceStatusUpdates,
  recordSourceStatuses,
} from "./store";
import type { SourceFetchResult, SubscriptionSource } from "../types";

export type LinkCheckResult = {
  status: "ok" | "error" | "not-found";
  target?: string;
  nodes?: number;
  bytes?: number;
  durationMs: number;
  contentType?: string;
  preview?: string;
  message?: string;
};

export async function checkDownloadLink(
  env: SubStoreEnv,
  options: {
    type: "source" | "collection";
    id: string;
    target?: string;
    requestUrl: URL;
    requestUserAgent?: string;
  },
): Promise<LinkCheckResult> {
  const startedAt = Date.now();
  const target = normalizeTargetAlias(options.target || "mihomo");
  if (!target) {
    return { status: "error", durationMs: 0, message: "Unsupported target" };
  }

  const sources = await getSubscriptionSources(env);
  let source: SubscriptionSource | undefined;
  let collection: Awaited<ReturnType<typeof getSubscriptionCollection>>;
  if (options.type === "collection") {
    collection = await getSubscriptionCollection(env, options.id);
    if (!collection) return { status: "not-found", durationMs: Date.now() - startedAt };
  } else {
    const record = await getSource(env, options.id);
    if (!record || !record.enabled) return { status: "not-found", durationMs: Date.now() - startedAt };
    source = {
      id: record.id,
      name: record.name,
      type: record.type,
      url: record.url,
      content: record.content,
      filters: record.filters,
      enabled: record.enabled,
      meta: record.meta,
      lastFetchedAt: record.lastFetchedAt,
      lastError: record.lastError,
      lastNodeCount: record.lastNodeCount,
      lastCacheStatus: record.lastCacheStatus,
    };
  }

  const scopeSources = collection ? sources : [source as SubscriptionSource];
  const sourceResults = new Map<string, SourceFetchResult>();
  const [template, settings] = await Promise.all([
    getRoutingTemplate(env, collection?.templateId),
    getSettings(env),
  ]);

  try {
    const result = await buildSubscriptionResult({
      source,
      collection,
      sources: scopeSources,
      requestUrl: options.requestUrl,
      target,
      template,
      settings,
      requestUserAgent: options.requestUserAgent || "",
      sourceResults,
    });
    await flushSourceStatuses(env, scopeSources, sourceResults);
    return {
      status: "ok",
      target,
      nodes: result.nodes,
      bytes: utf8ByteLength(result.body),
      durationMs: Date.now() - startedAt,
      contentType: getTargetContentType(target),
      preview: result.body.split("\n").slice(0, 12).join("\n"),
    };
  } catch (error) {
    await flushSourceStatuses(env, scopeSources, sourceResults);
    return {
      status: "error",
      durationMs: Date.now() - startedAt,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

async function flushSourceStatuses(
  env: SubStoreEnv,
  sources: SubscriptionSource[],
  results: Map<string, SourceFetchResult>,
) {
  const updates = pendingSourceStatusUpdates(sources, results);
  if (updates.length > 0) await recordSourceStatuses(env, updates);
}
