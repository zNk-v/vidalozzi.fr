/**
 * content-editor.js — In-place text editing for the whole site.
 *
 * - Walks window.COPY to build a string → path map for the current language.
 * - Tags DOM elements whose text matches a COPY value with data-copy-path.
 * - In edit mode (html[data-editmode="1"]), tagged elements become
 *   contenteditable; on blur, the new value is saved to localStorage AND
 *   mutated into window.COPY so React renders the new value.
 * - On page load, overrides from localStorage are applied to window.COPY
 *   before React mounts (this script is included before app.jsx).
 *
 * Usage: just include after copy.js. Edit mode toggles via existing app
 * shortcut (Cmd/Ctrl+Shift+E) or the Tweaks panel.
 */
(() => {
  const STORAGE_KEY = 'vz_text_overrides';

  // ── overrides store ────────────────────────────────────────────
  let overrides;
  try { overrides = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { overrides = {}; }
  overrides.fr = overrides.fr || {};
  overrides.en = overrides.en || {};

  const saveOverrides = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));

  const setByPath = (obj, path, value) => {
    const parts = path.split('.');
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      const k = parts[i];
      cur = Array.isArray(cur) ? cur[parseInt(k, 10)] : cur[k];
      if (cur == null) return;
    }
    const last = parts[parts.length - 1];
    if (Array.isArray(cur)) cur[parseInt(last, 10)] = value;
    else cur[last] = value;
  };

  const applyOverridesToCopy = () => {
    if (!window.COPY) return;
    for (const lang of Object.keys(window.COPY)) {
      const lo = overrides[lang] || {};
      for (const [path, value] of Object.entries(lo)) {
        setByPath(window.COPY[lang], path, value);
      }
    }
  };

  // Apply immediately so React reads overridden values on first render
  applyOverridesToCopy();

  // ── string → path map ──────────────────────────────────────────
  const currentLang = () => localStorage.getItem('vz_lang') || 'fr';

  const buildStrMap = (lang) => {
    const map = new Map();
    const add = (val, path) => {
      if (!map.has(val)) map.set(val, []);
      map.get(val).push(path);
    };
    const walk = (obj, prefix) => {
      if (Array.isArray(obj)) {
        obj.forEach((item, i) => walkValue(item, prefix + '.' + i));
      } else if (obj && typeof obj === 'object') {
        for (const k of Object.keys(obj)) walkValue(obj[k], prefix ? prefix + '.' + k : k);
      }
    };
    const walkValue = (v, path) => {
      if (typeof v === 'string') add(v, path);
      else walk(v, path);
    };
    walk(window.COPY[lang], '');
    return map;
  };

  let strMap = null;
  let lastLang = null;

  // ── DOM walking & tagging ──────────────────────────────────────
  // Use a per-call cache of "next available index" for ambiguous strings
  // so duplicate captions get distributed across paths.
  const tagElements = () => {
    if (!window.COPY) return;
    const lang = currentLang();
    if (lang !== lastLang || !strMap) {
      strMap = buildStrMap(lang);
      lastLang = lang;
    }
    const usedIndex = new Map(); // string → next index to take from strMap

    const accept = (parent) => {
      if (!parent) return false;
      if (parent.closest('[data-no-edit]')) return false;
      const t = parent.tagName;
      if (t === 'SCRIPT' || t === 'STYLE' || t === 'NOSCRIPT') return false;
      return true;
    };

    const tagTextNode = (node) => {
      const raw = node.nodeValue;
      const text = raw.trim();
      if (!text) return;
      const paths = strMap.get(text);
      if (!paths || !paths.length) return;
      const i = usedIndex.get(text) || 0;
      const path = paths[Math.min(i, paths.length - 1)];
      usedIndex.set(text, i + 1);

      const p = node.parentElement;
      if (!p) return;
      // If parent has only whitespace + this node → tag parent itself
      const onlyTextHere = Array.from(p.childNodes).every(c =>
        c === node || (c.nodeType === 3 && !c.nodeValue.trim()) || c.nodeType === 8
      );
      if (onlyTextHere) {
        if (p.dataset.copyPath !== path) p.dataset.copyPath = path;
      } else {
        // wrap text node in a span so we can edit just this fragment
        if (p.dataset.copyPath) return; // parent already handles it
        const wrap = document.createElement('span');
        wrap.dataset.copyPath = path;
        wrap.dataset.copyWrap = '1';
        wrap.textContent = raw;
        node.parentNode.replaceChild(wrap, node);
      }
    };

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (accept(n.parentElement) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
    });
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(tagTextNode);
  };

  // ── editable state ─────────────────────────────────────────────
  const applyEditableState = () => {
    const on = document.documentElement.dataset.editmode === '1';
    document.querySelectorAll('[data-copy-path]').forEach((el) => {
      if (on) {
        el.setAttribute('contenteditable', 'plaintext-only');
        el.setAttribute('spellcheck', 'false');
        el.classList.add('vz-editable-text');
      } else {
        el.removeAttribute('contenteditable');
        el.removeAttribute('spellcheck');
        el.classList.remove('vz-editable-text');
      }
    });
  };

  // ── persist edits ──────────────────────────────────────────────
  const persistEdit = (el) => {
    const path = el.dataset.copyPath;
    if (!path) return;
    const newVal = el.textContent.replace(/\s+$/, '').replace(/^\s+/, '');
    const lang = currentLang();
    overrides[lang][path] = newVal;
    saveOverrides();
    setByPath(window.COPY[lang], path, newVal);
    // sync any other DOM nodes pointing to the same path
    document.querySelectorAll('[data-copy-path="' + CSS.escape(path) + '"]').forEach((o) => {
      if (o !== el && o.textContent !== newVal) o.textContent = newVal;
    });
    // update strMap so re-walks still find this string under the same path
    strMap = null;
  };

  document.addEventListener('blur', (e) => {
    const el = e.target;
    if (!el || !el.dataset || !el.dataset.copyPath) return;
    if (document.documentElement.dataset.editmode !== '1') return;
    persistEdit(el);
  }, true);

  document.addEventListener('keydown', (e) => {
    const el = e.target;
    if (!el || !el.dataset || !el.dataset.copyPath) return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      el.blur();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      el.blur();
    }
  });

  // ── init ───────────────────────────────────────────────────────
  // Inject styles for editable highlighting
  const style = document.createElement('style');
  style.textContent = `
    html[data-editmode="1"] [data-copy-path] {
      outline: 1px dashed transparent;
      outline-offset: 2px;
      transition: outline-color 0.15s ease, background-color 0.15s ease;
      cursor: text;
      border-radius: 2px;
    }
    html[data-editmode="1"] [data-copy-path]:hover {
      outline-color: var(--accent, #C9A87C);
      background-color: rgba(201,168,124,0.06);
    }
    html[data-editmode="1"] [data-copy-path]:focus {
      outline: 1px solid var(--accent, #C9A87C);
      outline-offset: 2px;
      background-color: rgba(201,168,124,0.10);
    }
    html[data-editmode="1"] [data-copy-path]::selection { background: var(--accent, #C9A87C); color: #0E0B08; }
  `;
  (document.head || document.documentElement).appendChild(style);

  let pending = null;
  const schedule = () => {
    if (pending) return;
    pending = setTimeout(() => {
      pending = null;
      tagElements();
      applyEditableState();
    }, 80);
  };

  const init = () => {
    schedule();
    // Re-tag on DOM mutations (React re-renders, route changes)
    const obs = new MutationObserver((muts) => {
      // ignore our own mutations: attribute changes on data-copy-path elements
      const significant = muts.some((m) => {
        if (m.type === 'attributes') return false;
        // Skip text-only changes inside already-tagged editables
        if (m.type === 'characterData') {
          const p = m.target.parentElement;
          if (p && p.dataset && p.dataset.copyPath) return false;
        }
        return true;
      });
      if (significant) schedule();
    });
    obs.observe(document.body, { childList: true, subtree: true, characterData: true });

    // Watch edit-mode attr changes
    new MutationObserver(applyEditableState).observe(document.documentElement, {
      attributes: true, attributeFilter: ['data-editmode'],
    });

    // Detect language change
    let cachedLang = currentLang();
    setInterval(() => {
      const cur = currentLang();
      if (cur !== cachedLang) {
        cachedLang = cur;
        strMap = null;
        // clear stale tags so we re-discover
        document.querySelectorAll('[data-copy-path]').forEach((el) => {
          if (el.dataset.copyWrap) {
            // unwrap
            const txt = document.createTextNode(el.textContent);
            el.parentNode && el.parentNode.replaceChild(txt, el);
          } else {
            delete el.dataset.copyPath;
          }
        });
        schedule();
      }
    }, 400);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Public API for reset button
  window.VZ_TEXT = {
    reset() {
      localStorage.removeItem(STORAGE_KEY);
      location.reload();
    },
    export() {
      return JSON.parse(JSON.stringify(overrides));
    },
    overrides,
  };
})();
