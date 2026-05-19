// VIDALOZZI — UGC Page
function UgcHero({ t }) {
  return (
    <section style={{ paddingTop: 160, paddingBottom: 80 }}>
      <div className="wrap">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 48 }}>
          <span className="eyebrow">— {t.ugc.crumb}</span>
          <span className="mono" style={{ fontSize: 11, color: "var(--ink-faint)" }}>SECTION 02 / TALENT</span>
        </div>
        <h1 className="display" style={{ fontSize: "clamp(72px, 13vw, 200px)", marginBottom: 56, lineHeight: 0.88 }}>
          <span>{t.ugc.heroLine1}</span><br/>
          <span className="script" style={{ color: "var(--accent)", fontSize: "1.1em", lineHeight: 0.8, display: "inline-block", transform: "translateY(0.05em) rotate(-2deg)" }}>{t.ugc.heroLine2}</span>{" "}
          <span>{t.ugc.heroLine3}</span>
        </h1>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "flex-end" }}>
          <p style={{ fontSize: 18, lineHeight: 1.55, color: "var(--ink-mute)", maxWidth: 520 }}>{t.ugc.heroSub}</p>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <a className="btn-primary" href="https://calendly.com/vidalozzi" target="_blank" rel="noreferrer">
              <span className="nav-cta-dot" style={{ background: "var(--bg-deep)" }} />{t.book}<span>→</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function UgcReel({ t }) {
  return (
    <section style={{ padding: "0 0 80px" }}>
      <div className="wrap">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <video-slot
              key={i}
              id={`ugc-tile-${i + 1}`}
              src={`assets/videos/ugc-tile-${i + 1}.mp4`}
              label={`UGC_${String(i + 1).padStart(2, "0")}`}
              placeholder="Drop video"
              autoplay="autoplay"
              loop="loop"
              style={{ aspectRatio: "9/16", borderRadius: 4, overflow: "hidden", display: "block" }}>
            </video-slot>
          ))}
        </div>
      </div>
    </section>
  );
}

function VideoTile({ src, label, coords }) {
  const videoRef = React.useRef(null);
  const [playing, setPlaying] = React.useState(true);
  const [muted, setMuted] = React.useState(true);
  const [volume, setVolume] = React.useState(0.8);
  const [hover, setHover] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => setProgress(v.currentTime / (v.duration || 1));
    v.addEventListener("timeupdate", onTime);
    return () => v.removeEventListener("timeupdate", onTime);
  }, []);

  React.useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = muted;
    v.volume = volume;
  }, [muted, volume]);

  const togglePlay = (e) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); }
    else { v.pause(); setPlaying(false); }
  };
  const onVol = (e) => {
    e.stopPropagation();
    const val = parseFloat(e.target.value);
    setVolume(val);
    setMuted(val === 0);
  };
  const toggleMute = (e) => {
    e.stopPropagation();
    if (muted) { setMuted(false); if (volume === 0) setVolume(0.8); }
    else { setMuted(true); }
  };

  return (
    <div
      className="lift"
      style={{ aspectRatio: "9/16", position: "relative", overflow: "hidden", borderRadius: 4, background: "var(--surface)", cursor: "pointer" }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        src={src}
        autoPlay
        muted
        loop
        playsInline
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        className="hero-img"
      />
      {/* Top gradient + label */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 70, background: "linear-gradient(180deg, rgba(0,0,0,0.5), transparent)", pointerEvents: "none", opacity: hover ? 1 : 0.6, transition: "opacity 0.25s" }} />
      <span className="ph-label" style={{ position: "absolute", top: 14, left: 14, color: "rgba(244,239,230,0.92)", zIndex: 2 }}>{label}</span>
      <span className="ph-coords" style={{ position: "absolute", top: 14, right: 14, color: "rgba(244,239,230,0.8)", zIndex: 2 }}>{coords}</span>

      {/* Bottom controls overlay — fade in on hover */}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0,
        padding: "60px 12px 12px",
        background: "linear-gradient(0deg, rgba(0,0,0,0.7), transparent)",
        opacity: hover ? 1 : 0, transition: "opacity 0.25s ease",
        zIndex: 3, pointerEvents: hover ? "auto" : "none",
        display: "flex", flexDirection: "column", gap: 10,
      }}>
        {/* Progress bar */}
        <div style={{ width: "100%", height: 2, background: "rgba(244,239,230,0.25)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ width: `${progress * 100}%`, height: "100%", background: "var(--accent-glow, #E6C99B)", transition: "width 0.1s linear" }} />
        </div>
        {/* Controls row */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={togglePlay} aria-label={playing ? "Pause" : "Play"} style={ctrlBtnStyle}>
            {playing ? (
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><rect x="3" y="2.5" width="3.5" height="11" rx="0.5"/><rect x="9.5" y="2.5" width="3.5" height="11" rx="0.5"/></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M4 2.5v11l9-5.5z"/></svg>
            )}
          </button>
          <button onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"} style={ctrlBtnStyle}>
            {muted || volume === 0 ? (
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M7 3L4 5.5H2v5h2L7 13V3z"/><path d="M10 6l4 4M14 6l-4 4" stroke="currentColor" strokeWidth="1.2" fill="none"/></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M7 3L4 5.5H2v5h2L7 13V3z"/><path d="M10 5.5a3.5 3.5 0 010 5M12 4a5.5 5.5 0 010 8" stroke="currentColor" strokeWidth="1.2" fill="none"/></svg>
            )}
          </button>
          <input
            type="range"
            min="0" max="1" step="0.01"
            value={muted ? 0 : volume}
            onChange={onVol}
            onClick={(e) => e.stopPropagation()}
            aria-label="Volume"
            style={{ flex: 1, accentColor: "var(--accent-glow, #E6C99B)", height: 2 }}
          />
        </div>
      </div>
    </div>
  );
}

const ctrlBtnStyle = {
  width: 28, height: 28,
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  background: "rgba(244,239,230,0.12)",
  border: "0.5px solid rgba(244,239,230,0.25)",
  borderRadius: 999,
  color: "rgba(244,239,230,0.95)",
  cursor: "pointer",
  padding: 0,
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
};

function UgcServices({ t }) {
  return (
    <section style={{ borderTop: "0.5px solid var(--line)" }}>
      <div className="wrap">
        <div className="section-head">
          <div>
            <div className="eyebrow" style={{ marginBottom: 16 }}>— {t.ugc.servicesLabel}</div>
            <h2 className="display">{t.ugc.servicesHead}</h2>
          </div>
        </div>
        <div className="mobile-carousel" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0, borderTop: "0.5px solid var(--line)", borderLeft: "0.5px solid var(--line)" }}>
          {t.ugc.services.map((s, i) => (
            <div key={i} className="lift" style={{ padding: 32, borderRight: "0.5px solid var(--line)", borderBottom: "0.5px solid var(--line)", minHeight: 240, position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
                <span className="mono" style={{ fontSize: 11, color: "var(--accent)" }}>/ {s.n}</span>
                <span style={{ color: "var(--accent)", fontSize: 12 }}>✦</span>
              </div>
              <h3 className="display" style={{ fontSize: 32, marginBottom: 16 }}>{s.t}</h3>
              <p style={{ color: "var(--ink-mute)", fontSize: 14, lineHeight: 1.6 }}>{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function UgcAddons({ t }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ marginTop: 40, borderTop: "0.5px solid var(--line-strong)", borderBottom: "0.5px solid var(--line-strong)" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          all: "unset",
          width: "100%",
          padding: "32px 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          gap: 24,
        }}>
        <span style={{ display: "flex", alignItems: "baseline", gap: 24 }}>
          <span className="mono" style={{ fontSize: 11, color: "var(--accent)", letterSpacing: "0.18em", textTransform: "uppercase" }}>— {t.ugc.addonsLabel}</span>
          <span className="display" style={{ fontSize: "clamp(28px, 3vw, 44px)", lineHeight: 1 }}>Options & extras</span>
        </span>
        <span style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 40, height: 40, borderRadius: 999,
          border: "0.5px solid var(--line-strong)",
          color: "var(--accent)", fontSize: 22, lineHeight: 1,
          transition: "transform 0.3s ease, background 0.2s",
          transform: open ? "rotate(45deg)" : "rotate(0deg)",
          background: open ? "rgba(201,168,124,0.08)" : "transparent",
        }}>＋</span>
      </button>
      <div style={{
        display: "grid",
        gridTemplateRows: open ? "1fr" : "0fr",
        transition: "grid-template-rows 0.4s ease",
      }}>
        <div style={{ overflow: "hidden" }}>
          <div style={{ paddingBottom: 32 }}>
            {t.ugc.addons.map((a, i) => (
              <div key={i} style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 24,
                alignItems: "baseline",
                padding: "18px 0",
                borderTop: i === 0 ? "0.5px solid var(--line)" : "0",
                borderBottom: "0.5px solid var(--line)",
              }}>
                <span style={{ fontSize: 15, color: "var(--ink)", fontFamily: "var(--font-body)" }}>{a.n}</span>
                <span className="mono" style={{
                  fontSize: 13, color: "var(--accent)",
                  fontFamily: "JetBrains Mono, monospace",
                  letterSpacing: "0.04em",
                  fontVariantNumeric: "tabular-nums",
                  whiteSpace: "nowrap",
                }}>{a.p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function UgcPacks({ t }) {
  return (
    <section style={{ background: "var(--bg-deep)", borderTop: "0.5px solid var(--line)" }}>
      <div className="wrap">
        <div className="section-head">
          <div>
            <div className="eyebrow" style={{ marginBottom: 16 }}>— {t.ugc.packsLabel}</div>
            <h2 className="display">{t.ugc.packsHead}</h2>
          </div>
        </div>
        <div className="mobile-carousel" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {t.ugc.packs.map((p, i) => (            <div key={i} className="lift" style={{
              padding: 32,
              border: p.featured ? "0.5px solid var(--accent)" : "0.5px solid var(--line-strong)",
              borderRadius: 4,
              background: p.featured ? "linear-gradient(180deg, rgba(201,168,124,0.06), rgba(14,11,8,0))" : "transparent",
              position: "relative",
              minHeight: 480,
              display: "flex", flexDirection: "column",
            }}>
              {p.featured && (
                <span className="tag" style={{ position: "absolute", top: -12, left: 24, background: "var(--accent)", color: "var(--bg-deep)", border: "0", fontWeight: 600 }}>
                  <span className="tag-dot" style={{ background: "var(--bg-deep)" }} />Most chosen
                </span>
              )}
              <div className="display" style={{ fontSize: 14, color: p.featured ? "var(--accent)" : "var(--ink-faint)", textTransform: "uppercase", letterSpacing: "0.16em", fontFamily: "JetBrains Mono", marginBottom: 16 }}>
                {String(i + 1).padStart(2, "0")} · {p.name.toUpperCase()}
              </div>
              <h3 className="display" style={{ fontSize: 56, marginBottom: 8 }}>{p.name}</h3>
              <div style={{ fontSize: 18, color: "var(--accent)", marginBottom: 24, fontFamily: "Instrument Serif, serif", fontStyle: "italic" }}>{p.price}</div>
              <p style={{ color: "var(--ink-mute)", fontSize: 14, lineHeight: 1.6, marginBottom: 32 }}>{p.desc}</p>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10, fontSize: 13, marginBottom: 32, flex: 1 }}>
                {p.features.map((f, j) => (
                  <li key={j} style={{ display: "flex", gap: 12, alignItems: "flex-start", color: "var(--ink-mute)" }}>
                    <span style={{ color: "var(--accent)", marginTop: 2 }}>+</span>{f}
                  </li>
                ))}
              </ul>
              <a className={p.featured ? "btn-primary" : "btn-ghost"} href="https://calendly.com/vidalozzi" style={{ justifyContent: "space-between" }}>
                {t.book}<span>→</span>
              </a>
            </div>
          ))}
        </div>
        <UgcAddons t={t} />
      </div>
    </section>
  );
}

function UgcProcess({ t }) {
  return (
    <section>
      <div className="wrap">
        <div className="section-head">
          <div>
            <div className="eyebrow" style={{ marginBottom: 16 }}>— {t.ugc.processLabel}</div>
            <h2 className="display">{t.ugc.processHead}</h2>
          </div>
        </div>
        <div className="mobile-carousel" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, borderTop: "0.5px solid var(--line)" }}>
          {t.ugc.process.map((p, i) => (            <div key={i} style={{ padding: "40px 24px 40px 0", borderRight: i < 3 ? "0.5px solid var(--line)" : "0", paddingLeft: i > 0 ? 24 : 0 }}>
              <div className="mono" style={{ fontSize: 11, color: "var(--accent)", marginBottom: 32 }}>STEP / {p.n}</div>
              <h3 className="display" style={{ fontSize: 36, marginBottom: 16 }}>{p.t}</h3>
              <p style={{ color: "var(--ink-mute)", fontSize: 14, lineHeight: 1.6 }}>{p.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function UgcFaq({ t }) {
  return (
    <section style={{ borderTop: "0.5px solid var(--line)" }}>
      <div className="wrap">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 64, alignItems: "flex-start" }}>
          <div style={{ position: "sticky", top: 100 }}>
            <div className="eyebrow" style={{ marginBottom: 16 }}>— FAQ</div>
            <h2 className="display" style={{ fontSize: "clamp(48px, 5vw, 80px)" }}>{t.ugc.faqHead}</h2>
          </div>
          <Accordion items={t.ugc.faq} />
        </div>
      </div>
    </section>
  );
}

function UgcPage({ t }) {
  useReveal();
  return (
    <>
      <UgcHero t={t} />
      <UgcReel t={t} />
      <UgcServices t={t} />
      <UgcPacks t={t} />
      <BrandsMarquee label={t.home.brandsLabel} />
      <UgcProcess t={t} />
      <UgcFaq t={t} />
      <Testimonials t={t} />
      <Contact t={t} />
      <Footer t={t} />
    </>
  );
}

window.UgcPage = UgcPage;
