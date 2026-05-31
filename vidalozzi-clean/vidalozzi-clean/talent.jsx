// VIDALOZZI — Talent Page

function TalentHero({ t }) {
  return (
    <section style={{ paddingTop: 160, paddingBottom: 80 }}>
      <div className="wrap">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 48 }}>
          <span className="eyebrow">— {t.talent.crumb}</span>
          <span className="mono" style={{ fontSize: 11, color: "var(--ink-faint)" }}>SECTION 01 / UGC</span>
        </div>
        <h1 className="display" style={{ fontSize: "clamp(80px, 14vw, 220px)", marginBottom: 56, lineHeight: 0.88 }}>
          <span>{t.talent.heroLine1}</span><br />
          <span className="script" style={{ color: "var(--accent)", fontSize: "1.1em", lineHeight: 0.8, display: "inline-block", transform: "translateY(0.05em) rotate(-2deg)" }}>{t.talent.heroLine2}</span>
        </h1>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "flex-end" }}>
          <p style={{ fontSize: 18, lineHeight: 1.55, color: "var(--ink-mute)", maxWidth: 520 }}>{t.talent.heroSub}</p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <a className="btn-ghost" href="#press" style={{ display: "inline-flex" }}>↓ {t.talent.pressKit}</a>
          </div>
        </div>
      </div>
    </section>);

}

function TalentPortfolio({ t }) {
  // Editorial & Campagne — mixed-orientation grid, persisted server-side via <image-slot>
  const gridRef = React.useRef(null);

  // Detect landscape vs portrait per slot once filled, tag for CSS span control.
  React.useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const slots = Array.from(grid.querySelectorAll("image-slot"));

    const tag = (slot) => {
      const img = slot.shadowRoot && slot.shadowRoot.querySelector("img");
      if (!img) return;
      const apply = () => {
        if (img.naturalWidth && img.naturalHeight) {
          const isLandscape = img.naturalWidth > img.naturalHeight * 1.05;
          slot.classList.toggle("is-landscape", isLandscape);
          slot.classList.toggle("is-portrait", !isLandscape);
        }
      };
      if (img.complete) apply();
      img.addEventListener("load", apply);
      return () => img.removeEventListener("load", apply);
    };

    const cleanups = [];
    slots.forEach((slot) => {
      // Poll briefly while shadowDOM hydrates, then settle.
      let attempts = 0;
      const tick = () => {
        if (slot.shadowRoot && slot.shadowRoot.querySelector("img")) {
          const c = tag(slot);
          if (c) cleanups.push(c);
        } else if (attempts++ < 30) {
          setTimeout(tick, 100);
        }
      };
      tick();
      // Re-tag when slot becomes filled (image swap).
      const obs = new MutationObserver(() => {
        const c = tag(slot);
        if (c) cleanups.push(c);
      });
      obs.observe(slot, { attributes: true, attributeFilter: ["data-filled"] });
      cleanups.push(() => obs.disconnect());
    });
    return () => cleanups.forEach((fn) => fn && fn());
  }, []);

  return (
    <section style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="section-head">
          <div>
            <div className="eyebrow" style={{ marginBottom: 16 }}>— {t.talent.portfolioLabel}</div>
            <h2 className="display">{t.talent.portfolioHead}</h2>
          </div>
          <div className="mono" style={{ fontSize: 11, color: "var(--ink-faint)" }}>2023 — 2026</div>
        </div>
        <div className="talent-portfolio-grid" ref={gridRef}>
          {Array.from({ length: 9 }).map((_, i) =>
            <image-slot
              key={i}
              id={`portfolio-${i + 1}`}
              shape="rounded"
              radius="4"
              fit="cover"
              placeholder="Editorial / Campagne"
              style={{ display: "block", width: "100%" }}>
            </image-slot>
          )}
        </div>
        <PortfolioMobileCarousel />
      </div>
    </section>);

}

// Mobile-only 3D carousel for Portfolio. Auto-advances, swipe + tap to
// navigate, tap center to open the shared lightbox (with arrow nav between
// all photos). Hidden on desktop and in edit mode (so the grid stays usable
// for managing slots).
function PortfolioMobileCarousel() {
  const [images, setImages] = React.useState([]);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    const tryFetch = async () => {
      // Two paths: production (no leading dot) and OmeLette dev (.image-slots…)
      for (const p of ["image-slots.state.json", ".image-slots.state.json"]) {
        try {
          const r = await fetch(p, { cache: "no-store" });
          if (r.ok) return await r.json();
        } catch (e) {/* try next */}
      }
      return null;
    };
    tryFetch().then((data) => {
      if (cancelled || !data) return;
      const arr = [];
      for (let i = 1; i <= 9; i++) {
        const slot = data[`portfolio-${i}`];
        if (slot && slot.u) arr.push({ src: slot.u, alt: `Editorial ${i}` });
      }
      if (arr.length) {
        setImages(arr);
        setCurrentIndex(Math.floor(arr.length / 2));
      }
    });
    return () => {cancelled = true;};
  }, []);

  const next = React.useCallback(() => {
    setCurrentIndex((i) => images.length ? (i + 1) % images.length : 0);
  }, [images.length]);
  const prev = React.useCallback(() => {
    setCurrentIndex((i) => images.length ? (i - 1 + images.length) % images.length : 0);
  }, [images.length]);

  // Auto-advance — pause briefly after user interaction
  React.useEffect(() => {
    if (paused || images.length <= 1) return;
    const t = setInterval(next, 4500);
    return () => clearInterval(t);
  }, [paused, images.length, next]);

  const touchRef = React.useRef({ x: 0, y: 0, t: 0 });
  const onTouchStart = (e) => {
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY, t: Date.now() };
    setPaused(true);
  };
  const onTouchEnd = (e) => {
    const t = e.changedTouches[0];
    const dx = t.clientX - touchRef.current.x;
    const dy = t.clientY - touchRef.current.y;
    const dt = Date.now() - touchRef.current.t;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2 && dt < 700) {
      dx < 0 ? next() : prev();
    }
    // Resume auto-play after a short pause so user reading isn't interrupted
    setTimeout(() => setPaused(false), 3500);
  };

  const openLightbox = () => {
    document.dispatchEvent(new CustomEvent("vz-open-gallery", {
      detail: {
        items: images.map((i) => i.src),
        index: currentIndex
      }
    }));
  };

  if (!images.length) return null;

  return (
    <div
      className="portfolio-mobile-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}>

      <div
        className="pmc-stage"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}>

        {images.map((img, i) => {
          const total = images.length;
          let pos = (i - currentIndex + total) % total;
          if (pos > Math.floor(total / 2)) pos = pos - total;
          const isCenter = pos === 0;
          const isAdjacent = Math.abs(pos) === 1;
          const visible = Math.abs(pos) <= 1;
          return (
            <div
              key={i}
              className={"pmc-card" + (isCenter ? " is-center" : "")}
              style={{
                transform:
                "translateX(" + pos * 58 + "%) " +
                "scale(" + (isCenter ? 1 : 0.78) + ") " +
                "rotateY(" + pos * -10 + "deg)",
                zIndex: isCenter ? 10 : isAdjacent ? 5 : 1,
                opacity: isCenter ? 1 : isAdjacent ? 0.45 : 0,
                visibility: visible ? "visible" : "hidden",
                pointerEvents: isCenter || isAdjacent ? "auto" : "none"
              }}
              onClick={() => {
                if (isCenter) openLightbox();
                else if (pos < 0) prev();
                else next();
              }}>

              <img src={img.src} alt={img.alt} draggable="false" />
            </div>);

        })}
      </div>
      <div className="pmc-controls" data-no-edit>
        <button className="pmc-btn" onClick={prev} aria-label="Précédent">←</button>
        <span className="pmc-counter mono">
          {String(currentIndex + 1).padStart(2, "0")} <span style={{ opacity: 0.4 }}>/ {String(images.length).padStart(2, "0")}</span>
        </span>
        <button className="pmc-btn" onClick={next} aria-label="Suivant">→</button>
      </div>
    </div>);

}

function TalentFilmo({ t }) {
  return (
    <section style={{ borderTop: "0.5px solid var(--line)" }}>
      <div className="wrap">
        <div className="section-head">
          <div>
            <div className="eyebrow" style={{ marginBottom: 16 }}>— {t.talent.filmoLabel}</div>
            <h2 className="display">{t.talent.filmoHead}</h2>
          </div>
        </div>
        <div className="filmo-table" style={{ borderTop: "0.5px solid var(--line)" }}>
          <div className="filmo-row filmo-head" style={{ display: "grid", gridTemplateColumns: "80px 2fr 1.4fr 2fr 1fr 60px", padding: "16px 0", borderBottom: "0.5px solid var(--line)", color: "var(--ink-faint)", fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", fontFamily: "JetBrains Mono" }}>
            <span>ANNÉE</span><span>Title</span><span>Role</span><span>Direction · Studio</span><span>Type</span><span></span>
          </div>
          {t.talent.films.map((f, i) =>
          <div key={i} className="lift filmo-row" style={{
            display: "grid",
            gridTemplateColumns: "80px 2fr 1.4fr 2fr 1fr 60px",
            padding: "28px 0",
            borderBottom: "0.5px solid var(--line)",
            alignItems: "center",
            cursor: "pointer"
          }}>
              <span className="filmo-year mono" style={{ fontSize: 12, color: "var(--accent)" }}>{f.y}</span>
              <span className="filmo-title display" style={{ fontSize: 28 }}>{f.t}</span>
              <span className="filmo-role" style={{ fontSize: 14, color: "var(--ink-mute)" }}>{f.role}</span>
              <span className="filmo-dir" style={{ fontSize: 13, color: "var(--ink-mute)" }}>{f.dir}</span>
              <span className="filmo-type tag" style={{ alignSelf: "center", height: "28.5px" }}><span className="tag-dot" />{f.type}</span>
              <span className="filmo-arrow" style={{ textAlign: "right", color: "var(--accent)" }}>→</span>
            </div>
          )}
        </div>
      </div>
    </section>);

}

function TalentStats({ t }) {
  const s = t.talent.stats;
  const rows = [
  { l: "Height", v: s.height },
  { l: "Chest", v: s.chest },
  { l: "Waist", v: s.waist },
  { l: "Suit", v: s.suit },
  { l: "Shoe", v: s.shoe },
  { l: "Hair", v: s.hair },
  { l: "Eyes", v: s.eyes }];

  return (
    <section style={{ background: "var(--bg-deep)", borderTop: "0.5px solid var(--line)" }}>
      <div className="wrap">
        <div className="section-head">
          <div>
            <div className="eyebrow" style={{ marginBottom: 16 }}>— {t.talent.statsLabel}</div>
            <h2 className="display">{t.talent.statsHead}</h2>
          </div>
          <a className="btn-ghost" href="#" download id="press">↓ {t.talent.pressKit}</a>
        </div>
        <div className="talent-stats-grid">
          <div className="talent-polaroids-grid">
            {["polaroid-01", "polaroid-02", "polaroid-03", "polaroid-04"].map((id) =>
              <image-slot
                key={id}
                id={id}
                shape="rounded"
                radius="4"
                fit="contain"
                placeholder="Pola"
                style={{ display: "block", width: "100%", aspectRatio: "4 / 5" }}>
              </image-slot>
            )}
          </div>
          <div className="talent-cv">
            <div style={{ borderTop: "0.5px solid var(--line)" }}>
              {rows.map((r, i) =>
              <div key={i} className="cv-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "20px 0", borderBottom: "0.5px solid var(--line)", gap: 16 }}>
                  <span className="label-xs">{r.l}</span>
                  <span className="display cv-val" style={{ fontSize: 22 }}>{r.v}</span>
                </div>
              )}
            </div>
            <div className="cv-extras" style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 24 }}>
              <div>
                <div className="label-xs" style={{ marginBottom: 8 }}>Languages</div>
                <p style={{ fontSize: 16, color: "var(--ink-mute)" }}>{s.languages}</p>
              </div>
              <div>
                <div className="label-xs" style={{ marginBottom: 8 }}>Skills</div>
                <p style={{ fontSize: 16, color: "var(--ink-mute)" }}>{s.skills}</p>
              </div>
              <div>
                <div className="label-xs" style={{ marginBottom: 8 }}>Location</div>
                <p style={{ fontSize: 16, color: "var(--ink-mute)" }}>{s.location}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>);

}

function TalentAgencies({ t }) {
  return (
    <section>
      <div className="wrap">
        <div className="section-head">
          <div>
            <div className="eyebrow" style={{ marginBottom: 16 }}>— {t.talent.agenciesLabel}</div>
            <h2 className="display">{t.talent.agenciesHead}</h2>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {t.talent.agencies.map((a, i) =>
          <div key={i} className="lift" style={{
            padding: 40, border: "0.5px solid var(--line-strong)", borderRadius: 4,
            minHeight: 220, display: "flex", flexDirection: "column", justifyContent: "space-between",
            background: "var(--bg-elev)"
          }}>
              <div className="mono" style={{ fontSize: 11, color: "var(--accent)" }}>0{i + 1} / 02</div>
              <div>
                <h3 className="display" style={{ fontSize: 48, marginBottom: 12 }}>{a.name}</h3>
                <p style={{ color: "var(--ink-mute)", fontSize: 14, marginBottom: 24 }}>{a.scope}</p>
                <a href={`mailto:${a.contact}`} style={{ display: "inline-flex", gap: 12, alignItems: "center", color: "var(--accent)", fontSize: 14, fontFamily: "JetBrains Mono", letterSpacing: "0.06em" }}>
                  → {a.contact}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>);

}

function ImageLightbox() {
  const [gallery, setGallery] = React.useState(null); // { items: string[], index: number }

  React.useEffect(() => {
    const onClick = (e) => {
      const path = e.composedPath();
      if (path.some((n) => n.tagName === "BUTTON")) return;
      if (document.documentElement.dataset.editmode === "1") return;
      const slot = path.find((n) => n.tagName && n.tagName.toLowerCase() === "image-slot");
      if (!slot) return;
      if (!slot.hasAttribute("data-filled")) return;
      const img = slot.shadowRoot && slot.shadowRoot.querySelector("img");
      if (!img || !img.src) return;
      e.preventDefault();
      // Group: all filled image-slots inside the same grid container as the clicked slot
      // (Portfolio grid, polaroids grid, etc). Fall back to standalone if none.
      const container =
      slot.closest(".talent-portfolio-grid, .talent-polaroids-grid") || slot.parentElement;
      const siblings = Array.from(container.querySelectorAll("image-slot")).
      filter((s) => s.hasAttribute("data-filled")).
      map((s) => {
        const i = s.shadowRoot && s.shadowRoot.querySelector("img");
        return i && i.src;
      }).
      filter(Boolean);
      const idx = Math.max(0, siblings.indexOf(img.src));
      setGallery({ items: siblings.length ? siblings : [img.src], index: idx });
    };
    document.addEventListener("click", onClick);
    // Also accept a programmatic open (mobile carousel, etc.)
    const onOpen = (e) => {
      const d = e.detail || {};
      if (Array.isArray(d.items) && d.items.length) {
        setGallery({ items: d.items, index: Math.max(0, Math.min(d.index || 0, d.items.length - 1)) });
      }
    };
    document.addEventListener("vz-open-gallery", onOpen);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("vz-open-gallery", onOpen);
    };
  }, []);

  const close = React.useCallback(() => setGallery(null), []);
  const go = React.useCallback((dir) => {
    setGallery((g) => {
      if (!g) return g;
      const n = g.items.length;
      return { items: g.items, index: (g.index + dir + n) % n };
    });
  }, []);

  React.useEffect(() => {
    if (!gallery) return;
    const onKey = (e) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [gallery, close, go]);

  // Touch swipe (mobile)
  const touchRef = React.useRef({ x: 0, y: 0, t: 0 });
  const onTouchStart = (e) => {
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY, t: Date.now() };
  };
  const onTouchEnd = (e) => {
    const t = e.changedTouches[0];
    const dx = t.clientX - touchRef.current.x;
    const dy = t.clientY - touchRef.current.y;
    const dt = Date.now() - touchRef.current.t;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4 && dt < 600) {
      go(dx < 0 ? 1 : -1);
    }
  };

  if (!gallery) return null;
  const src = gallery.items[gallery.index];
  const multi = gallery.items.length > 1;
  return (
    <div
      onClick={close}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{
        position: "fixed", inset: 0, zIndex: 9998,
        background: "rgba(10,8,6,0.94)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24, cursor: "zoom-out",
        animation: "lb-fade 0.25s ease",
        touchAction: "pan-y"
      }}>

      <style>{`
        @keyframes lb-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes lb-img-in { from { opacity: 0; transform: scale(0.985) } to { opacity: 1; transform: scale(1) } }
        .lb-nav { position: absolute; top: 50%; transform: translateY(-50%);
          width: 56px; height: 56px; border-radius: 999px;
          background: rgba(244,239,230,0.08);
          border: 0.5px solid rgba(244,239,230,0.3);
          color: var(--ink, #F4EFE6);
          font-family: 'JetBrains Mono', monospace; font-size: 20px;
          cursor: pointer; backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s, transform 0.2s;
        }
        .lb-nav:hover { background: rgba(244,239,230,0.18); transform: translateY(-50%) scale(1.05); }
        .lb-nav.prev { left: 24px; }
        .lb-nav.next { right: 24px; }
        @media (max-width: 720px) {
          .lb-nav { display: none !important; }
        }
      `}</style>

      <img
        key={src}
        src={src}
        alt=""
        style={{
          maxWidth: "100%", maxHeight: "100%",
          objectFit: "contain",
          boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
          borderRadius: 2,
          animation: "lb-img-in 0.28s ease"
        }}
        onClick={(e) => e.stopPropagation()} />


      {multi &&
      <>
          <button
          className="lb-nav prev"
          aria-label="Previous"
          onClick={(e) => {e.stopPropagation();go(-1);}}>
          ←
        </button>
          <button
          className="lb-nav next"
          aria-label="Next"
          onClick={(e) => {e.stopPropagation();go(1);}}>
          →
        </button>
        </>
      }

      <button
        onClick={(e) => {e.stopPropagation();close();}}
        aria-label="Close"
        style={{
          position: "absolute", top: 24, right: 24,
          width: 44, height: 44, borderRadius: 999,
          background: "rgba(244,239,230,0.1)",
          border: "0.5px solid rgba(244,239,230,0.3)",
          color: "var(--ink, #F4EFE6)",
          fontFamily: "JetBrains Mono", fontSize: 14,
          cursor: "pointer",
          backdropFilter: "blur(8px)"
        }}>
        ✕
      </button>

      <div style={{
        position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)",
        fontFamily: "JetBrains Mono", fontSize: 10, letterSpacing: "0.16em",
        color: "rgba(244,239,230,0.5)", textTransform: "uppercase",
        pointerEvents: "none",
        whiteSpace: "nowrap",
        display: "flex", gap: 16, alignItems: "center"
      }}>
        {multi &&
        <span>{String(gallery.index + 1).padStart(2, "0")} / {String(gallery.items.length).padStart(2, "0")}</span>
        }
        <span>{multi ? "← → · Swipe · ESC" : "Tap outside · ESC"}</span>
      </div>
    </div>);

}

function TalentPage({ t }) {
  useReveal();
  return (
    <>
      <TalentHero t={t} />
      <TalentPortfolio t={t} />
      <TalentFilmo t={t} />
      <TalentStats t={t} />
      <TalentAgencies t={t} />
      <BrandsMarquee label={t.home.brandsLabel} />
      <Testimonials t={t} />
      <Contact t={t} />
      <Footer t={t} />
      <ImageLightbox />
    </>);

}

window.TalentPage = TalentPage;
