#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────
// Publication automatique des articles programmés.
//
// Lit les dates (dateISO) dans blog-data.js. Pour chaque article dont la date
// est arrivée (dateISO <= aujourd'hui, UTC) :
//   1. passe sa page HTML statique de "noindex" → "index" (pour Google) ;
//   2. l'ajoute au sitemap.xml s'il n'y est pas déjà.
//
// Exécuté chaque jour par .github/workflows/publish-articles.yml.
// Idempotent : ne touche que ce qui doit changer, ne fait rien sinon.
// ─────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://vidalozzi.fr";
const INDEX_ROBOTS = "index, follow, max-image-preview:large, max-snippet:-1";
const NOINDEX_ROBOTS = "noindex, nofollow";

// — Date du jour à minuit UTC —
const today = new Date();
today.setUTCHours(0, 0, 0, 0);

// — Charger window.BLOG_POSTS depuis blog-data.js (fichier non-module) —
function loadPosts() {
  const code = fs.readFileSync(path.join(ROOT, "blog-data.js"), "utf8");
  const ctx = { window: {} };
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  const posts = ctx.window.BLOG_POSTS;
  if (!Array.isArray(posts)) throw new Error("window.BLOG_POSTS introuvable dans blog-data.js");
  return posts;
}

const isDue = (iso) => new Date(iso + "T00:00:00Z") <= today;

// — Passe une page statique en index si elle est encore en noindex —
function activateHtml(slug) {
  const file = path.join(ROOT, `${slug}.html`);
  if (!fs.existsSync(file)) {
    console.log(`  ⚠️  ${slug}.html introuvable — ignoré`);
    return false;
  }
  let html = fs.readFileSync(file, "utf8");
  if (!html.includes(`content="${NOINDEX_ROBOTS}"`)) return false; // déjà en index
  html = html.replace(`content="${NOINDEX_ROBOTS}"`, `content="${INDEX_ROBOTS}"`);
  fs.writeFileSync(file, html);
  console.log(`  ✅ ${slug}.html → index, follow`);
  return true;
}

// — Ajoute l'article au sitemap s'il n'y est pas déjà (entrée active) —
function addToSitemap(sitemap, slug, iso) {
  const loc = `${SITE}/${slug}.html`;
  // On ignore les commentaires pour le test de présence
  const active = sitemap.replace(/<!--[\s\S]*?-->/g, "");
  if (active.includes(`<loc>${loc}</loc>`)) return { sitemap, changed: false };
  const block =
    `  <url>\n` +
    `    <loc>${loc}</loc>\n` +
    `    <lastmod>${iso}</lastmod>\n` +
    `    <changefreq>monthly</changefreq>\n` +
    `    <priority>0.7</priority>\n` +
    `  </url>\n`;
  const updated = sitemap.replace(/(\s*)<\/urlset>/, `\n${block}</urlset>`);
  console.log(`  ✅ ${slug}.html ajouté au sitemap (lastmod ${iso})`);
  return { sitemap: updated, changed: true };
}

function main() {
  const posts = loadPosts();
  const due = posts.filter((p) => isDue(p.dateISO));
  console.log(`Date du jour (UTC) : ${today.toISOString().slice(0, 10)}`);
  console.log(`Articles arrivés à échéance : ${due.length}/${posts.length}`);

  let changed = false;
  for (const p of due) changed = activateHtml(p.slug) || changed;

  const sitemapPath = path.join(ROOT, "sitemap.xml");
  let sitemap = fs.readFileSync(sitemapPath, "utf8");
  let sitemapChanged = false;
  for (const p of due) {
    const res = addToSitemap(sitemap, p.slug, p.dateISO);
    sitemap = res.sitemap;
    sitemapChanged = res.changed || sitemapChanged;
  }
  if (sitemapChanged) {
    fs.writeFileSync(sitemapPath, sitemap);
    changed = true;
  }

  if (!changed) {
    console.log("Rien à publier aujourd'hui. ✓");
  } else {
    console.log("Des changements ont été appliqués.");
  }
  // Code de sortie 0 dans tous les cas ; le workflow committe si le dépôt a changé.
}

main();
