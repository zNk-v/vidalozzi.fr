// Composants partagés VIDALOZZI
const { useState, useEffect, useRef } = React;

// ── Reveal on scroll ────────────────────────────────────────────────
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {if (e.isIntersecting) e.target.classList.add("in");});
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

// ── Nav ─────────────────────────────────────────────────────────────
function Nav({ active, lang, setLang, t, current }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    document.body.classList.toggle("nav-open", open);
    return () => document.body.classList.remove("nav-open");
  }, [open]);
  const closeMenu = () => setOpen(false);
  return (
    <nav className={"nav " + (scrolled ? "nav-scrolled" : "")}>
      <a href="index.html" className="logo">
        <span className="logo-mark">V/</span>
        <span>VIDALOZZI</span>
      </a>
      <div className="nav-links">
        <a href="index.html" className={current === "home" ? "active" : ""} onClick={closeMenu}>{t.nav.home}</a>
        <a href="ugc.html" className={current === "ugc" ? "active" : ""} onClick={closeMenu}>{t.nav.ugc}</a>
        <a href="talent.html" className={current === "talent" ? "active" : ""} onClick={closeMenu}>{t.nav.talent}</a>
        <span style={{ opacity: 0.3 }}>·</span>
        <span className="lang-switch">
          <button className={lang === "fr" ? "active" : ""} onClick={() => setLang("fr")}>FR</button>
          <span>/</span>
          <button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>EN</button>
        </span>
      </div>
      <a href="#contact" className="nav-cta">
        <span className="nav-cta-dot" />
        {t.book}
      </a>
      <button
        className="nav-burger"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}>
        <span></span>
        <span></span>
      </button>
    </nav>);

}

// ── Marquee bandeau marques ────────────────────────────────────────
function BrandLogo({ brand }) {
  const [src, setSrc] = useState(brand.src);
  const [hover, setHover] = useState(false);
  const inputRef = React.useRef(null);

  useEffect(() => {
    let url = null;
    (async () => {
      try {
        const db = await new Promise((res, rej) => {
          const r = indexedDB.open("brand-logos", 1);
          r.onupgradeneeded = () => r.result.createObjectStore("logos");
          r.onsuccess = () => res(r.result);
          r.onerror = () => rej(r.error);
        });
        const blob = await new Promise((res, rej) => {
          const tx = db.transaction("logos", "readonly");
          const q = tx.objectStore("logos").get(brand.id);
          q.onsuccess = () => res(q.result || null);
          q.onerror = () => rej(q.error);
        });
        if (blob) { url = URL.createObjectURL(blob); setSrc(url); }
      } catch {}
    })();
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [brand.id, brand.src]);

  const onFile = async (file) => {
    if (!file) return;
    try {
      const db = await new Promise((res, rej) => {
        const r = indexedDB.open("brand-logos", 1);
        r.onupgradeneeded = () => r.result.createObjectStore("logos");
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      });
      await new Promise((res, rej) => {
        const tx = db.transaction("logos", "readwrite");
        tx.objectStore("logos").put(file, brand.id);
        tx.oncomplete = () => res();
        tx.onerror = () => rej(tx.error);
      });
      setSrc(URL.createObjectURL(file));
    } catch (e) { console.warn(e); }
  };

  const onReset = async (e) => {
    e.stopPropagation();
    try {
      const db = await new Promise((res, rej) => {
        const r = indexedDB.open("brand-logos", 1);
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      });
      await new Promise((res) => {
        const tx = db.transaction("logos", "readwrite");
        tx.objectStore("logos").delete(brand.id);
        tx.oncomplete = () => res();
      });
      setSrc(brand.src);
    } catch {}
  };

  const editable = document.documentElement.dataset.editmode === "1";
  return (
    <span
      style={{ display: "inline-flex", alignItems: "center", gap: 56, position: "relative" }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onDragOver={(e) => { if (editable) e.preventDefault(); }}
      onDrop={(e) => {
        if (!editable) return;
        e.preventDefault();
        const f = e.dataTransfer?.files?.[0];
        if (f && f.type.startsWith("image/")) onFile(f);
      }}>
      <span style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
        <img src={src} alt={brand.name} className="brand-logo" />
        <span className="brand-edit-controls" style={{
          position: "absolute", inset: "-8px -10px", display: (editable && hover) ? "flex" : "none",
          alignItems: "center", justifyContent: "center", gap: 6,
          background: "rgba(14,11,8,0.75)", backdropFilter: "blur(6px)",
          border: "0.5px solid var(--line-strong)", borderRadius: 4,
          opacity: hover ? 1 : 0, transition: "opacity 0.2s",
        }}>
          <button
            onClick={() => inputRef.current?.click()}
            style={{
              appearance: "none", background: "var(--accent)", color: "var(--bg-deep)",
              border: 0, borderRadius: 999, padding: "4px 10px",
              fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase",
              fontFamily: "JetBrains Mono, monospace", cursor: "pointer", fontWeight: 600,
            }}>Upload</button>
          <button
            onClick={onReset}
            style={{
              appearance: "none", background: "transparent", color: "var(--ink-mute)",
              border: "0.5px solid var(--line-strong)", borderRadius: 999, padding: "4px 10px",
              fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase",
              fontFamily: "JetBrains Mono, monospace", cursor: "pointer",
            }}>Reset</button>
        </span>
      </span>
      <span style={{ color: "var(--accent)", fontSize: 10, opacity: 0.5 }}>✦</span>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        style={{ display: "none" }}
        onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
    </span>);

}

function BrandsMarquee({ label }) {
  const items = window.BRANDS;
  const Track = () =>
  <div className="marquee-track">
      {items.concat(items).map((b, i) =>
    <BrandLogo key={b.id + "-" + i} brand={b} />
    )}
    </div>;

  return (
    <section style={{ padding: "72px 0", borderTop: "0.5px solid var(--line)", borderBottom: "0.5px solid var(--line)", background: "var(--bg-deep)" }}>
      <div className="wrap" style={{ marginBottom: 36 }}>
        <span className="eyebrow">— {label}</span>
      </div>
      <div className="marquee">
        <Track />
      </div>
    </section>);

}

// ── Témoignages ─────────────────────────────────────────────────────
function Testimonials({ t }) {
  const [idx, setIdx] = useState(0);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(max-width: 860px)").matches);
  const trackRef = useRef(null);
  const items = t.testimonials;

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 860px)");
    const onChange = () => setIsMobile(mq.matches);
    mq.addEventListener ? mq.addEventListener("change", onChange) : mq.addListener(onChange);
    return () => {
      mq.removeEventListener ? mq.removeEventListener("change", onChange) : mq.removeListener(onChange);
    };
  }, []);

  // Sync idx when user manually swipes/scrolls (mobile)
  useEffect(() => {
    const track = trackRef.current;
    if (!track || !isMobile) return;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const center = track.scrollLeft + track.clientWidth / 2;
        let best = 0, bestDist = Infinity;
        Array.from(track.children).forEach((c, i) => {
          const cardCenter = c.offsetLeft + c.clientWidth / 2;
          const d = Math.abs(cardCenter - center);
          if (d < bestDist) { bestDist = d; best = i; }
        });
        setIdx(best);
      });
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, [isMobile]);

  const goTo = (newIdx) => {
    const n = (newIdx + items.length) % items.length;
    setIdx(n);
    const track = trackRef.current;
    if (track && isMobile && track.children[n]) {
      const card = track.children[n];
      track.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior: "smooth" });
    }
  };

  return (
    <section>
      <div className="wrap">
        <div className="section-head">
          <div>
            <div className="eyebrow" style={{ marginBottom: 16 }}>— {t.testimonialsLabel}</div>
            <h2 className="display">{t.testimonialsHead}</h2>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span className="mono testimonials-counter" style={{ fontSize: 11, color: "var(--ink-faint)", marginRight: 6, fontVariantNumeric: "tabular-nums" }}>
              {String(idx + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
            </span>
            <button className="nav-cta" onClick={() => goTo(idx - 1)} aria-label="Previous">←</button>
            <button className="nav-cta" onClick={() => goTo(idx + 1)} aria-label="Next">→</button>
          </div>
        </div>
        <div ref={trackRef} className="testimonials-grid">
          {items.map((it, i) =>
          <div key={i} className={"lift testimonial-card" + (i === idx ? " is-active" : "")} style={{
            padding: 40,
            border: "0.5px solid var(--line-strong)",
            borderRadius: 4,
            background: i === idx ? "var(--bg-elev)" : "transparent",
            opacity: i === idx ? 1 : 0.5,
            transition: "all 0.3s"
          }}>
              <div style={{ fontFamily: "Bodoni Moda, serif", fontSize: 48, lineHeight: 0.5, color: "var(--accent)", marginBottom: 16 }}>"</div>
              <p style={{ fontSize: 19, lineHeight: 1.5, color: "var(--ink)", marginBottom: 28, fontFamily: "Instrument Serif, serif", fontStyle: "italic", letterSpacing: "0.005em" }}>
                {it.q}
              </p>
              <div style={{ borderTop: "0.5px solid var(--line)", paddingTop: 16, display: "flex", alignItems: "center", gap: 16 }}>
                <div className="ph ph-portrait" style={{ width: 44, height: 44, borderRadius: "50%" }}>
                  <span className="ph-coords" style={{ display: "none" }}></span>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{it.a}</div>
                  <div style={{ fontSize: 11, color: "var(--ink-faint)", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 2 }}>{it.r}</div>
                </div>
              </div>
            </div>
          )}
        </div>
        {isMobile && (
          <div className="testimonials-dots" aria-hidden="true">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={"testimonials-dot" + (i === idx ? " is-active" : "")}
                aria-label={`Go to testimonial ${i + 1}`} />
            ))}
          </div>
        )}
      </div>
    </section>);

}

// ── Contact ─────────────────────────────────────────────────────────
function Contact({ t }) {
  return (
    <section id="contact" style={{ background: "var(--bg-deep)", borderTop: "0.5px solid var(--line)" }}>
      <div className="wrap">
        <div className="eyebrow" style={{ marginBottom: 32 }}>— {t.contact.label}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 80, alignItems: "flex-start" }}>
          <div>
            <h2 className="display" style={{ fontSize: "clamp(64px, 9vw, 140px)", lineHeight: 0.9 }}>
              <span>{t.contact.head.l1}</span><br />
              <span className="script" style={{ color: "var(--accent)", fontSize: "1.1em", lineHeight: 0.8, display: "inline-block", transform: "translateY(0.04em) rotate(-2deg)" }}>{t.contact.head.l2}</span><br />
              <span>{t.contact.head.l3}</span>
            </h2>
          </div>
          <div style={{ paddingTop: 24 }}>
            <p style={{ color: "var(--ink-mute)", fontSize: 16, lineHeight: 1.6, marginBottom: 40, maxWidth: 420 }}>{t.contact.sub}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 48 }}>
              <a className="btn-primary" href="https://calendly.com/vidalozzi" target="_blank" rel="noreferrer">
                <span className="nav-cta-dot" style={{ background: "var(--bg-deep)" }} />
                {t.contact.ctaCalendly}
                <span style={{ marginLeft: "auto" }}>→</span>
              </a>
              <a className="btn-ghost" href="#" download>
                {t.contact.ctaPressKit}
                <span style={{ marginLeft: "auto" }}>↓</span>
              </a>
            </div>
            <div style={{ borderTop: "0.5px solid var(--line)", paddingTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <div className="label-xs" style={{ marginBottom: 4 }}>{t.contact.emailLabel}</div>
                <a href={`mailto:${t.contact.email}`} className="display" style={{ fontSize: 22 }}>{t.contact.email}</a>
              </div>
              <div>
                <div className="label-xs" style={{ marginBottom: 4 }}>{t.contact.instaLabel}</div>
                <a href="https://instagram.com/vidalozzi" target="_blank" rel="noreferrer" className="display" style={{ fontSize: 22 }}>{t.contact.insta}</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>);

}

// ── Footer ──────────────────────────────────────────────────────────
function Footer({ t }) {
  return (
    <footer className="footer">
      <div className="wrap">
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40, marginBottom: 80 }}>
          <div>
            <div className="logo" style={{ marginBottom: 16 }}>
              <span className="logo-mark">V/</span>
              <span>VIDALOZZI</span>
            </div>
            <p style={{ color: "var(--ink-mute)", fontSize: 14, maxWidth: 340 }}>{t.footer.tagline}</p>
          </div>
          <div>
            <div className="label-xs" style={{ marginBottom: 16 }}>{t.footer.cols.navigate}</div>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10, fontSize: 14 }}>
              <li><a href="index.html">{t.nav.home}</a></li>
              <li><a href="ugc.html">{t.nav.ugc}</a></li>
              <li><a href="talent.html">{t.nav.talent}</a></li>
            </ul>
          </div>
          <div>
            <div className="label-xs" style={{ marginBottom: 16 }}>{t.footer.cols.services}</div>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10, fontSize: 14, color: "var(--ink-mute)" }}>
              <li>UGC</li>
              <li>Modeling</li>
              <li>Acting</li>
              <li>Voice-over</li>
            </ul>
          </div>
          <div>
            <div className="label-xs" style={{ marginBottom: 16 }}>{t.footer.cols.contact}</div>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10, fontSize: 14 }}>
              <li><a href={`mailto:${t.contact.email}`}>{t.contact.email}</a></li>
              <li><a href="https://instagram.com/vidalozzi">{t.contact.insta}</a></li>
              <li><a href="https://calendly.com/vidalozzi">Calendly →</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-display display" style={{ overflow: "hidden", whiteSpace: "nowrap" }}>VIDALOZZI<span style={{ color: "var(--accent)" }}>®</span></div>
        <div className="footer-bottom">
          <span>{t.footer.copyright}</span>
          <span className="links">
            <a href="#">Mentions légales</a>
            <a href="#">Privacy</a>
          </span>
        </div>
      </div>
    </footer>);

}

// ── Accordion FAQ ───────────────────────────────────────────────────
function Accordion({ items }) {
  const [open, setOpen] = useState(0);
  return (
    <div>
      {items.map((it, i) =>
      <div key={i} className={"accordion-item" + (open === i ? " open" : "")}>
          <button className="accordion-q" onClick={() => setOpen(open === i ? -1 : i)}>
            <span style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <span className="mono" style={{ fontSize: 11, color: "var(--accent)" }}>0{i + 1}</span>
              {it.q}
            </span>
            <span className="plus">＋</span>
          </button>
          <div className="accordion-a">
            <div>
              <div className="accordion-a-inner">{it.a}</div>
            </div>
          </div>
        </div>
      )}
    </div>);

}

// ── Mode switch UGC/Talent (sticky) ─────────────────────────────────
function ModeSwitch({ mode, setMode, current, t }) {
  // Si "current" est home, ne pas afficher; sinon montrer un toggle pour aller à l'autre
  if (current === "home") return null;
  return (
    <div style={{
      position: "fixed", left: "50%", transform: "translateX(-50%)",
      bottom: 24, zIndex: 90,
      display: "flex", alignItems: "center", gap: 4,
      padding: 4,
      background: "rgba(14, 11, 8, 0.78)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      border: "0.5px solid var(--line-strong)", borderRadius: 999,
      fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase"
    }}>
      <a href="ugc.html" style={{
        padding: "10px 20px", borderRadius: 999,
        background: current === "ugc" ? "var(--accent)" : "transparent",
        color: current === "ugc" ? "var(--bg-deep)" : "var(--ink)",
        fontWeight: 500
      }}>UGC · Brands</a>
      <a href="talent.html" style={{
        padding: "10px 20px", borderRadius: 999,
        background: current === "talent" ? "var(--accent)" : "transparent",
        color: current === "talent" ? "var(--bg-deep)" : "var(--ink)",
        fontWeight: 500
      }}>Talent · Casting</a>
    </div>);

}

Object.assign(window, { useReveal, Nav, BrandsMarquee, Testimonials, Contact, Footer, Accordion, ModeSwitch });