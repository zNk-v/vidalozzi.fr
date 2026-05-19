// VIDALOZZI — Homepage
const { useState, useEffect } = React;

function HomeHero({ t }) {
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  // Parallax: image moves slower than scroll, content fades up
  const imgTranslate = Math.min(scrollY * 0.4, 240);
  const imgScale = 1 + Math.min(scrollY / 3000, 0.08);
  const overlayOpacity = Math.min(0.55 + scrollY / 1200, 0.92);
  const contentOpacity = Math.max(1 - scrollY / 600, 0);
  const contentTranslate = -scrollY * 0.25;

  return (
    <>
      <section style={{ position: "relative", height: "100vh", minHeight: 680, marginTop: 0, overflow: "hidden" }}>
        <div style={{
          position: "absolute", inset: 0,
          transform: `translate3d(0, ${imgTranslate}px, 0) scale(${imgScale})`,
          willChange: "transform",
          transition: "transform 0.05s linear"
        }}>
          <image-slot id="home-hero" src="assets/teddy-vidal-ugc-mannequin-comedien-paris.jpg" shape="rect" fit="cover" placeholder="Drop hero image" style={{ display: "block", width: "100%", height: "110%" }}></image-slot>
        </div>
        {/* Vignette + bottom fade so text sits well */}
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, rgba(30,29,29,0.35) 0%, rgba(30,29,29,0) 25%, rgba(30,29,29,0) 55%, rgba(30,29,29,${overlayOpacity}) 100%)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 70%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.25) 100%)", pointerEvents: "none" }} />

        {/* Floating tags */}
        <span className="tag" style={{ position: "absolute", top: 96, left: 48, background: "rgba(30,29,29,0.45)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", color: "rgba(244,239,230,0.95)", borderColor: "rgba(244,239,230,0.18)" }}>
          <span className="tag-dot" />Available
        </span>
        <span className="ph-coords" style={{ position: "absolute", top: "auto", left: "auto", bottom: 24, right: 48, color: "rgba(244,239,230,0.7)", fontSize: 10 }}>© LOUISS_PHOTOGRAPHY · 2025

        </span>
        <span className="ph-label" style={{ position: "absolute", top: "auto", bottom: 24, left: 48, color: "rgba(244,239,230,0.7)" }}>
          SHOT 01 / EDITORIAL
        </span>

        {/* Centered hero text */}
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          textAlign: "center",
          opacity: contentOpacity,
          transform: `translate3d(0, ${contentTranslate}px, 0)`,
          willChange: "transform, opacity"
        }}>
          <span className="eyebrow" style={{ marginBottom: 32, color: "rgba(244,239,230,0.85)" }}>— {t.home.eyebrow}</span>
          <h1 className="display" style={{ fontSize: "clamp(80px, 13vw, 220px)", color: "var(--ink)", textShadow: "0 4px 40px rgba(0,0,0,0.45)", lineHeight: 0.88 }}>
            <span>{t.home.heroLine1}</span>{" "}
            <span className="script" style={{ color: "var(--accent-glow)", fontSize: "1.15em", lineHeight: 0.7, display: "inline-block", transform: "translateY(0.06em) rotate(-2deg)" }}>{t.home.heroLine2}</span>
          </h1>
        </div>

        {/* Scroll cue */}
        <div style={{
          position: "absolute", left: "50%", bottom: 32, transform: "translateX(-50%)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
          color: "rgba(244,239,230,0.7)",
          fontFamily: "JetBrains Mono, monospace", fontSize: 9.5, letterSpacing: "0.2em",
          opacity: contentOpacity
        }}>
          <span>SCROLL</span>
          <span style={{ width: 1, height: 28, background: "linear-gradient(to bottom, rgba(244,239,230,0.7), transparent)" }} />
        </div>
      </section>

      <section style={{ paddingTop: 100, paddingBottom: 60 }}>
        <div className="wrap">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 64, alignItems: "flex-start" }}>
            <div className="eyebrow">— Introduction</div>
            <p style={{ fontSize: 22, lineHeight: 1.5, color: "var(--ink)", maxWidth: 640, letterSpacing: "0.005em", fontFamily: "Times" }}>
              {t.home.heroSub}
            </p>
          </div>
        </div>
      </section>
    </>);

}

function HomeSplit({ t }) {
  return (
    <section style={{ padding: "60px 0 120px" }}>
      <div className="wrap">
        <div className="eyebrow" style={{ textAlign: "center", marginBottom: 40 }}>↓ {t.home.pickPath}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {[
          { card: t.home.ugcCard, href: "ugc.html", label: "UGC" },
          { card: t.home.talentCard, href: "talent.html", label: "TALENT" }].
          map((c, i) =>
          <a key={i} href={c.href} className="lift" style={{
            position: "relative",
            display: "block",
            padding: 40,
            minHeight: 560,
            border: "0.5px solid var(--line-strong)",
            borderRadius: 4,
            background: "var(--bg-elev)",
            overflow: "hidden",
            textDecoration: "none"
          }}>
              <div style={{ position: "absolute", inset: 0, opacity: 0.7 }}>
                <image-slot id={`home-split-${c.label.toLowerCase()}`} shape="rect" fit="cover" placeholder={`Drop ${c.label} cover`} style={{ display: "block", width: "100%", height: "100%" }}></image-slot>
                <span className="ph-label" style={{ position: "absolute", top: 14, left: 14, pointerEvents: "none", zIndex: 4 }}>{c.label} · 01</span>
                <span className="ph-coords" style={{ position: "absolute", bottom: 14, right: 14, pointerEvents: "none", zIndex: 4 }}>SHOT_{String(i + 1).padStart(3, "0")} / FILM_35MM</span>
              </div>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(14,11,8,0.4) 0%, rgba(14,11,8,0.92) 70%)" }} />
              <div style={{ position: "relative", zIndex: 2, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 480 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span className="eyebrow">— {c.card.eyebrow}</span>
                  <span className="mono" style={{ fontSize: 10, color: "var(--accent)" }}>0{i + 1} / 02</span>
                </div>
                <div>
                  <h2 className="display" style={{ fontSize: "clamp(72px, 10vw, 160px)", marginBottom: 24 }}>
                    {c.card.title}<span style={{ color: "var(--accent)" }}>.</span>
                  </h2>
                  <p style={{ color: "var(--ink-mute)", fontSize: 16, maxWidth: 380, marginBottom: 32, lineHeight: 1.5 }}>{c.card.sub}</p>
                  <div className="btn-ghost" style={{ display: "inline-flex" }}>
                    {c.card.cta}<span style={{ marginLeft: 4 }}>→</span>
                  </div>
                </div>
              </div>
            </a>
          )}
        </div>
      </div>
    </section>);

}

function HomeAbout({ t }) {
  const stats = [t.home.stat1, t.home.stat2, t.home.stat3, t.home.stat4];
  return (
    <section style={{ borderTop: "0.5px solid var(--line)" }}>
      <div className="wrap">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 80, alignItems: "flex-start", marginBottom: 80 }}>
          <div style={{ aspectRatio: "3/4", position: "sticky", top: 100, borderRadius: 4 }}>
            <image-slot id="home-portrait" src="assets/teddy-vidal-ugc-mannequin-comedien-paris.jpg" shape="rect" fit="contain" placeholder="Drop portrait" style={{ display: "block", width: "100%", height: "100%" }}></image-slot>
            <span className="ph-label" style={{ position: "absolute", top: 14, left: 14, color: "rgba(244,239,230,0.92)", pointerEvents: "none", zIndex: 3 }}>PORTRAIT · 02</span>
            <span className="ph-coords" style={{ position: "absolute", bottom: 14, right: 14, color: "rgba(244,239,230,0.7)", pointerEvents: "none", zIndex: 3 }}>TEDDY_VIDAL_01.RAW</span>
          </div>
          <div>
            <div className="eyebrow" style={{ marginBottom: 24 }}>— {t.home.aboutLabel}</div>
            <h2 className="display" style={{ fontSize: "clamp(48px, 5.5vw, 84px)", marginBottom: 40 }}>{t.home.aboutHead}</h2>
            <p style={{ fontSize: 18, lineHeight: 1.6, color: "var(--ink-mute)", maxWidth: 560, marginBottom: 64 }}>{t.home.aboutBody}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 32, paddingTop: 40, borderTop: "0.5px solid var(--line)" }}>
              {stats.map((s, i) =>
              <div key={i}>
                  <div className="display" style={{ fontSize: 56, color: "var(--accent)" }}>{s.v}</div>
                  <div className="label-xs" style={{ marginTop: 8 }}>{s.l}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>);

}

function HomeShowreel({ t }) {
  return (
    <section style={{ padding: "0 0 120px" }}>
      <div className="wrap">
        <video-slot
          id="home-showreel"
          src="assets/teddy-vidal-showreel-ugc-paris-2026.mp4"
          label="Showreel · 2026"
          placeholder="Drop your reel — MP4"
          autoplay="autoplay"
          loop="loop"
          style={{ aspectRatio: "16/9", borderRadius: 4, overflow: "hidden", display: "block" }}>
        </video-slot>
      </div>
    </section>);

}

function HomePage({ t }) {
  useReveal();
  return (
    <>
      <HomeHero t={t} />
      <HomeSplit t={t} />
      <BrandsMarquee label={t.home.brandsLabel} />
      <HomeShowreel t={t} />
      <HomeAbout t={t} />
      <Testimonials t={t} />
      <Contact t={t} />
      <Footer t={t} />
    </>);

}

window.HomePage = HomePage;