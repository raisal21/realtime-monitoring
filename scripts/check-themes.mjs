#!/usr/bin/env node
/**
 * Asserts every [data-theme="..."] block in src/index.css declares the
 * same set of --theme-* and --trace-* tokens. Catches partial themes
 * before they ship.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CSS_PATH = resolve(__dirname, "..", "src", "index.css");

function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "");
}

function extractThemeBlocks(src) {
  const blocks = [];
  const re = /\[data-theme="([^"]+)"\]\s*\{([\s\S]*?)\n\}/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    blocks.push({ name: m[1], body: m[2] });
  }
  return blocks;
}

function extractTokens(body) {
  const keys = new Set();
  const re = /--((?:theme|trace)-[a-z0-9-]+)\s*:/g;
  let m;
  while ((m = re.exec(body)) !== null) {
    keys.add(m[1]);
  }
  return keys;
}

function diff(a, b) {
  return [...a].filter((k) => !b.has(k));
}

function main() {
  const raw = readFileSync(CSS_PATH, "utf8");
  const src = stripComments(raw);
  const blocks = extractThemeBlocks(src);

  if (blocks.length < 2) {
    console.log(
      `[check-themes] only ${blocks.length} theme block(s) found — nothing to compare`,
    );
    return;
  }

  const tokensByTheme = blocks.map((b) => ({
    name: b.name,
    keys: extractTokens(b.body),
  }));

  const reference = tokensByTheme[0];
  let failed = false;

  for (let i = 1; i < tokensByTheme.length; i++) {
    const t = tokensByTheme[i];
    const missing = diff(reference.keys, t.keys);
    const extra = diff(t.keys, reference.keys);
    if (missing.length || extra.length) {
      failed = true;
      console.error(
        `[check-themes] mismatch in [data-theme="${t.name}"] vs [data-theme="${reference.name}"]:`,
      );
      if (missing.length) console.error(`  missing: ${missing.join(", ")}`);
      if (extra.length) console.error(`  extra:   ${extra.join(", ")}`);
    }
  }

  if (failed) {
    console.error(
      `[check-themes] FAIL — theme key parity broken across ${blocks.length} blocks`,
    );
    process.exit(1);
  }

  console.log(
    `[check-themes] OK — ${blocks.length} themes share ${reference.keys.size} tokens`,
  );
}

main();
