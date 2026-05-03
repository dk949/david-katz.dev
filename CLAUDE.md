# david-katz.dev

Personal homepage / digital business card for David Katz — PhD researcher in HPC, compilers, LLVM/MLIR. Multi-page static site hosted on GitHub Pages at **david-katz.dev** (HTTPS).

This file is the single source of truth for project intent and conventions.

## Project context

- **Audience.** Currently doubles as PhD researcher page; will be updated for industry job hunt post-graduation. Tone: techy / low-level but readable and professional.
- **Landing page.** Basic about + contact info; left side reserved for a sidebar / nav that will grow as future projects are added.
- **Activity page.** GitHub visualiser (OSS contributions, language breakdown, etc.). Lives off the landing page on purpose — it's a "nice to have", not the headline.
- **Profile picture.** SVG placeholder in `public/avatar-placeholder.svg`. Optional — keep it only while it fits the design.
- **Contact.** Email `dk949.david@gmail.com`, GitHub `@dk949`, LinkedIn `https://www.linkedin.com/in/dk949/`. The email is also hard-coded in `src/pages/home.ts` for the copy-to-clipboard button — update both places if it changes.
- **Frameworks.** Intentionally avoided. Justify any added dependency by the weight it adds to the bundle.

## Stack

- **Vite 6** — multi-page build (see `vite.config.ts`)
- **Plain HTML** — one file per page at the repo root (`index.html`, `research.html`, `activity.html`)
- **Tailwind CSS 4** — via `@tailwindcss/vite`; global styles + custom CSS vars in `src/styles.css`
- **TypeScript** — strict, `noUncheckedIndexedAccess`, ESNext modules, bundler resolution
- **JetBrains Mono** — variable font via `@fontsource-variable/jetbrains-mono`

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
  styles.css              ← global Tailwind + theme tokens
  pages/{home,research,activity}.ts   ← per-page behavior, mounted by entry HTML
  lib/sidebar.ts          ← shared drawer/nav, accessibility wiring
  lib/github.ts           ← typed loader for generated/github.json
  generated/github.json   ← build-time output, committed for offline builds
  partials/{nav,footer}.html  ← HTML fragments included via `<!-- @include name -->`
data/oss-contributions.yml  ← list of `owner/repo` slugs to surface on /activity
scripts/fetch-github.ts   ← prebuild: hits GitHub API, writes generated/github.json
public/                   ← static assets served at site root (favicon, avatar)
```

## Conventions

- **Structure in HTML, behavior in TS.** Don't render full markup from TS — wire up listeners and inject only dynamic content (see `pages/activity.ts` for the accepted pattern).
- **Shared HTML via partials.** Markup duplicated across pages (nav, footer) lives in `src/partials/*.html` and is inlined at build time via the `htmlPartials` Vite plugin (`<!-- @include name -->`). Edit the partial, not the per-page copy.
- **Indentation: 2 spaces (HTML) 4 spaces (everything else)** (`.editorconfig`). LF line endings, final newline.
- **Strict TS.** `noUncheckedIndexedAccess` is on — destructure with explicit non-null assertions where the shape is guaranteed (`const [owner] = slug.split("/") as [string, string]`).
- **Theming.** **Tokyo Night** palette — dark default with neon accents, matching light mode driven by `prefers-color-scheme` media query in CSS (no JS toggle, no manual switch). Theme tokens live as CSS variables in `src/styles.css`.
- **Accessibility.** Drawer in `lib/sidebar.ts` manages `aria-hidden`/`aria-expanded`, focus trap, Escape-to-close. Preserve this when editing nav.
- **HTML escaping.** Any user/API string injected into `innerHTML` must go through `escHtml` (see `pages/activity.ts`). Prefer `textContent` when no markup is needed.
- **Mobile + desktop.** Both must work. Drawer collapses on mobile, sidebar on desktop.

## Git conventions

- **Commits:** Use [Conventional Commits](https://www.conventionalcommits.org/) format. Subject ≤50 chars. Body only when "why" isn't obvious.
- **Commit only when asked:** Do not auto-commit or proactively stage changes. Wait for explicit instruction.
- **Never push:** User retains full control over when and what gets pushed to remote.

## Build pipeline

`prebuild` (`scripts/fetch-github.ts`) fetches:

1. **OSS contributions** — repo metadata for each slug in `data/oss-contributions.yml`
2. **Language breakdown** — top 8 languages across `dk949`'s public repos by repo size, plus an "Other" bucket

Output: `src/generated/github.json` (committed, gitignored only via `generated/` rule — verify before adding new generated files). On API failure, prebuild falls back to the cached JSON; build only fails if no cache exists.

To add a tracked OSS repo: append the `owner/repo` slug to `data/oss-contributions.yml` and re-run `npm run prebuild`.

## Hosting

GitHub Pages, served from the built `dist/` output. HTTPS required. No server runtime — all dynamic data is baked at build time, so the deploy is a static asset upload.

`GITHUB_TOKEN` should be wired into the Pages build (e.g. via `${{ secrets.GITHUB_TOKEN }}` in the workflow) so `prebuild` hits the authenticated API rate limit.
