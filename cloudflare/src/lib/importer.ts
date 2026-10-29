import type { ProxyNode, SourceRecord } from "../types";
import { detectImportedRegionFlag, parseImportedProxyNodes } from "./subscription";
import { upsertSourcesBatch } from "./store";

const MAX_IMPORT_NODES = 2000;
const SAMPLE_LIMIT = 8;

type RegionDefinition = {
  id: string;
  label: string;
  sourceName: string;
  icon?: string;
};

type ImportGroup = RegionDefinition & {
  total: number;
  duplicates: number;
  addable: number;
  samples: string[];
  needsReview: boolean;
  nodes: ProxyNode[];
  targetSource?: SourceRecord;
  createTarget: boolean;
  target: TargetSource;
  newTarget: TargetSource;
};

type TargetSource = {
  id: string;
  name: string;
  create: boolean;
  icon?: string;
};

export type ImportGroupPreview = Omit<ImportGroup, "nodes" | "targetSource" | "createTarget" | "target" | "newTarget"> & {
  targetSourceId: string;
  targetSourceName: string;
  existingSource: boolean;
  newSourceId: string;
  newSourceName: string;
};

export type ImportPreview = {
  total: number;
  addable: number;
  duplicates: number;
  groups: ImportGroupPreview[];
};

export type ImportApplyGroup = {
  id: string;
  enabled?: boolean;
  targetSourceId?: string;
  targetSourceName?: string;
};

const REGION_ICON_ROOT = "https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color";
const KNOWN_REGIONS: Record<string, RegionDefinition> = {
  HK: { id: "hk", label: "🇭🇰 香港", sourceName: "HK", icon: `${REGION_ICON_ROOT}/Hong_Kong.png` },
  GB: { id: "uk", label: "🇬🇧 英国", sourceName: "UK", icon: `${REGION_ICON_ROOT}/United_Kingdom.png` },
  US: { id: "us", label: "🇺🇸 美国", sourceName: "US", icon: `${REGION_ICON_ROOT}/United_States.png` },
  SG: { id: "sg", label: "🇸🇬 新加坡", sourceName: "SG", icon: `${REGION_ICON_ROOT}/Singapore.png` },
  JP: { id: "jp", label: "🇯🇵 日本", sourceName: "JP", icon: `${REGION_ICON_ROOT}/Japan.png` },
  DE: { id: "de", label: "🇩🇪 德国", sourceName: "DE" },
  KR: { id: "kr", label: "🇰🇷 韩国", sourceName: "KR" },
};

function regionFromNode(node: ProxyNode): RegionDefinition {
  const nameFlag = detectImportedRegionFlag(node.name);
  const nameCode = flagToCode(nameFlag);
  if (nameCode) return regionFromCode(nameFlag, nameCode);
  const endpoint = [node.server, node.servername, node.sni].filter(Boolean).join(" ");
  const endpointFlag = detectImportedRegionFlag(endpoint);
  const endpointCode = flagToCode(endpointFlag);
  if (endpointCode) return regionFromCode(endpointFlag, endpointCode);
  return { id: "other", label: "待确认地区", sourceName: "其他" };
}

function regionFromCode(flag: string, code: string): RegionDefinition {
  const known = KNOWN_REGIONS[code];
  if (known) return known;
  return {
    id: code.toLowerCase(),
    label: `${flag} ${code}`,
    sourceName: code,
    icon: undefined,
  };
}

function flagToCode(flag: string) {
  const points = [...flag].map((item) => item.codePointAt(0) || 0);
  if (points.length !== 2 || points.some((point) => point < 0x1f1e6 || point > 0x1f1ff)) return "";
  return points.map((point) => String.fromCharCode(65 + point - 0x1f1e6)).join("");
}

function nodeIdentity(node: ProxyNode) {
  const auth = node.uuid || node.password || node.psk || node.username || "";
  return JSON.stringify([
    node.type,
    node.server || "",
    Number(node.port || 0),
    node.network || "",
    node.servername || node.sni || "",
    String(auth),
  ]);
}

function parseSourceNodes(source: SourceRecord) {
  if (!source.content.trim()) return [];
  try {
    return parseImportedProxyNodes(source.content);
  } catch {
    return [];
  }
}

function uniqueSourceId(base: string, sources: SourceRecord[], reserved: Set<string>) {
  const normalized = base.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64) || "imported";
  let candidate = normalized;
  let index = 2;
  const existing = new Set(sources.map((source) => source.id));
  while (reserved.has(candidate) || existing.has(candidate)) {
    const suffix = `-${index}`;
    candidate = `${normalized.slice(0, 64 - suffix.length)}${suffix}`;
    index += 1;
  }
  reserved.add(candidate);
  return candidate;
}

function existingTarget(group: RegionDefinition, sources: SourceRecord[]): TargetSource | undefined {
  const existing = sources.find((source) => source.id === group.id || source.name === group.sourceName);
  if (existing?.type !== "local") return undefined;
  return { id: existing.id, name: existing.name, create: false, icon: stringValue(existing.meta.icon) };
}

function newTarget(group: RegionDefinition, sources: SourceRecord[], reserved: Set<string>): TargetSource {
  const id = uniqueSourceId(group.id === "all" ? "imported" : group.id, sources, reserved);
  return { id, name: group.sourceName, create: true, icon: group.icon };
}

function groupNodes(nodes: ProxyNode[], groupByRegion: boolean) {
  if (!groupByRegion) {
    return [{
      definition: { id: "all", label: "全部节点", sourceName: "导入节点" } as RegionDefinition,
      nodes,
    }];
  }
  const output = new Map<string, { definition: RegionDefinition; nodes: ProxyNode[] }>();
  for (const node of nodes) {
    const definition = regionFromNode(node);
    const group = output.get(definition.id) || { definition, nodes: [] };
    group.nodes.push(node);
    output.set(definition.id, group);
  }
  return [...output.values()];
}

function buildImportGroups(nodes: ProxyNode[], sources: SourceRecord[], groupByRegion: boolean) {
  const reserved = new Set<string>();
  return groupNodes(nodes, groupByRegion).map(({ definition, nodes: groupNodes }) => {
    const suggestedNewTarget = newTarget(definition, sources, reserved);
    const existing = existingTarget(definition, sources);
    const target = existing || suggestedNewTarget;
    const existingNodes = existing ? parseSourceNodes(sources.find((source) => source.id === target.id)!) : [];
    const existingKeys = new Set(existingNodes.map(nodeIdentity));
    const seen = new Set<string>();
    let duplicates = 0;
    const addableNodes: ProxyNode[] = [];
    for (const node of groupNodes) {
      const key = nodeIdentity(node);
      if (existingKeys.has(key) || seen.has(key)) {
        duplicates += 1;
        continue;
      }
      seen.add(key);
      addableNodes.push(node);
    }
    return {
      ...definition,
      total: groupNodes.length,
      duplicates,
      addable: addableNodes.length,
      samples: groupNodes.slice(0, SAMPLE_LIMIT).map((node) => node.name),
      needsReview: definition.id === "other",
      nodes: groupNodes,
      targetSource: existing ? sources.find((source) => source.id === target.id) : undefined,
      createTarget: !existing,
      target,
      newTarget: suggestedNewTarget,
    };
  });
}

function parseContent(content: string) {
  const nodes = parseImportedProxyNodes(content);
  if (nodes.length === 0) throw new Error("No supported proxy nodes found");
  if (nodes.length > MAX_IMPORT_NODES) throw new Error(`Import exceeds the ${MAX_IMPORT_NODES} node limit`);
  return nodes;
}

export function previewProxyImport(content: string, sources: SourceRecord[], groupByRegion = true): ImportPreview {
  const nodes = parseContent(content);
  const groups = buildImportGroups(nodes, sources, groupByRegion);
  return {
    total: nodes.length,
    addable: groups.reduce((sum, group) => sum + group.addable, 0),
    duplicates: groups.reduce((sum, group) => sum + group.duplicates, 0),
    groups: groups.map((group) => ({
      id: group.id,
      label: group.label,
      sourceName: group.sourceName,
      icon: group.icon,
      total: group.total,
      duplicates: group.duplicates,
      addable: group.addable,
      samples: group.samples,
      needsReview: group.needsReview,
      targetSourceId: group.target.id,
      targetSourceName: group.target.name,
      existingSource: !group.createTarget,
      newSourceId: group.newTarget.id,
      newSourceName: group.newTarget.name,
    })),
  };
}

export async function applyProxyImport(
  env: SubStoreEnv,
  content: string,
  sources: SourceRecord[],
  groupByRegion: boolean,
  requestedGroups: ImportApplyGroup[],
) {
  const nodes = parseContent(content);
  const groups = buildImportGroups(nodes, sources, groupByRegion);
  const requested = new Map(requestedGroups.map((group) => [group.id, group]));
  const targets = new Map<string, {
    source?: SourceRecord;
    name: string;
    icon?: string;
    nodes: ProxyNode[];
    requested: number;
  }>();

  for (const group of groups) {
    const request = requested.get(group.id);
    if (!request || request.enabled === false) continue;
    const targetId = normalizeSourceId(request.targetSourceId || group.target.id);
    const existing = sources.find((source) => source.id === targetId);
    if (existing && existing.type !== "local") {
      throw new Error(`Target source ${existing.name} is remote; choose a local source or create a new one`);
    }
    const target = targets.get(targetId) || {
      source: existing,
      name: request.targetSourceName || existing?.name || group.target.name,
      icon: existing ? stringValue(existing.meta.icon) : group.target.icon,
      nodes: existing ? parseSourceNodes(existing) : [],
      requested: 0,
    };
    target.requested += group.nodes.length;
    mergeNodes(target.nodes, group.nodes);
    targets.set(targetId, target);
  }

  const now = Date.now();
  const records: SourceRecord[] = [];
  const reports: Array<{ targetSourceId: string; added: number; skipped: number }> = [];
  let index = 0;
  for (const [targetId, target] of targets) {
    const before = target.source ? parseSourceNodes(target.source).length : 0;
    const content = JSON.stringify({ proxies: target.nodes }, null, 2);
    const record: SourceRecord = target.source
      ? { ...target.source, content, updatedAt: now + index }
      : {
        id: targetId,
        name: target.name,
        type: "local",
        url: "",
        content,
        enabled: true,
        filters: [],
        meta: {
          tag: ["地区"],
          ...(target.icon ? { icon: target.icon } : {}),
        },
        createdAt: now + index,
        updatedAt: now + index,
      };
    const added = Math.max(0, target.nodes.length - before);
    records.push(record);
    reports.push({ targetSourceId: targetId, added, skipped: Math.max(0, target.requested - added) });
    index += 1;
  }

  if (records.length === 0) throw new Error("No import groups were selected");
  await upsertSourcesBatch(env, records);
  return {
    sources: reports,
    added: reports.reduce((sum, report) => sum + report.added, 0),
    skipped: reports.reduce((sum, report) => sum + report.skipped, 0),
  };
}

function mergeNodes(target: ProxyNode[], incoming: ProxyNode[]) {
  const seen = new Set(target.map(nodeIdentity));
  const names = new Set(target.map((node) => node.name));
  for (const node of incoming) {
    const identity = nodeIdentity(node);
    if (seen.has(identity)) continue;
    seen.add(identity);
    let name = node.name;
    let suffix = 2;
    while (names.has(name)) {
      name = `${node.name}-${suffix}`;
      suffix += 1;
    }
    names.add(name);
    target.push(name === node.name ? node : { ...node, name });
  }
}

function normalizeSourceId(value: string) {
  const id = String(value || "").trim().toLowerCase();
  if (!/^[a-z0-9_-]{1,64}$/.test(id)) throw new Error("Target source id is invalid");
  return id;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
