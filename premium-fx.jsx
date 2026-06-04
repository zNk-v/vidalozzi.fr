// VIDALOZZI — Premium FX
// Trois effets premium qui élèvent le ressenti du site :
//
//   1) useLenis()         — smooth scroll inertiel global (desktop uniquement,
//                           mobile garde l'inertia native iOS qui est meilleure).
//   2) <SplitText>        — composant qui découpe son enfant texte en mots, et
//                           anime chaque mot en cascade quand il entre dans le
//                           viewport (effet "reveal éditorial").
//   3) useMagneticButtons — donne aux .btn-primary / .nav-cta un effet d'aimant
//                           qui suit le curseur. Désactivé sur tactile.
//
// Aucune dépendance npm. Lenis est chargé via CDN dans les pages HTML.

// ── 1) Lenis smooth scroll ───────────────────────────────────────────
function useLenis() {
  useEffect(() => {
    // Garde la robustesse: si Lenis n'a pas chargé, on sort silencieusement.
    if (typeof window.Lenis !== "function") return;
    // Mobile: l'inertia native d'iOS est supérieure à ce que Lenis peut faire,
    // et certains scrolls horizontaux (carousels) deviennent moins fluides
    // si on superpose Lenis. On reste sur le natif.
    if (window.matchMedia("(max-width: 860px)").matches) return;
    // Respect des préférences utilisateur (reduce motion).
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new window.Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo out
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    let raf;
    const loop = (time) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // Ré-émet un event 'scroll' classique pour le code existant (Nav scrolled,
    // HomeHero parallax). Lenis le fait déjà via son rAF interne, donc rien
    // à patcher côté écouteurs.

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);
}

// ── 2) Composant <SplitText> ─────────────────────────────────────────
// Découpe le texte en mots (pas en lettres, plus lisible) et anime chacun
// avec un délai croissant quand l'élément entre dans le viewport.
//
// Usage:
//   <h1 className="display">
//     <SplitText>{t.home.heroLine1}</SplitText>
//   </h1>
//
// Props:
//   children   : string (le texte à animer)
//   className  : forwarded sur le <span> racine
//   stagger    : délai entre chaque mot, défaut 0.06s
//   delay      : décalage de départ global, défaut 0s
function SplitText({ children, className, style, stagger = 0.06, delay = 0, as = "span" }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    // reduce motion: pas d'animation, on affiche direct.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { if (e.isIntersecting) setInView(true); });
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  const text = typeof children === "string" ? children : String(children ?? "");
  // Split en gardant les espaces séparés pour ne pas casser le wrap naturel.
  const parts = text.split(/(\s+)/);
  const Tag = as;
  return (
    <Tag
      ref={ref}
      className={"split-text " + (inView ? "in " : "") + (className || "")}
      style={style}
      aria-label={text}
    >
      {parts.map((p, i) => {
        if (/^\s+$/.test(p)) return p;
        // index "mot uniquement" pour le calcul du delay
        const wordIndex = parts.slice(0, i).filter((q) => !/^\s+$/.test(q)).length;
        return (
          <span
            key={i}
            className="split-word"
            aria-hidden="true"
            style={{ "--split-delay": (delay + wordIndex * stagger) + "s" }}
          >
            {p}
          </span>
        );
      })}
    </Tag>
  );
}

// ── 3) Magnetic buttons ──────────────────────────────────────────────
// Effet d'aimant léger qui suit le curseur. On l'applique seulement aux
// boutons importants pour garder la rareté de l'effet.
function useMagneticButtons(selector, strength) {
  if (!selector) selector = ".btn-primary, .nav-cta";
  if (typeof strength !== "number") strength = 0.25;

  useEffect(() => {
    // Pas d'effet sur les écrans tactiles (pas de curseur).
    if (window.matchMedia("(hover: none)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const cleanups = [];
    const attach = (el) => {
      if (el.dataset.magneticAttached === "1") return;
      el.dataset.magneticAttached = "1";
      el.style.willChange = "transform";
      el.style.transition = "transform 0.25s cubic-bezier(0.2, 0.7, 0.2, 1)";
      const onMove = (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * strength;
        const y = (e.clientY - r.top - r.height / 2) * strength;
        el.style.transform = "translate(" + x + "px, " + y + "px)";
      };
      const onLeave = () => { el.style.transform = ""; };
      el.addEventListener("mousemove", onMove);
      el.addEventListener("mouseleave", onLeave);
      cleanups.push(() => {
        el.removeEventListener("mousemove", onMove);
        el.removeEventListener("mouseleave", onLeave);
        delete el.dataset.magneticAttached;
        el.style.transform = "";
      });
    };

    // Attachement initial + ré-attachement quand le DOM change (React re-renders
    // de cartes, changement de langue, etc).
    const scan = () => document.querySelectorAll(selector).forEach(attach);
    scan();
    const mo = new MutationObserver(() => scan());
    mo.observe(document.body, { childList: true, subtree: true });
    cleanups.push(() => mo.disconnect());

    return () => cleanups.forEach((fn) => fn());
  }, [selector, strength]);
}

// Expose au scope global pour que les autres .jsx puissent les utiliser via
// JSX (<SplitText>) ou via les hooks (useLenis, useMagneticButtons).
Object.assign(window, { useLenis, SplitText, useMagneticButtons });
