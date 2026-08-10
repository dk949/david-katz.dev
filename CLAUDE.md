# david-katz.dev

Personal homepage / digital business card for David Katz — PhD researcher in HPC, compilers, LLVM/MLIR. Multi-page static site hosted on GitHub Pages at **david-katz.dev** (HTTPS).

This file is the single source of truth for project intent and conventions.

## Project context

- **Audience.** Currently doubles as PhD researcher page; will be updated for industry job hunt post-graduation. Tone: techy / low-level but readable and professional.
- **Landing page.** Basic about + contact info; left side reserved for a sidebar / nav that will grow as future projects are added.
- **Activity page.** GitHub visualiser (OSS contributions, language breakdown, etc.). Lives off the landing page on purpose — it's a "nice to have", not the headline.
- **Contact.** Email `dk949.david@gmail.com`, GitHub `@dk949`, LinkedIn `https://www.linkedin.com/in/dk949/`. The email is also hard-coded in `src/pages/home.ts` for the copy-to-clipboard button — update both places if it changes.
- **Frameworks.** Intentionally avoided. Justify any added dependency by the weight it adds to the bundle.
- **Sibling repos.** `../business-card` is the digital business card at **hi.david-katz.dev** (separate repo only because GitHub Pages allows one custom domain per repo; it links back here). `../site-theme` holds the design tokens both sites use. A palette change touches all three.

## Stack

- **Vite 6** — multi-page build (see `vite.config.ts`)
- **Plain HTML** — one file per page at the repo root (`index.html`, `research.html`, `activity.html`)
- **Tailwind CSS 4** — via `@tailwindcss/vite`; global styles in `src/styles.css`
- **@dk949/site-theme** — the Silicon + Copper tokens, shared with the business card (see "Shared theme")
- **TypeScript** — strict, `noUncheckedIndexedAccess`, ESNext modules, bundler resolution
- **JetBrains Mono** — variable font via `@fontsource-variable/jetbrains-mono`
- **Archivo** — variable font (wght + wdth) via `@fontsource-variable/archivo`

## Commands

| Command            | Purpose                                                      |
| ------------------ | ------------------------------------------------------------ |
| `npm run dev`      | Vite dev server                                              |
| `npm run build`    | Runs `prebuild` (GitHub fetch) then `vite build`             |
| `npm run preview`  | Preview built site                                           |
| `npm run typecheck`| `tsc --noEmit`                                               |

`GITHUB_TOKEN` env var raises GitHub API limit from 60 to 5000/hr during prebuild.

## Layout

```
index.html / research.html / activity.html  ← entry points (structure lives here)
src/
  styles.css              ← global Tailwind + site styles (tokens come from @dk949/site-theme)
  pages/{home,research,activity,projects}.ts   ← per-page behavior, mounted by entry HTML
  lib/sidebar.ts          ← shared drawer/nav, accessibility wiring
  lib/github.ts           ← typed loader for generated/github.json
  lib/escape.ts           ← HTML escaping helper for innerHTML injection
  generated/github.json   ← build-time output (gitignored)
  partials/{nav,footer}.html  ← HTML fragments included via `<!-- @include name -->`
data/site.yml             ← single source of truth for build-time data: ignore lists, contribution pins, projects, publications
scripts/fetch-github.ts   ← prebuild: hits GitHub API, writes generated/github.json
public/                   ← static assets served at site root (CNAME, avatar; the favicon comes from @dk949/site-theme)
```

## Conventions

- **Structure in HTML, behavior in TS.** Don't render full markup from TS — wire up listeners and inject only dynamic content (see `pages/activity.ts` for the accepted pattern).
- **Shared HTML via partials.** Markup duplicated across pages (nav, footer) lives in `src/partials/*.html` and is inlined at build time via the `htmlPartials` Vite plugin (`<!-- @include name -->`). Edit the partial, not the per-page copy.
- **Indentation: 2 spaces (HTML) 4 spaces (everything else)** (`.editorconfig`). LF line endings, final newline.
- **Strict TS.** `noUncheckedIndexedAccess` is on — destructure with explicit non-null assertions where the shape is guaranteed (`const [owner] = slug.split("/") as [string, string]`).
- **Theming.** **Silicon + Copper** palette — wafer-grey surfaces, copper accent (interactive), teal secondary (informational), green for success states. Light default, dark via `prefers-color-scheme` media query in CSS (no JS toggle, no manual switch). Tokens come from the `@dk949/site-theme` package (see "Shared theme"), not from `src/styles.css`; all fg/bg pairs validated ≥ WCAG AA.
- **Typography.** Archivo Variable (wght + wdth axes) for display headings and body copy; JetBrains Mono for labels, nav, data, and metadata. Section `h2`s render as lowercase mono labels with a CSS-generated `%` prefix (MLIR SSA-value nod) — heading text itself stays plain.
- **Accessibility.** Drawer in `lib/sidebar.ts` manages `aria-hidden`/`aria-expanded`, focus trap, Escape-to-close. Preserve this when editing nav.
- **HTML escaping.** Any user/API string injected into `innerHTML` must go through `escHtml` (see `pages/activity.ts`). Prefer `textContent` when no markup is needed.
- **Mobile + desktop.** Both must work. Drawer collapses on mobile, sidebar on desktop.

## Shared theme

The Silicon + Copper tokens live in **[`@dk949/site-theme`](https://www.npmjs.com/package/@dk949/site-theme)** (source: [dk949/site-theme](https://github.com/dk949/site-theme), local checkout at `../site-theme`), consumed by this site and by the business card. Neither keeps a local copy.

```css
@import "@dk949/site-theme/theme.css";
```

Tailwind 4 resolves `@import` out of `node_modules`, so the `@theme` block behaves exactly as it did inline.

**The package is tokens plus the favicon** — the `@theme` block, the `prefers-color-scheme` override, `favicon.svg`, and the `themeFavicon()` Vite plugin that installs it. Nothing else: layout, components, and anything page-specific stay in `src/styles.css`. Loading Archivo and JetBrains Mono is also this repo's job; the theme only names them.

**The favicon is not in `public/`.** It ships with the theme so this site and the card cannot drift, and `public/` cannot reach into `node_modules`. `themeFavicon()` in `vite.config.ts` serves it in dev and emits it to `dist/favicon.svg` on build, so the `<link rel="icon" href="/favicon.svg">` in each page is unchanged. Editing the mark means releasing the package, same as a token.

**Changing a token means releasing the package**, not editing a file here: bump the version in `../site-theme`, `npm publish`, then `npm install` here and in the card. Versioning is semver on the rendered result (patch for a colour nudge that preserves every role and contrast ratio, minor for a new token or asset, major for removing or repurposing one). The `^` range means `npm ci` stays pinned by the lockfile, so a theme release never lands on the live site until this repo's own build runs.

## Git conventions

- **Commits:** Use [Conventional Commits](https://www.conventionalcommits.org/) format. Subject ≤50 chars. Body only when "why" isn't obvious.
- **Commit only when asked:** Do not auto-commit or proactively stage changes. Wait for explicit instruction.
- **Never push:** User retains full control over when and what gets pushed to remote.

## Build pipeline

`prebuild` (`scripts/fetch-github.ts`) fetches:

1. **OSS contributions** — auto-discovered via GitHub search (`is:pr author:dk949 is:merged`), filtered by `ignore.repos`/`ignore.owners` in `data/site.yml`, augmented with `contributions.pinned` slugs, sorted by merged-PR count desc (then stars), capped at `contributions.limit`.
2. **Language breakdown** — top `languages.limit` (default 8) languages across `dk949`'s public repos by repo size, minus `ignore.languages`, plus an "Other" bucket.
3. **Projects + publications** — passed through verbatim from `data/site.yml`.

Output: `src/generated/github.json` (gitignored — regenerated each prebuild). On API failure, prebuild falls back to the cached JSON; build only fails if no cache exists.

`data/site.yml` is the single config surface — ignore lists, pinned slugs, limits, projects, and publications all live there. Re-run `npm run prebuild` after editing.

`GITHUB_TOKEN` is read from `.env` locally (via `tsx --env-file-if-exists=.env`); needs no scopes (auth alone bumps the rate limit 60→5000/hr).

## Hosting

GitHub Pages, served from the built `dist/` output. HTTPS required. No server runtime — all dynamic data is baked at build time, so the deploy is a static asset upload.

`GITHUB_TOKEN` should be wired into the Pages build (e.g. via `${{ secrets.GITHUB_TOKEN }}` in the workflow) so `prebuild` hits the authenticated API rate limit.
