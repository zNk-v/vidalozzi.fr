// One-shot HTML migration:
//   - Strips the Babel-standalone CDN <script>.
//   - Strips every <script type="text/babel" src="*.jsx"></script>.
//   - Removes the inline JSX mount block (`ReactDOM.createRoot(...).render(<VIDALOZZI_App page="..." />)`)
//     and lifts its `page` (+ optional `slug`) into <body data-page="..." data-slug="...">.
//   - Inserts a single <script src="dist/vidalozzi.bundle.js" defer></script> in place of the Babel CDN.
//
// Run: node scripts/migrate-html.mjs
//
// Idempotent: re-running on an already-migrated file is a no-op.

import { promises as fs } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// Pages built on the React app (skip YouTube banner/thumbnail standalone assets and the giant editor export).
const PAGES = [
  "index.html",
  "ugc.html",
  "talent.html",
  "blog.html",
  "ugc.bundle.html",
  "choisir-createur-ugc.html",
  "erreurs-brief-ugc.html",
  "formats-ugc-meta-ads.html",
  "modele-brief-ugc.html",
  "prix-createur-ugc-france.html",
  "ugc-convertit-mieux-que-pub-classique.html",
  "ugc-ecommerce-fiches-produit.html",
  "ugc-vs-influenceur.html",
];

const BABEL_CDN_RE = /<script\s+src="https:\/\/unpkg\.com\/@babel\/standalone[^"]*"[^>]*><\/script>\s*\n?/;
const BABEL_JSX_SCRIPT_RE = /<script\s+type="text\/babel"\s+src="[^"]+\.jsx"><\/script>\s*\n?/g;
const MOUNT_BLOCK_RE = /<script\s+type="text\/babel"\s+data-presets="env,react">\s*\n\s*ReactDOM\.createRoot\(document\.getElementById\("root"\)\)\.render\(<VIDALOZZI_App\s+page="([^"]+)"(?:\s+slug="([^"]+)")?\s*\/>\);?\s*\n\s*<\/script>\s*\n?/;

const BUNDLE_TAG = `<script src="dist/vidalozzi.bundle.js" defer></script>\n`;

async function migrate(file) {
  const path = join(ROOT, file);
  let html;
  try { html = await fs.readFile(path, "utf8"); }
  catch (e) { console.warn(`  skip ${file}: ${e.code}`); return { file, status: "missing" }; }

  // Already migrated?
  if (html.includes("dist/vidalozzi.bundle.js")) {
    return { file, status: "already-migrated" };
  }

  const mountMatch = html.match(MOUNT_BLOCK_RE);
  if (!mountMatch) {
    console.warn(`  ${file}: no mount block found; leaving untouched.`);
    return { file, status: "no-mount" };
  }
  const page = mountMatch[1];
  const slug = mountMatch[2];

  // 1. Replace Babel CDN line with the bundle tag.
  if (BABEL_CDN_RE.test(html)) {
    html = html.replace(BABEL_CDN_RE, BUNDLE_TAG);
  } else {
    // No Babel CDN found but mount exists — insert bundle tag right before </body>.
    html = html.replace(/<\/body>/, `${BUNDLE_TAG}</body>`);
  }

  // 2. Drop every <script type="text/babel" src="*.jsx"></script>.
  html = html.replace(BABEL_JSX_SCRIPT_RE, "");

  // 3. Drop the inline JSX mount block.
  html = html.replace(MOUNT_BLOCK_RE, "");

  // 4. Add data-page (and optional data-slug) to the <body> tag.
  //    Pattern matches `<body ...>` with any attributes already present.
  const bodyRe = /<body\b([^>]*)>/;
  const m = html.match(bodyRe);
  if (m) {
    let attrs = m[1] || "";
    if (!/\bdata-page=/.test(attrs)) {
      attrs += ` data-page="${page}"`;
    }
    if (slug && !/\bdata-slug=/.test(attrs)) {
      attrs += ` data-slug="${slug}"`;
    }
    html = html.replace(bodyRe, `<body${attrs}>`);
  }

  await fs.writeFile(path, html);
  return { file, status: "migrated", page, slug };
}

async function main() {
  console.log(`Migrating ${PAGES.length} HTML pages...\n`);
  const results = [];
  for (const f of PAGES) {
    results.push(await migrate(f));
  }
  console.log("");
  for (const r of results) {
    const tag =
      r.status === "migrated"        ? `✔  ${r.file}  → data-page="${r.page}"${r.slug ? ` data-slug="${r.slug}"` : ""}` :
      r.status === "already-migrated" ? `·  ${r.file}  (already migrated)` :
      r.status === "no-mount"        ? `?  ${r.file}  (no mount block — left untouched)` :
                                       `·  ${r.file}  (${r.status})`;
    console.log(tag);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
