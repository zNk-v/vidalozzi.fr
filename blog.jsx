// VIDALOZZI — Blog (liste + lecteur d'article)
const { useState, useEffect, useMemo } = React;

const BLOG_UI = {
  fr: {
    eyebrow: "Journal",
    headLine1: "Le",
    headScript: "journal",
    headDot: ".",
    sub: "Notes sur l'UGC, la performance et le métier de créateur. Stratégie, tarifs, méthode — ce que j'aurais aimé lire avant de me lancer.",
    all: "Tout",
    featured: "À la une",
    more: "Articles",
    read: "Lire l'article",
    minRead: "min de lecture",
    back: "← Le journal",
    related: "À lire ensuite",
    ctaHead: "Un projet UGC en tête ?",
    ctaSub: "Parlons-en. Un appel de quinze minutes suffit pour cadrer deux ou trois angles à tester.",
    ctaBtn: "Réserver un appel",
    by: "Par Teddy Vidal",
    notFound: "Article introuvable.",
    notFoundLink: "Retour au journal",
  },
  en: {
    eyebrow: "Journal",
    headLine1: "The",
    headScript: "journal",
    headDot: ".",
    sub: "Notes on UGC, performance and the creator craft. Strategy, pricing, method — what I wish I'd read before starting.",
    all: "All",
    featured: "Featured",
    more: "Articles",
    read: "Read article",
    minRead: "min read",
    back: "← The journal",
    related: "Read next",
    ctaHead: "Got a UGC project in mind?",
    ctaSub: "Let's talk. A fifteen-minute call is enough to frame two or three angles to test.",
    ctaBtn: "Book a call",
    by: "By Teddy Vidal",
    notFound: "Article not found.",
    notFoundLink: "Back to the journal",
  },
};

function getPosts() { return window.BLOG_POSTS || []; }
function getPost(slug) { return getPosts().find((p) => p.slug === slug); }

// ── Publication par date ────────────────────────────────────────────
// Un article devient visible le jour de sa dateISO. Avant, il est masqué
// de la liste, des "articles liés" et passe en noindex. Aucune action requise.
function todayMidnight() { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
function isPublished(p) { return new Date(p.dateISO + "T00:00:00") <= todayMidnight(); }
function publishedPosts() {
  return getPosts().filter(isPublished).sort((a, b) => b.dateISO.localeCompare(a.dateISO));
}
function fmtDate(iso, lang) {
  const d = new Date(iso + "T00:00:00");
  const s = new Intl.DateTimeFormat(lang === "en" ? "en-US" : "fr-FR", { month: "long", year: "numeric" }).format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function setRobots(index) {
  let m = document.querySelector('meta[name="robots"]');
  if (!m) { m = document.createElement("meta"); m.setAttribute("name", "robots"); document.head.appendChild(m); }
  m.setAttribute("content", index ? "index, follow, max-image-preview:large, max-snippet:-1" : "noindex, nofollow");
}

// ── Carte article ───────────────────────────────────────────────────
function PostCard({ post, lang, ui, large }) {
  const c = post[lang];
  const cat = post.category[lang];
  return (
    <a href={post.slug + ".html"} className="blog-card lift" data-large={large ? "1" : undefined}>
      <div className={"ph blog-thumb" + (large ? " blog-thumb-lg" : "")}>
        <img className="blog-cover-img" src={"assets/blog/" + post.slug + ".jpg"} alt="" loading="lazy" />
        <span className="ph-label">{post.hero}</span>
        <span className="ph-coords">VIDALOZZI · JOURNAL</span>
      </div>
      <div className="blog-card-body">
        <div className="blog-meta">
          <span className="tag"><span className="tag-dot" />{cat}</span>
          <span className="mono blog-meta-time">{fmtDate(post.dateISO, lang)} · {post.readMin} {ui.minRead}</span>
        </div>
        <h3 className="display blog-card-title">{c.title}</h3>
        <p className="blog-dek">{c.dek}</p>
        <span className="blog-readlink">{ui.read} <span aria-hidden="true">→</span></span>
      </div>
    </a>
  );
}

// ── Page liste ──────────────────────────────────────────────────────
function BlogPage({ t, lang }) {
  useReveal();
  const ui = BLOG_UI[lang] || BLOG_UI.fr;
  const posts = publishedPosts();
  const [filter, setFilter] = useState("__all");

  const categories = useMemo(() => {
    const seen = [];
    posts.forEach((p) => { const c = p.category[lang]; if (!seen.includes(c)) seen.push(c); });
    return seen;
  }, [lang, posts]);

  const featured = posts[0];
  const rest = posts.slice(1);
  const shown = filter === "__all" ? rest : rest.filter((p) => p.category[lang] === filter);
  const showFeatured = filter === "__all" || (featured && featured.category[lang] === filter);

  return (
    <>
      <section className="blog-hero">
        <div className="wrap">
          <div className="eyebrow reveal" style={{ marginBottom: 24 }}>— {ui.eyebrow}</div>
          <h1 className="display reveal blog-hero-title">
            {ui.headLine1}{" "}
            <span className="script" style={{ color: "var(--accent)", fontSize: "1.05em", display: "inline-block", transform: "translateY(0.04em) rotate(-2deg)" }}>{ui.headScript}</span>{ui.headDot}
          </h1>
          <p className="blog-hero-sub reveal">{ui.sub}</p>
          <div className="blog-filters reveal">
            <button className={"blog-filter" + (filter === "__all" ? " is-active" : "")} onClick={() => setFilter("__all")}>{ui.all}</button>
            {categories.map((c) => (
              <button key={c} className={"blog-filter" + (filter === c ? " is-active" : "")} onClick={() => setFilter(c)}>{c}</button>
            ))}
          </div>
        </div>
      </section>

      {showFeatured && featured && (
        <section className="blog-featured-sec">
          <div className="wrap">
            <div className="eyebrow reveal" style={{ marginBottom: 28 }}>— {ui.featured}</div>
            <a href={featured.slug + ".html"} className="blog-featured lift reveal">
              <div className="ph blog-featured-img">
                <img className="blog-cover-img" src={"assets/blog/" + featured.slug + ".jpg"} alt="" loading="lazy" />
                <span className="ph-label">{featured.hero}</span>
                <span className="ph-coords">VIDALOZZI · JOURNAL</span>
              </div>
              <div className="blog-featured-body">
                <div className="blog-meta">
                  <span className="tag"><span className="tag-dot" />{featured.category[lang]}</span>
                  <span className="mono blog-meta-time">{fmtDate(featured.dateISO, lang)} · {featured.readMin} {ui.minRead}</span>
                </div>
                <h2 className="display blog-featured-title">{featured[lang].title}</h2>
                <p className="blog-dek blog-dek-lg">{featured[lang].dek}</p>
                <span className="blog-readlink">{ui.read} <span aria-hidden="true">→</span></span>
              </div>
            </a>
          </div>
        </section>
      )}

      <section className="blog-grid-sec">
        <div className="wrap">
          {filter === "__all" && <div className="eyebrow reveal" style={{ marginBottom: 28 }}>— {ui.more}</div>}
          <div className="blog-grid">
            {shown.map((p) => (
              <div key={p.slug} className="reveal"><PostCard post={p} lang={lang} ui={ui} /></div>
            ))}
          </div>
        </div>
      </section>

      <Contact t={t} />
      <Footer t={t} />
    </>
  );
}

// ── Parseur de liens Markdown inline [texte](url) → JSX ─────────────
// Permet d'écrire des liens dans blog-data.js sans casser la structure JSON.
// Lien interne (relatif ou /chemin) : ouvre dans l'onglet courant.
// Lien externe (http*) : nouvelle fenêtre + rel sécurisé.
function renderInline(text) {
  if (!text || typeof text !== "string") return text;
  const re = /\[([^\]]+)\]\(([^)]+)\)/g;
  const out = [];
  let last = 0;
  let m;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const label = m[1];
    const href = m[2];
    const isExternal = /^https?:\/\//i.test(href);
    out.push(
      isExternal
        ? <a key={key++} href={href} target="_blank" rel="noopener noreferrer">{label}</a>
        : <a key={key++} href={href}>{label}</a>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out.length === 1 && typeof out[0] === "string" ? text : out;
}

// ── Rendu d'un bloc de corps d'article ──────────────────────────────
function ArticleBlock({ block }) {
  if (block.type === "h2") return <h2 className="display article-h2">{block.text}</h2>;
  if (block.type === "quote") return (
    <blockquote className="article-quote">
      <span className="article-quote-mark" aria-hidden="true">"</span>
      <span className="italic-serif">{block.text}</span>
    </blockquote>
  );
  if (block.type === "ul") return (
    <ul className="article-list">{block.items.map((it, i) => <li key={i}>{renderInline(it)}</li>)}</ul>
  );
  if (block.type === "ol") return (
    <ol className="article-list article-list-ol">{block.items.map((it, i) => <li key={i}>{renderInline(it)}</li>)}</ol>
  );
  return <p className="article-p">{renderInline(block.text)}</p>;
}

// ── Lecteur d'article ───────────────────────────────────────────────
function ArticlePage({ t, lang, slug }) {
  useReveal();
  const ui = BLOG_UI[lang] || BLOG_UI.fr;
  const post = getPost(slug);

  useEffect(() => {
    if (post) document.title = post[lang].title + " — VIDALOZZI";
    // Auto-publication : noindex tant que l'article n'est pas à sa date de sortie
    if (post) setRobots(isPublished(post));
    return () => setRobots(true);
  }, [post, lang]);

  if (post && !isPublished(post)) {
    const c0 = post[lang];
    const liveStr = fmtDate(post.dateISO, lang);
    const day = new Date(post.dateISO + "T00:00:00").toLocaleDateString(lang === "en" ? "en-US" : "fr-FR", { day: "numeric", month: "long", year: "numeric" });
    return (
      <>
        <section className="article" style={{ minHeight: "70vh" }}>
          <div className="wrap-tight">
            <div className="article-top reveal"><a href="blog.html" className="article-back">{ui.back}</a></div>
            <header className="article-head reveal">
              <div className="blog-meta" style={{ justifyContent: "center" }}>
                <span className="tag"><span className="tag-dot" />{post.category[lang]}</span>
                <span className="mono blog-meta-time">{lang === "en" ? "Coming soon" : "À paraître"}</span>
              </div>
              <h1 className="display article-title">{c0.title}</h1>
              <p className="article-dek italic-serif">{lang === "en" ? "This article publishes on " + day + "." : "Cet article paraît le " + day + "."}</p>
              <a className="btn-ghost" href="blog.html" style={{ marginTop: 8 }}>{ui.notFoundLink}</a>
            </header>
          </div>
        </section>
        <Footer t={t} />
      </>
    );
  }

  if (!post) {
    return (
      <section style={{ minHeight: "70vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
        <p className="display" style={{ fontSize: 40 }}>{ui.notFound}</p>
        <a className="btn-ghost" href="blog.html">{ui.notFoundLink}</a>
      </section>
    );
  }

  const c = post[lang];
  const cat = post.category[lang];
  const related = publishedPosts().filter((p) => p.slug !== slug).slice(0, 3);

  return (
    <>
      <article className="article">
        <div className="wrap-tight">
          <div className="article-top reveal">
            <a href="blog.html" className="article-back">{ui.back}</a>
          </div>
          <header className="article-head reveal">
            <div className="blog-meta" style={{ justifyContent: "center" }}>
              <span className="tag"><span className="tag-dot" />{cat}</span>
              <span className="mono blog-meta-time">{fmtDate(post.dateISO, lang)} · {post.readMin} {ui.minRead}</span>
            </div>
            <h1 className="display article-title">{c.title}</h1>
            <p className="article-dek italic-serif">{c.dek}</p>
            <div className="article-byline">
              <span className="article-byline-dot" />
              {ui.by}
            </div>
          </header>
        </div>

        <div className="wrap reveal">
          <div className="ph article-hero">
            <img className="blog-cover-img" src={"assets/blog/" + post.slug + ".jpg"} alt="" />
            <span className="ph-label">{post.hero}</span>
            <span className="ph-coords">VIDALOZZI · JOURNAL</span>
          </div>
        </div>

        <div className="wrap-tight">
          <div className="article-body">
            {c.body.map((b, i) => <ArticleBlock key={i} block={b} />)}
          </div>

          <div className="article-cta reveal">
            <div>
              <div className="eyebrow" style={{ marginBottom: 14 }}>— {ui.eyebrow}</div>
              <h3 className="display article-cta-head">{ui.ctaHead}</h3>
              <p className="blog-dek" style={{ margin: "0 0 28px" }}>{ui.ctaSub}</p>
            </div>
            <a className="btn-primary" href="https://calendly.com/vidalozzi" target="_blank" rel="noreferrer">
              <span className="nav-cta-dot" style={{ background: "var(--bg-deep)" }} />
              {ui.ctaBtn}
              <span style={{ marginLeft: "auto" }}>→</span>
            </a>
          </div>
        </div>
      </article>

      <section className="blog-grid-sec" style={{ borderTop: "0.5px solid var(--line)" }} hidden={related.length === 0}>
        <div className="wrap">
          <div className="eyebrow reveal" style={{ marginBottom: 28 }}>— {ui.related}</div>
          <div className="blog-grid">
            {related.map((p) => (
              <div key={p.slug} className="reveal"><PostCard post={p} lang={lang} ui={ui} /></div>
            ))}
          </div>
        </div>
      </section>

      <Footer t={t} />
    </>
  );
}

Object.assign(window, { BlogPage, ArticlePage });
