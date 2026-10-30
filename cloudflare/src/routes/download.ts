import { Hono } from "hono";
import type { Context } from "hono";
import { failed, isTokenValid } from "../lib/http";
import { authorizeScopedDownload } from "../lib/compatibility-resources";
import { SubscriptionBuildError, buildSubscriptionResult, getTargetContentType, normalizeTarget, normalizeTargetAlias } from "../lib/subscription";
import { getRoutingTemplate, getSettings, getSource, getSubscriptionCollection, getSubscriptionSources, getTemplate, pendingSourceStatusUpdates, recordSourceStatuses } from "../lib/store";
import type { FilterRule, SourceFetchResult, SubscriptionCollection, SubscriptionSource, SubscriptionTarget } from "../types";

export const downloadRoutes = new Hono<{ Bindings: SubStoreEnv }>();

type DownloadContext = Context<{ Bindings: SubStoreEnv }>;

downloadRoutes.get("/download/collection/:name/:target?/:token?", async (c) => {
  const target = getDownloadTarget(c);
  if (!target) return failed(c, "Unsupported target", 400);
  const invalidToken = await rejectInvalidDownloadToken(c, "collection", c.req.param("name"), target);
  if (invalidToken) return invalidToken;

  const overrides = await resolveDownloadOverrides(c);
  if (overrides.error) return overrides.error;

  const collection = await getSubscriptionCollection(c.env, c.req.param("name"));
  if (!collection) return failed(c, "Collection not found", 404);

  return renderDownload(c, {
    collection: overrides.filters ? { ...collection, filters: overrides.filters } : collection,
    sources: await getSubscriptionSources(c.env),
    target,
    templateId: overrides.templateId || collection.templateId,
  });
});

downloadRoutes.get("/download/source/:name/:target?/:token?", async (c) => {
  const target = getDownloadTarget(c);
  if (!target) return failed(c, "Unsupported target", 400);
  const invalidToken = await rejectInvalidDownloadToken(c, "source", c.req.param("name"), target);
  if (invalidToken) return invalidToken;

  const overrides = await resolveDownloadOverrides(c);
  if (overrides.error) return overrides.error;

  const source = await getSource(c.env, c.req.param("name"));
  if (!source || !source.enabled) return failed(c, "Subscription not found", 404);
  const subscriptionSource: SubscriptionSource = {
    id: source.id,
    name: source.name,
    type: source.type,
    url: source.url,
    content: source.content,
    filters: overrides.filters || source.filters,
    enabled: source.enabled,
    meta: source.meta,
    lastFetchedAt: source.lastFetchedAt,
    lastError: source.lastError,
    lastNodeCount: source.lastNodeCount,
    lastCacheStatus: source.lastCacheStatus,
  };

  return renderDownload(c, {
    source: subscriptionSource,
    sources: [subscriptionSource],
    target,
    templateId: overrides.templateId,
  });
});

async function renderDownload(
  c: DownloadContext,
  options: {
    source?: SubscriptionSource;
    collection?: SubscriptionCollection;
    sources: SubscriptionSource[];
    target: SubscriptionTarget;
    templateId?: string;
  },
) {
  const sourceOverride = getTemporarySourceOverride(c);
  const sources = sourceOverride ? applyTemporarySourceOverride(options.sources, sourceOverride, options.collection) : options.sources;
  const source = sourceOverride && options.source ? applyTemporarySourceOverride([options.source], sourceOverride)[0] : options.source;
  const sourceResults = new Map<string, SourceFetchResult>();
  const [template, settings] = await Promise.all([
    getRoutingTemplate(c.env, options.templateId),
    getSettings(c.env),
  ]);
  try {
    const result = await buildSubscriptionResult({
      source,
      collection: options.collection,
      sources,
      requestUrl: new URL(c.req.url),
      target: options.target,
      template,
      settings,
      requestUserAgent: c.req.header("user-agent") || "",
      forceRefresh: ["1", "true"].includes(c.req.query("refresh") || c.req.query("noCache") || ""),
      waitUntil: (promise) => c.executionCtx.waitUntil(promise),
      sourceResults,
    });
    recordSourceStatusesAsync(c, sources, sourceResults);
    const headers = new Headers({
      "content-type": getTargetContentType(options.target),
      "profile-update-interval": result.metadata.profileUpdateInterval || "6",
      "cache-control": "no-store",
    });
    setResponseHeader(headers, "subscription-userinfo", result.metadata.subscriptionUserinfo);
    setResponseHeader(headers, "profile-web-page-url", result.metadata.profileWebPageUrl);
    setResponseHeader(headers, "content-disposition", result.metadata.contentDisposition);
    setResponseHeader(headers, "x-sub-store-cache", result.metadata.cacheStatus);
    return new Response(result.body, { headers });
  } catch (error) {
    recordSourceStatusesAsync(c, sources, sourceResults);
    const message = error instanceof Error ? error.message : String(error);
    const status = error instanceof SubscriptionBuildError ? error.status : 500;
    return failed(c, message, status);
  }
}

function recordSourceStatusesAsync(c: DownloadContext, sources: SubscriptionSource[], results: Map<string, SourceFetchResult>) {
  const updates = pendingSourceStatusUpdates(sources, results);
  if (updates.length === 0) return;
  c.executionCtx.waitUntil(recordSourceStatuses(c.env, updates));
}

type DownloadOverrides = {
  templateId?: string;
  filters?: FilterRule[];
  error?: Response;
};

async function resolveDownloadOverrides(c: DownloadContext): Promise<DownloadOverrides> {
  const templateId = stringQuery(c, "template");
  if (templateId && !(await getTemplate(c.env, templateId))) {
    return { error: failed(c, "Template not found", 404) };
  }
  const rawFilters = stringQuery(c, "filters");
  if (rawFilters === undefined) return { templateId };
  if (rawFilters.toLowerCase() === "none") return { templateId, filters: [] };
  try {
    const parsed = JSON.parse(rawFilters);
    if (!Array.isArray(parsed)) return { error: failed(c, "filters must be a JSON array or \"none\"", 400) };
    return { templateId, filters: parsed as FilterRule[] };
  } catch {
    return { error: failed(c, "filters must be a JSON array or \"none\"", 400) };
  }
}

function setResponseHeader(headers: Headers, name: string, value: string | undefined) {
  if (value && !/[\r\n]/.test(value)) headers.set(name, value);
}

type TemporarySourceOverride = {
  url?: string;
  content?: string;
  ua?: string;
};

function getTemporarySourceOverride(c: DownloadContext): TemporarySourceOverride | undefined {
  const url = stringQuery(c, "url");
  const content = stringQuery(c, "content");
  const ua = stringQuery(c, "ua") || stringQuery(c, "userAgent") || stringQuery(c, "user-agent");
  if (!url && !content && !ua) return undefined;
  return { url, content, ua };
}

function applyTemporarySourceOverride(sources: SubscriptionSource[], override: TemporarySourceOverride, collection?: SubscriptionCollection) {
  const selectedIds = collection?.sourceIds || [];
  const overrideIndex = selectedIds.length > 0
    ? sources.findIndex((source) => selectedIds.includes(source.id) || selectedIds.includes(source.name))
    : 0;
  const targetIndex = overrideIndex >= 0 ? overrideIndex : 0;

  return sources.map((source, index) => {
    if (index !== targetIndex) return source;
    const meta = { ...(source.meta || {}) };
    if (override.ua) meta.ua = override.ua;
    return {
      ...source,
      type: override.content ? "local" : override.url ? "remote" : source.type,
      url: override.url || source.url,
      content: override.content || (override.url ? "" : source.content),
      meta,
    };
  });
}

function stringQuery(c: DownloadContext, key: string) {
  const value = c.req.query(key);
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getDownloadToken(c: DownloadContext) {
  return c.req.param("token") || c.req.query("token");
}

async function rejectInvalidDownloadToken(
  c: DownloadContext,
  resourceType: "source" | "collection",
  resourceId: string,
  target: SubscriptionTarget,
) {
  const token = getDownloadToken(c);
  if (await isTokenValid(c.env.SUB_STORE_PUBLIC_DOWNLOAD_TOKEN, token)) return undefined;
  if (await authorizeScopedDownload(c.env, token, resourceType, resourceId, target)) return undefined;
  return failed(c, "Download token is invalid", 403);
}

function getDownloadTarget(c: DownloadContext, defaultTarget?: string) {
  const explicit = c.req.param("target") || c.req.query("target");
  if (explicit) return normalizeTargetAlias(explicit);
  return normalizeTarget(defaultTarget, c.req.header("user-agent") || "");
}
