# 🗺️ Guide d'édition — vidalozzi.fr

> But de ce document : savoir **quoi modifier et où**, sans rien casser.
> Garde-le à la racine du dépôt, il ne sert qu'à toi.

---

## 1. Comment le site est construit (en 30 secondes)

Le site est un **mini-site React**. Chaque page (`index.html`, `ugc.html`, `talent.html`, `blog.html`) est une **coquille** quasi vide : elle charge toujours les mêmes fichiers JavaScript, puis affiche la bonne page.

```
Une page .html  ─charge→  les textes (copy.js)
                          + les composants (home.jsx / ugc.jsx / talent.jsx …)
                          + les briques communes (shared.jsx)
                          + les outils (image-slot, video-slot, tweaks)
                 ─puis→   app.jsx assemble le tout et affiche la page
```

👉 **Conséquence importante :** pour changer un **texte**, tu n'édites presque jamais le `.html`.
Tu édites **`copy.js`** (le texte) ou le fichier `.jsx` de la page concernée (la mise en page).

---

## 2. Carte des fichiers (par rôle)

| Rôle | Fichier(s) | Tu y touches pour… |
|---|---|---|
| 📝 **Tous les textes du site** | `copy.js` | Changer un titre, un paragraphe, un prix, une question de FAQ, le menu… |
| 🏠 Page d'accueil (structure) | `home.jsx` | Disposition de la home : hero, cartes UGC/Talent, à propos, stats |
| 🎬 Page UGC (structure) | `ugc.jsx` | Hero UGC, **carrousel vidéos**, services, packs, process, FAQ |
| 🎭 Page Talent (structure) | `talent.jsx` | Hero talent, book, mensurations, casting |
| 📰 Journal / blog (structure) | `blog.jsx` | Liste des articles, page d'un article |
| 📰 Contenu des articles | `blog-data.js` | Le texte des articles de blog |
| 🧩 Briques communes | `shared.jsx` | Menu (Nav), bandeau marques, témoignages, bloc Contact, footer, FAQ accordéon |
| 🎛️ Assemblage + réglages | `app.jsx` | Couleurs/polices par défaut, panneau « Tweaks », mode édition |
| 🎨 Styles / apparence | `styles.css` | Couleurs de fond, espacements, animations, responsive |
| 🖼️ Photos remplaçables | `image-slot.js` | (outil — ne pas modifier) gère le glisser-déposer des photos |
| ▶️ Vidéos remplaçables | `video-slot.js` | (outil — ne pas modifier) gère le glisser-déposer des vidéos |
| ✏️ Édition de texte en direct | `content-editor.js` | (outil — ne pas modifier) permet le mode édition |
| ⚙️ Panneau de réglages | `tweaks-panel.jsx` | (outil — ne pas modifier) |
| Les pages (coquilles) | `index.html`, `ugc.html`, `talent.html`, `blog.html` | SEO uniquement (titre Google, description, mots-clés) |
| Référencement | `sitemap.xml`, `robots.txt`, `favicon.svg`, `CNAME` | Technique — rarement |

---

## 3. « Je veux changer… » → où aller

### ✏️ Un texte (titre, paragraphe, prix, FAQ, menu)
➡️ **`copy.js`** — tout le texte y est rangé, en **français (`fr:`)** puis en **anglais (`en:`)**.
La structure suit les rubriques :

```
copy.js
├─ fr:
│   ├─ nav      → le menu (Accueil, UGC, Talent, Journal, Contact)
│   ├─ book     → le bouton « Réserver un appel »
│   ├─ home:    → toute la page d'accueil
│   ├─ ugc:     → toute la page UGC (services, packs, prix, add-ons, process, FAQ)
│   ├─ talent:  → toute la page Talent
│   ├─ contact: → le bloc « Travaillons ensemble »
│   └─ footer:  → le pied de page
└─ en:  (même structure, en anglais)
```
> ⚠️ Si tu changes un texte en `fr:`, pense à changer son équivalent en `en:`.

### 💶 Un prix ou un pack UGC
➡️ `copy.js` → `ugc:` → `packs:` (les 3 formules) et `addons:` (les options).

### ❓ Une question de FAQ
➡️ `copy.js` → la rubrique concernée → `faq:` (paires `q:` question / `a:` réponse).

### 🎬 Le carrousel de vidéos UGC (réglages)
➡️ **`ugc.jsx`**, tout en haut, fonction `UgcReel`. Repères utiles :
- `UGC_ROW` : la liste des **8 emplacements vidéo**.
- `setInterval(… , 3000)` : la **vitesse** du défilement automatique (en millisecondes).
- Survol = pause automatique ; les boutons play/volume restent cliquables.
- Pour **déposer une vidéo** : passe en mode édition (voir §6) puis glisse ta vidéo sur une case.

### 🎨 Les couleurs / polices
- Réglage rapide (sans coder) : panneau **« Tweaks »** sur le site (voir §6).
- Valeurs par défaut : `app.jsx` → `TWEAK_DEFAULTS` (couleur d'accent, polices).
- Détails visuels (fonds, lignes, ombres) : `styles.css`.

### 🧭 Le menu de navigation
➡️ Texte des liens : `copy.js` → `nav:`. Comportement/structure : `shared.jsx` → fonction `Nav`.

### 🤝 Le bandeau « Ils m'ont fait confiance »
➡️ `shared.jsx` → `BrandsMarquee` (et `BrandLogo`).

### 💬 Les témoignages
➡️ Texte : `copy.js` → `testimonials`. Affichage : `shared.jsx` → `Testimonials`.

### 📞 Le bloc Contact / le footer
➡️ Texte : `copy.js` → `contact:` / `footer:`. Affichage : `shared.jsx` → `Contact` / `Footer`.

### 📰 Un article de blog
➡️ Le **contenu** des articles est dans `blog-data.js`. L'affichage (liste + page article) est dans `blog.jsx`.

### 🔎 Le titre Google / la description d'une page (SEO)
➡️ Dans le `.html` de la page (ex. `ugc.html`), en haut : balises `<title>` et `<meta name="description">`.

---

## 4. Détail par page

### 🏠 Accueil — `home.jsx` (+ textes dans `copy.js → home`)
Hero « L'image fait foi » · cartes **UGC / Talent** · bandeau marques · bloc « À propos » · statistiques (120+ vidéos, etc.) · témoignages · contact · footer.

### 🎬 UGC — `ugc.jsx` (+ textes dans `copy.js → ugc`)
Composants dans l'ordre d'affichage :
| Composant (dans `ugc.jsx`) | Ce que c'est |
|---|---|
| `UgcHero` | Le grand titre « Du contenu qui convertit » |
| `UgcReel` | **Le carrousel de 8 vidéos** (réglages ci-dessus) |
| `UgcServices` | La grille « Ce que je livre » (6 services) |
| `UgcPacks` + `UgcAddons` | Les 3 packs + le panneau d'options |
| `UgcProcess` | Les 4 étapes (Brief → Concept → Tournage → Livraison) |
| `UgcFaq` | La FAQ |

### 🎭 Talent — `talent.jsx` (+ textes dans `copy.js → talent`)
Hero, book photo, infos casting/mensurations.

### 📰 Journal — `blog.jsx` (+ contenu dans `blog-data.js`)
Liste des articles et page d'un article.

---

## 5. Les briques communes — `shared.jsx`
Elles apparaissent sur **plusieurs pages**, donc on ne les édite qu'une fois :
`Nav` (menu) · `BrandsMarquee` (marques) · `Testimonials` · `Contact` · `Footer` · `Accordion` (FAQ) · `ModeSwitch` (bascule UGC↔Talent).

---

## 6. Mode édition & réglages (sans coder)
Sur **ordinateur** :
- **Panneau « Tweaks »** : change couleur d'accent, polices, clair/sombre, densité, N&B — en direct.
- **Mode édition** : active-le dans Tweaks (« Edit mode »), ou avec `Cmd/Ctrl + Shift + E`, ou en ajoutant `#edit` à l'URL.
  - Une fois activé : tu peux **cliquer un texte pour le réécrire** et **glisser tes photos/vidéos** dans les cases.
  - Pour sortir : bouton « Exit », ou `#exit` dans l'URL.
- ⚠️ Le mode édition est **désactivé sur mobile** (volontaire).

---

## 7. Règle d'or pour ne rien casser
1. **Texte → `copy.js`** (et pense à la version anglaise).
2. **Mise en page d'une page → le `.jsx` de cette page.**
3. **Élément présent partout → `shared.jsx`.**
4. Ne touche pas aux *outils* (`image-slot.js`, `video-slot.js`, `content-editor.js`, `tweaks-panel.jsx`) sauf besoin précis.
5. Teste en local en ouvrant le `.html` avant de committer.
