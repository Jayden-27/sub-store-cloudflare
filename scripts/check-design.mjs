import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const srcDir = join(root, "frontend/src");
const budgetPath = join(root, "frontend/design-budget.json");
const update = process.argv.includes("--update");

const EXCLUDED_DIRS = [
  join(srcDir, "ui"),
  join(srcDir, "design"),
  join(srcDir, "themes"),
];
const EXCLUDED_FILES = [join(srcDir, "styles/tokens.css")];

const EXTENSIONS = new Set([".vue", ".scss", ".css", ".ts"]);

const walk = (dir, files = []) => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (EXCLUDED_DIRS.some((excluded) => full.startsWith(excluded))) continue;
    if (EXCLUDED_FILES.includes(full)) continue;
    const stats = statSync(full);
    if (stats.isDirectory()) walk(full, files);
    else if (EXTENSIONS.has(full.slice(full.lastIndexOf(".")))) files.push(full);
  }
  return files;
};

const counts = {
  important: 0,
  hexColor: 0,
  fontSizePx: 0,
  radiusPx: 0,
  directNutTag: 0,
};

const offenders = { important: [], hexColor: [], fontSizePx: [], radiusPx: [], directNutTag: [] };

const record = (metric, file, line) => {
  counts[metric] += 1;
  if (offenders[metric].length < 5) offenders[metric].push(`${relative(root, file)}:${line}`);
};

for (const file of walk(srcDir)) {
  const lines = readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    const lineNo = index + 1;
    const important = (line.match(/!important/g) || []).length;
    for (let i = 0; i < important; i += 1) record("important", file, lineNo);
    const hex = (line.match(/#[0-9a-fA-F]{3,8}\b/g) || []).length;
    for (let i = 0; i < hex; i += 1) record("hexColor", file, lineNo);
    if (/font-size:\s*\d+px/.test(line)) record("fontSizePx", file, lineNo);
    if (/border-radius:\s*\d+px/.test(line)) record("radiusPx", file, lineNo);
    const tags = (line.match(/<nut-[a-z-]+/g) || []).length;
    for (let i = 0; i < tags; i += 1) record("directNutTag", file, lineNo);
  });
}

if (update) {
  writeFileSync(budgetPath, `${JSON.stringify(counts, null, 2)}\n`, "utf8");
  console.log(`design budget updated: ${budgetPath}`);
  process.exit(0);
}

let budget;
try {
  budget = JSON.parse(readFileSync(budgetPath, "utf8"));
} catch {
  console.error("Missing frontend/design-budget.json. Run: node scripts/check-design.mjs --update");
  process.exit(1);
}

const rows = Object.keys(counts).map((metric) => ({
  metric,
  current: counts[metric],
  budget: budget[metric] ?? 0,
  ok: counts[metric] <= (budget[metric] ?? 0),
}));

console.log("Design debt report (budget = current ceiling, must not grow)");
for (const row of rows) {
  console.log(`${row.ok ? "ok  " : "FAIL"} ${row.metric.padEnd(14)} ${String(row.current).padStart(4)} / ${row.budget}`);
  if (!row.ok) for (const offender of offenders[row.metric]) console.log(`       e.g. ${offender}`);
}

if (rows.some((row) => !row.ok)) {
  console.error("\nDesign debt increased. Use tokens from src/styles/tokens.css and components from src/ui before adding raw styles.");
  process.exit(1);
}
