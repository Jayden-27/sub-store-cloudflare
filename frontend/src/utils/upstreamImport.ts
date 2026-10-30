type JsonMap = Record<string, any>;

const SUPPORTED_ACTION_TYPES = new Set([
  'Region Filter',
  'Type Filter',
  'Regex Filter',
  'Flag Operator',
  'Resolve Domain Operator',
  'Regex Sort Operator',
  'Regex Delete Operator',
  'Regex Rename Operator',
  'Handle Duplicate Operator',
  'Sort Operator',
  'Quick Setting Operator',
  'Script Filter',
  'Script Operator',
]);

export type UpstreamSourcePlan = {
  id: string;
  displayName: string;
  source: 'remote' | 'local';
  url: string;
  content: string;
  enabled: boolean;
  process: JsonMap[];
  tag?: string;
  remark?: string;
};

export type UpstreamCollectionPlan = {
  id: string;
  displayName: string;
  subscriptions: string[];
  process: JsonMap[];
  enabled: boolean;
};

export type UpstreamImportPlan = {
  sources: UpstreamSourcePlan[];
  collections: UpstreamCollectionPlan[];
  warnings: string[];
};

const slugify = (value: string) => value
  .toLowerCase()
  .replace(/[^a-z0-9_-]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 64);

const decodeBackup = (raw: string): JsonMap => {
  const text = raw.trim();
  if (!text) throw new Error('EMPTY');
  if (text.startsWith('{')) return JSON.parse(text);
  const decoded = atob(text.replace(/\s+/g, ''));
  return JSON.parse(decoded);
};

const pickArray = (value: unknown): JsonMap[] =>
  Array.isArray(value) ? value.filter((item): item is JsonMap => Boolean(item) && typeof item === 'object') : [];

export function planUpstreamImport(
  raw: string,
  existingSourceIds: string[] = [],
  existingCollectionIds: string[] = [],
): UpstreamImportPlan {
  const payload = decodeBackup(raw);
  const root: JsonMap = payload.data && typeof payload.data === 'object' ? payload.data : payload;
  const subs = pickArray(root.subs);
  const collections = pickArray(root.collections);
  const warnings: string[] = [];

  if (subs.length === 0 && collections.length === 0) {
    throw new Error('NO_ITEMS');
  }

  const existingSources = new Set(existingSourceIds);
  const existingCollections = new Set(existingCollectionIds);
  const sourceIdByName = new Map<string, string>();
  const usedSourceIds = new Set<string>();
  const sources: UpstreamSourcePlan[] = [];
  let unsupportedActions = 0;
  let skippedExisting = 0;

  subs.forEach((sub, index) => {
    const name = String(sub.name || sub.displayName || '').trim();
    if (!name) return;
    let id = slugify(name) || `src-${index + 1}`;
    let suffix = 2;
    while (usedSourceIds.has(id)) {
      id = `${slugify(name) || `src-${index + 1}`}-${suffix++}`;
    }
    usedSourceIds.add(id);
    sourceIdByName.set(name, id);
    if (sub.displayName && sub.displayName !== name) sourceIdByName.set(String(sub.displayName), id);

    if (existingSources.has(id)) {
      skippedExisting += 1;
      return;
    }

    const process = pickArray(sub.process).filter((action) => {
      if (SUPPORTED_ACTION_TYPES.has(String(action.type))) return true;
      unsupportedActions += 1;
      return false;
    });

    sources.push({
      id,
      displayName: String(sub.displayName || name),
      source: sub.url ? 'remote' : 'local',
      url: String(sub.url || ''),
      content: String(sub.content || ''),
      enabled: sub.enabled !== false,
      process,
      tag: typeof sub.tag === 'string' && sub.tag.trim() ? sub.tag.trim() : undefined,
      remark: typeof sub.remark === 'string' && sub.remark.trim() ? sub.remark.trim() : undefined,
    });
  });

  const usedCollectionIds = new Set<string>();
  let missingSources = 0;
  let collectionsWithTemplate = 0;
  const plannedCollections: UpstreamCollectionPlan[] = [];

  collections.forEach((collection, index) => {
    const name = String(collection.name || collection.displayName || '').trim();
    if (!name) return;
    let id = slugify(name) || `col-${index + 1}`;
    let suffix = 2;
    while (usedCollectionIds.has(id)) {
      id = `${slugify(name) || `col-${index + 1}`}-${suffix++}`;
    }
    usedCollectionIds.add(id);
    if (existingCollections.has(id)) {
      skippedExisting += 1;
      return;
    }
    if (collection.template) collectionsWithTemplate += 1;

    const subscriptions = (Array.isArray(collection.subscriptions) ? collection.subscriptions : [])
      .map((item: unknown) => String(item))
      .map((item: string) => sourceIdByName.get(item) || (usedSourceIds.has(item) ? item : ''))
      .filter((item: string) => {
        if (item) return true;
        missingSources += 1;
        return false;
      });

    const process = pickArray(collection.process).filter((action) => {
      if (SUPPORTED_ACTION_TYPES.has(String(action.type))) return true;
      unsupportedActions += 1;
      return false;
    });

    plannedCollections.push({
      id,
      displayName: String(collection.displayName || name),
      subscriptions,
      process,
      enabled: collection.enabled !== false,
    });
  });

  if (unsupportedActions > 0) warnings.push(`UNSUPPORTED_ACTIONS:${unsupportedActions}`);
  if (missingSources > 0) warnings.push(`MISSING_SOURCES:${missingSources}`);
  if (skippedExisting > 0) warnings.push(`SKIPPED_EXISTING:${skippedExisting}`);
  if (collectionsWithTemplate > 0) warnings.push(`TEMPLATE_RESET:${collectionsWithTemplate}`);

  return { sources, collections: plannedCollections, warnings };
}
