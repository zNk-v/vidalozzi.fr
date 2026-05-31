/**
 * <video-slot> — user-fillable video placeholder.
 * Drag-drop a video file → stored as Blob in IndexedDB, persists across reloads.
 * Includes hover-revealed play/pause + mute/volume controls.
 *
 * Attrs:
 *   id           Required. Storage key.
 *   placeholder  Empty-state caption.
 *   poster       Optional poster image while video loads.
 *   autoplay     Boolean — autoplay when filled (muted).
 *   loop         Boolean — loop playback.
 *
 * Size via CSS on the element (width/height or aspect-ratio).
 */
(() => {
  const DB_NAME = 'video-slots';
  const STORE = 'videos';
  let _db = null;
  function openDB() {
    if (_db) return Promise.resolve(_db);
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => { _db = req.result; resolve(_db); };
      req.onerror = () => reject(req.error);
    });
  }
  async function putBlob(id, blob) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(blob, id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
  async function getBlob(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const r = tx.objectStore(STORE).get(id);
      r.onsuccess = () => resolve(r.result || null);
      r.onerror = () => reject(r.error);
    });
  }
  async function delBlob(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  const css = `
    :host{display:block;position:relative;width:100%;height:100%;
      font:13px/1.3 system-ui,-apple-system,sans-serif;color:rgba(244,239,230,0.7)}
    .frame{position:absolute;inset:0;overflow:hidden;background:rgba(0,0,0,0.5);border-radius:inherit}
    video{width:100%;height:100%;object-fit:cover;display:block;background:#000}
    .empty{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;
      cursor:pointer;transition:background 0.25s ease;border:1px dashed rgba(244,239,230,0.18);border-radius:inherit}
    .empty:hover,:host([data-dragging]) .empty{background:rgba(201,168,124,0.06);border-color:rgba(201,168,124,0.4)}
    .empty svg{opacity:0.55}
    .empty .cap{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.7}
    .empty .sub{font-size:10px;opacity:0.5;font-family:'JetBrains Mono',monospace;letter-spacing:0.1em}
    .ctl-wrap{position:absolute;left:0;right:0;bottom:0;padding:60px 14px 14px;
      background:linear-gradient(0deg,rgba(0,0,0,0.7),transparent);
      opacity:0;transition:opacity 0.25s ease;pointer-events:none;z-index:3;
      display:flex;flex-direction:column;gap:10px}
    :host(:hover) .ctl-wrap{opacity:1;pointer-events:auto}
    .progress{position:relative;width:100%;height:14px;display:flex;align-items:center;cursor:pointer;touch-action:none}
    .progress .track{position:relative;width:100%;height:2px;background:rgba(244,239,230,0.25);border-radius:2px;overflow:visible;transition:height 0.15s ease}
    .progress:hover .track,.progress[data-scrubbing] .track{height:4px}
    .progress .fill{height:100%;background:var(--accent,#C9A87C);width:0%;border-radius:2px;transition:width 0.1s linear;pointer-events:none}
    .progress[data-scrubbing] .fill{transition:none}
    .progress .thumb{position:absolute;top:50%;left:0%;width:12px;height:12px;border-radius:999px;background:var(--accent,#C9A87C);transform:translate(-50%,-50%) scale(0);transition:transform 0.15s ease;pointer-events:none;box-shadow:0 1px 4px rgba(0,0,0,0.4)}
    .progress:hover .thumb,.progress[data-scrubbing] .thumb{transform:translate(-50%,-50%) scale(1)}
    .time{font:10px/1 'JetBrains Mono',monospace;letter-spacing:0.08em;color:rgba(244,239,230,0.7);min-width:80px;text-align:right;font-variant-numeric:tabular-nums}
    .ctl-row{display:flex;align-items:center;gap:10px}
    button{appearance:none;border:0.5px solid rgba(244,239,230,0.25);
      background:rgba(244,239,230,0.12);color:rgba(244,239,230,0.95);
      width:28px;height:28px;border-radius:999px;cursor:pointer;
      display:inline-flex;align-items:center;justify-content:center;padding:0;
      backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
    button:hover{background:rgba(244,239,230,0.22)}
    button.wide{width:auto;height:24px;padding:0 10px;border-radius:999px;font:10px/1 'JetBrains Mono',monospace;letter-spacing:0.12em;text-transform:uppercase}
    .vol{flex:1;accent-color:var(--accent,#C9A87C);height:2px}
    .replace{position:absolute;top:12px;right:12px;z-index:4;opacity:0;transition:opacity 0.25s}
    :host(:hover) .replace{opacity:1}
    /* Read-only gate: hide upload affordances when the page isn't in edit mode */
    :host-context(html[data-editmode="0"]) .empty{display:none !important}
    :host-context(html[data-editmode="0"]) .replace{display:none !important}
    input[type=file]{display:none}
    .label{position:absolute;top:14px;left:14px;z-index:2;color:rgba(244,239,230,0.92);
      font:10px/1 'JetBrains Mono',monospace;letter-spacing:0.18em;text-transform:uppercase;pointer-events:none;
      text-shadow:0 1px 6px rgba(0,0,0,0.6)}
  `;

  const iconVideo = '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="14" height="12" rx="2"/><path d="m16 10 6-3v10l-6-3"/></svg>';

  class VideoSlot extends HTMLElement {
    static get observedAttributes() { return ['id', 'placeholder', 'poster', 'autoplay', 'loop', 'label', 'src']; }
    constructor() {
      super();
      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = `<style>${css}</style>
        <div class="frame">
          <video playsinline></video>
          <div class="empty">
            ${iconVideo}
            <div class="cap"></div>
            <div class="sub">Drop video · or click</div>
          </div>
          <div class="ctl-wrap">
            <div class="progress" data-act="seek"><div class="track"><div class="fill"></div><div class="thumb"></div></div></div>
            <div class="ctl-row">
              <button data-act="play" title="Play/Pause">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><rect x="3" y="2.5" width="3.5" height="11" rx="0.5"/><rect x="9.5" y="2.5" width="3.5" height="11" rx="0.5"/></svg>
              </button>
              <button data-act="mute" title="Mute">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M7 3L4 5.5H2v5h2L7 13V3z"/></svg>
              </button>
              <input class="vol" type="range" min="0" max="1" step="0.01" value="0">
              <span class="time">0:00 / 0:00</span>
            </div>
          </div>
          <button class="replace wide" data-act="replace">Replace</button>
          <input type="file" accept="video/*">
        </div>`;
      this._root = root;
      this._video = root.querySelector('video');
      this._empty = root.querySelector('.empty');
      this._cap = root.querySelector('.cap');
      this._progress = root.querySelector('.progress .fill');
      this._thumb = root.querySelector('.progress .thumb');
      this._scrubber = root.querySelector('.progress');
      this._time = root.querySelector('.time');
      this._btnPlay = root.querySelector('[data-act="play"]');
      this._btnMute = root.querySelector('[data-act="mute"]');
      this._vol = root.querySelector('.vol');
      this._fileInput = root.querySelector('input[type=file]');
      this._replaceBtn = root.querySelector('.replace');
      this._objUrl = null;
      this._filled = false;
    }

    connectedCallback() {
      this._sync();
      const isEditable = () => document.documentElement.dataset.editmode === '1';
      // empty / replace → file picker (only in edit mode)
      this._empty.addEventListener('click', () => { if (isEditable()) this._fileInput.click(); });
      this._replaceBtn.addEventListener('click', (e) => { e.stopPropagation(); if (isEditable()) this._fileInput.click(); });
      this._fileInput.addEventListener('change', (e) => {
        const f = e.target.files && e.target.files[0];
        if (f) this._setFile(f);
        e.target.value = '';
      });
      // drag-drop (only in edit mode)
      ['dragenter', 'dragover'].forEach(ev => this.addEventListener(ev, (e) => { if (!isEditable()) return; e.preventDefault(); this.setAttribute('data-dragging', ''); }));
      ['dragleave', 'drop'].forEach(ev => this.addEventListener(ev, (e) => { if (!isEditable()) return; e.preventDefault(); this.removeAttribute('data-dragging'); }));
      this.addEventListener('drop', (e) => {
        if (!isEditable()) return;
        const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (f && f.type.startsWith('video/')) this._setFile(f);
      });
      // controls
      this._video.addEventListener('click', () => this._toggle());
      this._btnPlay.addEventListener('click', (e) => { e.stopPropagation(); this._toggle(); });
      this._btnMute.addEventListener('click', (e) => { e.stopPropagation(); this._toggleMute(); });
      this._vol.addEventListener('input', (e) => { e.stopPropagation(); this._setVolume(parseFloat(e.target.value)); });
      this._vol.addEventListener('click', (e) => e.stopPropagation());
      this._video.addEventListener('timeupdate', () => { if (!this._scrubbing) this._renderProgress(); });
      this._video.addEventListener('loadedmetadata', () => this._renderProgress());
      this._video.addEventListener('durationchange', () => this._renderProgress());
      // scrubber: click + drag to seek
      const seekFromEvent = (e) => {
        const v = this._video; if (!v.duration || !isFinite(v.duration)) return;
        const rect = this._scrubber.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const pct = Math.max(0, Math.min(1, x / rect.width));
        v.currentTime = pct * v.duration;
        this._renderProgress(pct);
      };
      this._scrubber.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        if (!this._filled) return;
        this._scrubbing = true;
        this._wasPaused = this._video.paused;
        this._video.pause();
        this._scrubber.setAttribute('data-scrubbing', '');
        try { this._scrubber.setPointerCapture(e.pointerId); } catch {}
        seekFromEvent(e);
      });
      this._scrubber.addEventListener('pointermove', (e) => {
        if (!this._scrubbing) return;
        e.stopPropagation();
        seekFromEvent(e);
      });
      const endScrub = (e) => {
        if (!this._scrubbing) return;
        this._scrubbing = false;
        this._scrubber.removeAttribute('data-scrubbing');
        try { this._scrubber.releasePointerCapture(e.pointerId); } catch {}
        if (!this._wasPaused) { const p = this._video.play(); if (p && p.catch) p.catch(() => {}); }
      };
      this._scrubber.addEventListener('pointerup', endScrub);
      this._scrubber.addEventListener('pointercancel', endScrub);
      this._scrubber.addEventListener('click', (e) => e.stopPropagation());
      this._fmt = (s) => { if (!isFinite(s)) return '0:00'; const m = Math.floor(s/60); const r = Math.floor(s%60); return m + ':' + (r<10?'0':'') + r; };
      this._video.addEventListener('play', () => this._renderPlayIcon(true));
      this._video.addEventListener('pause', () => this._renderPlayIcon(false));
      // load existing
      this._load();
    }

    attributeChangedCallback() { this._sync(); }

    _sync() {
      this._cap.textContent = this.getAttribute('placeholder') || 'Drop video';
      if (this.hasAttribute('poster')) this._video.poster = this.getAttribute('poster');
      this._video.loop = this.hasAttribute('loop');
      this._video.autoplay = this.hasAttribute('autoplay');
      this._video.muted = true; // browsers require muted for autoplay
      const labelText = this.getAttribute('label');
      if (labelText) {
        let lbl = this._root.querySelector('.label');
        if (!lbl) {
          lbl = document.createElement('div');
          lbl.className = 'label';
          this._root.querySelector('.frame').appendChild(lbl);
        }
        lbl.textContent = labelText;
      }
    }

    async _load() {
      const id = this.getAttribute('id');
      if (!id) return;
      try {
        const blob = await getBlob(id);
        if (blob) { this._useBlob(blob); return; }
      } catch {}
      // No IndexedDB blob — fall back to a static src= if author provided one
      const src = this.getAttribute('src');
      if (src) this._useSrc(src);
    }

    async _setFile(file) {
      const id = this.getAttribute('id');
      if (!id) return;
      try { await putBlob(id, file); } catch (err) { console.warn('video-slot store failed', err); }
      this._useBlob(file);
    }

    _useBlob(blob) {
      if (this._objUrl) URL.revokeObjectURL(this._objUrl);
      this._objUrl = URL.createObjectURL(blob);
      this._video.src = this._objUrl;
      this._video.style.display = 'block';
      this._empty.style.display = 'none';
      this._filled = true;
      this.setAttribute('data-filled', '');
      // try autoplay
      const v = this._video;
      v.muted = true;
      const p = v.play(); if (p && p.catch) p.catch(() => {});
      this._renderMuteIcon(true);
      this._vol.value = 0;
    }

    _useSrc(src) {
      if (this._objUrl) { URL.revokeObjectURL(this._objUrl); this._objUrl = null; }
      this._video.src = src;
      this._video.style.display = 'block';
      this._empty.style.display = 'none';
      this._filled = true;
      this.setAttribute('data-filled', '');
      const v = this._video;
      v.muted = true;
      const p = v.play(); if (p && p.catch) p.catch(() => {});
      this._renderMuteIcon(true);
      this._vol.value = 0;
    }

    _toggle() {
      if (!this._filled) return;
      const v = this._video;
      if (v.paused) v.play(); else v.pause();
    }
    _toggleMute() {
      const v = this._video;
      if (v.muted || v.volume === 0) {
        v.muted = false;
        if (v.volume === 0) v.volume = 0.8;
        this._vol.value = v.volume;
        this._renderMuteIcon(false);
      } else {
        v.muted = true;
        this._vol.value = 0;
        this._renderMuteIcon(true);
      }
    }
    _setVolume(val) {
      const v = this._video;
      v.volume = val;
      v.muted = (val === 0);
      this._renderMuteIcon(v.muted);
    }
    _renderProgress(pctOverride) {
      const v = this._video;
      const pct = pctOverride != null ? pctOverride : (v.currentTime / (v.duration || 1));
      const p = Math.max(0, Math.min(1, pct)) * 100;
      this._progress.style.width = p + '%';
      if (this._thumb) this._thumb.style.left = p + '%';
      if (this._time) this._time.textContent = this._fmt(v.currentTime) + ' / ' + this._fmt(v.duration);
    }
    _renderPlayIcon(playing) {
      this._btnPlay.innerHTML = playing
        ? '<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><rect x="3" y="2.5" width="3.5" height="11" rx="0.5"/><rect x="9.5" y="2.5" width="3.5" height="11" rx="0.5"/></svg>'
        : '<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M4 2.5v11l9-5.5z"/></svg>';
    }
    _renderMuteIcon(muted) {
      this._btnMute.innerHTML = muted
        ? '<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M7 3L4 5.5H2v5h2L7 13V3z"/><path d="M10 6l4 4M14 6l-4 4" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>'
        : '<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M7 3L4 5.5H2v5h2L7 13V3z"/><path d="M10 5.5a3.5 3.5 0 010 5M12 4a5.5 5.5 0 010 8" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>';
    }
  }

  if (!customElements.get('video-slot')) customElements.define('video-slot', VideoSlot);
})();
