import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { stringify } from "yaml";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const { BUILTIN_TEMPLATES } = await import(new URL("../cloudflare/src/lib/defaults.ts", import.meta.url).href);

const checkOnly = process.argv.includes("--check");
const outDir = join(root, "config/templates");
if (!checkOnly) mkdirSync(outDir, { recursive: true });

let drifted = 0;
for (const template of BUILTIN_TEMPLATES) {
  const body = `# ${template.name} (${template.target})\n# Generated from cloudflare/src/lib/defaults.ts. Do not edit by hand; edit the source and rerun templates:export.\n${stringify(template.config)}`;
  const path = join(outDir, `${template.id}.yaml`);
  if (checkOnly) {
    const current = existsSync(path) ? readFileSync(path, "utf8") : "";
    if (current !== body) {
      console.error(`drift: config/templates/${template.id}.yaml`);
      drifted += 1;
    }
  } else {
    writeFileSync(path, body, "utf8");
  }
}

if (checkOnly) {
  console.log(drifted === 0 ? `template files up to date (${BUILTIN_TEMPLATES.length})` : `${drifted} template file(s) out of date`);
  if (drifted > 0) process.exit(1);
} else {
  console.log(`wrote ${BUILTIN_TEMPLATES.length} template file(s) to config/templates`);
}
