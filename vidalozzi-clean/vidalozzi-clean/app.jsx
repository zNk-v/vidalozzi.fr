// VIDALOZZI — App shell
const { useState, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#C9A87C",
  "fontDisplay": "DM Serif Display",
  "fontBody": "Montserrat",
  "density": "regular",
  "dark": true,
  "imgMode": "color"
}/*EDITMODE-END*/;

const FONT_OPTIONS_DISPLAY = [
  { value: "DM Serif Display", label: "DM Serif" },
  { value: "Bodoni Moda", label: "Bodoni" },
  { value: "Playfair Display", label: "Playfair" },
  { value: "Cormorant Garamond", label: "Cormorant" },
];
const FONT_OPTIONS_BODY = [
  { value: "Montserrat", label: "Montserrat" },
  { value: "Inter", label: "Inter" },
  { value: "Manrope", label: "Manrope" },
  { value: "DM Sans", label: "DM Sans" },
];

function App({ page }) {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [lang, setLang] = useState(localStorage.getItem("vz_lang") || "fr");
  const isDesktop = () => window.matchMedia("(min-width: 861px)").matches;
  const [isDesktopState, setIsDesktopState] = useState(() => isDesktop());
  const [editMode, setEditMode] = useState(() => isDesktop() && localStorage.getItem("vz_edit") === "1");
  useEffect(() => { localStorage.setItem("vz_lang", lang); }, [lang]);

  // Force off when shrinking past the desktop breakpoint
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 861px)");
    const onChange = () => {
      setIsDesktopState(mq.matches);
      if (!mq.matches) {
        setEditMode(false);
        // Hard sweep: someone with localStorage flag from another device shouldn't get edit on mobile
        localStorage.removeItem("vz_edit");
      }
    };
    mq.addEventListener ? mq.addEventListener("change", onChange) : mq.addListener(onChange);
    return () => { mq.removeEventListener ? mq.removeEventListener("change", onChange) : mq.removeListener(onChange); };
  }, []);

  // Toggle edit mode via URL hash (#edit) or keyboard shortcut (Cmd/Ctrl + Shift + E)
  // Desktop-only: visitors on phones/tablets can't enter edit mode.
  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash === "#edit") {
        history.replaceState(null, "", window.location.pathname);
        if (!isDesktop()) return;
        localStorage.setItem("vz_edit", "1");
        setEditMode(true);
      } else if (window.location.hash === "#exit") {
        localStorage.removeItem("vz_edit");
        setEditMode(false);
        history.replaceState(null, "", window.location.pathname);
      }
    };
    checkHash();
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "e") {
        e.preventDefault();
        if (!isDesktop()) return;
        setEditMode((v) => {
          const next = !v;
          if (next) localStorage.setItem("vz_edit", "1");
          else localStorage.removeItem("vz_edit");
          return next;
        });
      }
    };
    window.addEventListener("hashchange", checkHash);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("hashchange", checkHash);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  // Apply tweaks to document
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = tweaks.dark ? "dark" : "light";
    root.dataset.density = tweaks.density;
    root.dataset.imgmode = tweaks.imgMode;
    root.dataset.editmode = editMode ? "1" : "0";
    root.style.setProperty("--accent", tweaks.accent);
    root.style.setProperty("--font-display", `"${tweaks.fontDisplay}"`);
    root.style.setProperty("--font-body", `"${tweaks.fontBody}"`);
    document.body.style.fontFamily = `"${tweaks.fontBody}", -apple-system, system-ui, sans-serif`;
  }, [tweaks, editMode]);

  const t = window.COPY[lang];
  const PageComp = page === "home" ? HomePage : page === "ugc" ? UgcPage : TalentPage;

  return (
    <div className="grain">
      <Nav lang={lang} setLang={setLang} t={t} current={page} />
      <PageComp t={t} />
      <ModeSwitch current={page} t={t} />
      {editMode && (
        <div style={{
          position: "fixed", top: 84, left: "50%", transform: "translateX(-50%)",
          zIndex: 1000, display: "flex", alignItems: "center", gap: 10,
          padding: "8px 14px",
          background: "var(--accent)", color: "var(--bg-deep)",
          borderRadius: 999,
          fontFamily: "JetBrains Mono, monospace", fontSize: 10,
          letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 600,
          boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--bg-deep)" }} />
          Edit mode
          <button onClick={() => { localStorage.removeItem("vz_edit"); setEditMode(false); }}
            style={{ marginLeft: 6, background: "rgba(14,11,8,0.15)", color: "var(--bg-deep)", border: 0, borderRadius: 999, padding: "3px 8px", fontFamily: "inherit", fontSize: 9, letterSpacing: "0.12em", cursor: "pointer" }}>
            Exit
          </button>
        </div>
      )}
      <TweaksPanel title="Tweaks">
        <TweakSection label="Couleur d'accent" />
        <TweakColor label="Accent" value={tweaks.accent} onChange={(v) => setTweak("accent", v)} />
        <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
          {["#C9A87C", "#B5895A", "#A86D3D", "#D4AF37", "#7A5C3E", "#E6C99B"].map((c) => (
            <button key={c} onClick={() => setTweak("accent", c)} style={{ width: 22, height: 22, borderRadius: 4, background: c, border: "0.5px solid rgba(0,0,0,0.15)" }} />
          ))}
        </div>
        <TweakSection label="Typographie" />
        <TweakSelect label="Display" value={tweaks.fontDisplay} options={FONT_OPTIONS_DISPLAY} onChange={(v) => setTweak("fontDisplay", v)} />
        <TweakSelect label="Body" value={tweaks.fontBody} options={FONT_OPTIONS_BODY} onChange={(v) => setTweak("fontBody", v)} />
        <TweakSection label="Apparence" />
        <TweakToggle label="Dark mode" value={tweaks.dark} onChange={(v) => setTweak("dark", v)} />
        <TweakRadio label="Densité" value={tweaks.density} options={["compact", "regular", "comfy"]} onChange={(v) => setTweak("density", v)} />
        <TweakRadio label="Images" value={tweaks.imgMode} options={[{ value: "color", label: "Couleur" }, { value: "bw", label: "B&W" }]} onChange={(v) => setTweak("imgMode", v)} />
        {isDesktopState && (
          <>
            <TweakSection label="Édition (privé)" />
            <TweakToggle label="Edit mode" value={editMode} onChange={(v) => { if (v && !isDesktop()) return; if (v) localStorage.setItem("vz_edit", "1"); else localStorage.removeItem("vz_edit"); setEditMode(v); }} />
            <TweakButton label="Réinitialiser tous les textes" onClick={() => { if (confirm("Réinitialiser tous les textes modifiés ?")) window.VZ_TEXT && window.VZ_TEXT.reset(); }} />
          </>
        )}
        <TweakSection label="Mode" />
        <TweakRadio label="Section" value={page} options={[{ value: "home", label: "Home" }, { value: "ugc", label: "UGC" }, { value: "talent", label: "Talent" }]} onChange={(v) => { window.location.href = v === "home" ? "index.html" : v + ".html"; }} />
      </TweaksPanel>
    </div>
  );
}

window.VIDALOZZI_App = App;
