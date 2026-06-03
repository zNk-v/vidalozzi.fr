// One-shot: swap react.development.js / react-dom.development.js
// for the production.min.js variants across every HTML page.
//
// Why: dev builds ship invariant checks, prop-type warnings, and verbose source.
// Prod builds are roughly 1/3 the size and run noticeably faster — that's a free
// LCP / INP win on every page load.

import { promises as fs } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const PAGES = [
  "index.html", "ugc.html", "talent.html", "blog.html", "ugc.bundle.html",
  "choisir-createur-ugc.html", "erreurs-brief-ugc.html", "formats-ugc-meta-ads.html",
  "modele-brief-ugc.html", "prix-createur-ugc-france.html",
  "ugc-convertit-mieux-que-pub-classique.html", "ugc-ecommerce-fiches-produit.html",
  "ugc-vs-influenceur.html",
];

// Replace the entire <script ...react(.dom)?.development.js"...></script> tag.
// We drop the SRI integrity hash because it was pinned to the dev build's hash;
// the new src would fail SRI verification otherwise.
const REACT_DEV = /<script\s+src="https:\/\/unpkg\.com\/react@18\.3\.1\/umd\/react\.development\.js"[^>]*><\/script>/;
const REACTDOM_DEV = /<script\s+src="https:\/\/unpkg\.com\/react-dom@18\.3\.1\/umd\/react-dom\.development\.js"[^>]*><\/script>/;

const REACT_PROD = `<script src="https://unpkg.com/react@18.3.1/umd/react.production.min.js" crossorigin="anonymous"></script>`;
const REACTDOM_PROD = `<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js" crossorigin="anonymous"></script>`;

async function migrate(file) {
  const path = join(ROOT, file);
  let html;
  try { html = await fs.readFile(path, "utf8"); }
  catch { return { file, status: "missing" }; }

  let changed = false;
  if (REACT_DEV.test(html)) { html = html.replace(REACT_DEV, REACT_PROD); changed = true; }
  if (REACTDOM_DEV.test(html)) { html = html.replace(REACTDOM_DEV, REACTDOM_PROD); changed = true; }

  if (changed) await fs.writeFile(path, html);
  return { file, status: changed ? "migrated" : "skip" };
}

const results = [];
for (const f of PAGES) results.push(await migrate(f));
for (const r of results) {
  console.log(r.status === "migrated" ? `✔  ${r.file}` : `·  ${r.file} (${r.status})`);
}
