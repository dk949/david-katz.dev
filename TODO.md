# TODO

* [x] Hosting
    * [x] Connect domain (Namecheap DNS + Vercel custom domain - manual)
    * [x] Deploy on Vercel (push builds + scheduled deploy hook)
    * [x] Add readme badge
* [x] Deduplicate nav (topbar/drawer/rail) into `src/partials/nav.html`
* [x] OSS contribution list should also be generated
* [x] Add "ignore" lists for repos which should not be considered when
  generating OSS contribution list and used languages
* [X] Add ORCID
    * [x] Add ORCID link in contact section (placeholder iD)
    * [X] Replace `0000-0000-0000-0000` placeholder with real ORCID iD
* [x] Add "Other projects" sidebar item for other web based stuff I've made.
  These will not be hosted in the same repo (likely linked using subdomains)
* [>] Add links/references to everything that needs them.
    * [x] Add accent color + underline for links
    * [x] Sweep index/research for unlinked entities (Cerebras, LLVM, MLIR,
      OpenMP, Fortran, xDSL)
    * [ ] Continue to audit as content grows
* [x] Add abbreviation expansions on hover (instead of putting them in
  parentheses).
* [x] Automatically populate publications from the yaml file
* [x] Visual refresh: silicon+copper palette, Archivo display/body type,
  layout polish (both themes, AA contrast, no content/functionality loss)
* [x] Make pages more visually interesting
    * [x] Home
        * [x] Add appropriate colours for contact links
            * [x] GH: #6e5494
            * [x] LinkedIn: #0a66c2
            * [x] ORCID: #a6ce39
    * [x] Research
        * [x] Interests: looks like a bunch of paragraphs, should be more of
          a list
        * [x] Not much distinction between entries, consider making each one
          a card
* [x] Extract the silicon+copper tokens into `@dk949/site-theme` and consume
  them from npm, shared with the business card at hi.david-katz.dev
* [x] Scope Tailwind's source detection (`@import "tailwindcss" source(none)`
  plus explicit `@source` lines). It currently walks the whole repo, so prose
  in CLAUDE.md and TODO.md emits utilities for words like "grid" and "border"
  and inflates the CSS bundle
* [X] Replace the favicon: `public/favicon.svg` still uses the old Tokyo Night
  colours (#1a1b26 / #7aa2f7), which no longer match the palette
* [>] SEO
    * [x] Link previews: Open Graph + Twitter card tags, canonical URLs, and
      a 1200x630 `og:image` (source in `assets/og-image.svg`)
    * [x] `robots.txt` + `sitemap.xml` (generated on build from the bundled
      pages)
    * [x] Clean URLs: `cleanUrls: true` in `vercel.json`, drop `.html` from
      nav links and from the canonical/`og:url` the `socialMeta` plugin emits
    * [x] JSON-LD `ProfilePage`/`Person` on the home page
        * [x] Add the block to `index.html`
        * [x] Review `jobTitle`, `description`, `knowsAbout` wording
        * [x] Update `image` when the avatar is resized/renamed
        * [x] Validate (Rich Results Test / validator.schema.org) once deployed
    * [x] Shrink the avatar: 680 KB 728px PNG → 124/248/372px WebP
      (`avatar-*.webp`) served via `srcset`; sized to the 124px
      content box (128px minus border) so the browser never rescales
    * [ ] Rework titles/descriptions: home title is just "David Katz",
      projects description is "Other web-based things."
    * [ ] PNG `apple-touch-icon` (iMessage/iOS ignore SVG favicons); belongs
      in `@dk949/site-theme` next to the favicon
    * [ ] `rel="me"` links between this site, the card, GitHub, LinkedIn
    * [ ] Activity page content is JS-injected, so non-Google crawlers see it
      empty. Data is build-time anyway; could prerender, but conflicts with
      "structure in HTML, behavior in TS". Low priority
    * [ ] Verify in Google Search Console, submit sitemap (manual)
    * [ ] Minor: custom `404.html`, `theme-color` meta
