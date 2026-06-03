// Build script — compiles all JSX sources into a single bundle dist/vidalozzi.bundle.js
// Run: npm run build
//
// What it does:
//   1. Concatenates the source .jsx files in load order (mirrors the original <script> order).
//   2. Appends a tiny auto-mount runtime that reads <body data-page="..."> and renders <App />.
//   3. Transforms the concatenated source from JSX -> ES2017 JS with esbuild.
//   4. Writes dist/vidalozzi.bundle.js (plain <script>, no Babel CDN, no type="module").
//
// Why a single concatenated file:
//   - Each .jsx attaches things to window (HomePage, UgcPage, App, etc.) — there are no imports.
//   - One HTTP request beats six on every page load.
//   - No bundler config to maintain. esbuild just does the transform.

import { build } from "esbuild";
import { promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DIST = join(ROOT, "dist");

// Load order must match what the HTML files used to do with <script type="text/babel">.
// shared depends on React globals; home/ugc/talent/blog depend on shared; app depends on all of them.
const SOURCES = [
  "tweaks-panel.jsx",
  "shared.jsx",
  "home.jsx",
  "ugc.jsx",
  "talent.jsx",
  "blog.jsx",
  "app.jsx",
];

// Tiny runtime appended at the very end of the bundle. Reads data-page / data-slug
// from <body> and mounts <VIDALOZZI_App />. This replaces the per-page inline
// <script type="text/babel">ReactDOM.createRoot(...).render(...)</script> block.
const MOUNT_RUNTIME = `
// ── Auto-mount ──────────────────────────────────────────────────────
(function () {
  function mount() {
    var root = document.getElementById("root");
    if (!root) return;
    var page = document.body.dataset.page || "home";
    var slug = document.body.dataset.slug || undefined;
    if (typeof window.VIDALOZZI_App !== "function") {
      console.error("[vidalozzi] App not ready; bundle likely failed to load.");
      return;
    }
    ReactDOM.createRoot(root).render(
      React.createElement(window.VIDALOZZI_App, { page: page, slug: slug })
    );
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
`;

async function main() {
  await fs.mkdir(DIST, { recursive: true });

  // Read sources and concatenate. Each source file used to be loaded as a separate
  // <script type="text/babel"> by Babel-in-browser, which gave each file its own
  // top-level scope. Once we concatenate, the repeated `const { useState, ... } = React;`
  // lines collide. We strip every per-file React destructuring and emit one shared
  // preamble at the top of the bundle. Sources on disk stay untouched.
  const REACT_DESTRUCTURE_RE = /^\s*const\s*\{[^}]+\}\s*=\s*React\s*;\s*$/gm;

  const PREAMBLE = `// Shared React hooks (deduplicated from per-file destructuring).\n` +
    `var { useState, useEffect, useRef, useMemo, useCallback, useReducer, useLayoutEffect } = React;\n`;

  const parts = [PREAMBLE];
  for (const file of SOURCES) {
    const path = join(ROOT, file);
    let src = await fs.readFile(path, "utf8");
    src = src.replace(REACT_DESTRUCTURE_RE, "// (React destructuring hoisted to bundle preamble)");
    parts.push(`\n/* ── ${file} ─────────────────────────────────────────── */\n`);
    parts.push(src);
  }
  parts.push(MOUNT_RUNTIME);
  const combined = parts.join("\n");

  // esbuild: transform JSX -> JS, no bundling (sources have no imports).
  // We use `transform` semantics via build(stdin).
  const result = await build({
    stdin: {
      contents: combined,
      resolveDir: ROOT,
      sourcefile: "vidalozzi.bundle.jsx",
      loader: "jsx",
    },
    bundle: false,
    write: true,
    outfile: join(DIST, "vidalozzi.bundle.js"),
    minify: true,
    sourcemap: true,
    target: ["es2017"],
    jsx: "transform",        // classic React.createElement, matches what Babel was emitting
    jsxFactory: "React.createElement",
    jsxFragment: "React.Fragment",
    legalComments: "none",
    logLevel: "info",
  });

  const stat = await fs.stat(join(DIST, "vidalozzi.bundle.js"));
  console.log(`\n✔  dist/vidalozzi.bundle.js — ${(stat.size / 1024).toFixed(1)} KB minified`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
