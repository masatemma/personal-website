# masatemma.github.io

Personal site for Masaharu Temma. Static, built with [Astro](https://astro.build),
ships zero JavaScript, and deploys to GitHub Pages.

The landing page is about **16 KB transferred** (HTML, CSS, one web font and favicon),
against a hard budget of 50 KB that CI enforces.

## Local development

Requires Node 22 (Astro 7 doesn't support odd-numbered Node releases).

```sh
nvm use            # reads .nvmrc
npm install
npm run dev        # http://localhost:4321, drafts visible
npm run build      # production build into dist/
npm run preview    # serve dist/ locally
npm run check      # type-check content schemas and components
npm run budget     # page weight and zero-JS check, run after build
```

If a deleted post still appears after a build, run `npm run clean`. Astro's content
cache can keep an entry when you delete the only file in a collection. CI always
builds from a clean checkout, so the live site isn't affected.

## Where things live

```
src/content/
  profile.yaml         name, tagline, now, connect, links, stack, languages
  experience.yaml      roles (title, org, dates)
  education.yaml       degrees
  projects/*.md        Work page entries
  posts/*.md           Writing posts
src/content.config.ts  schemas for all of the above
src/pages/             routes, plus og.png, rss.xml, sitemap.xml, robots.txt, llms.txt
src/styles/site.css    the only stylesheet
```

Content edits never require touching components. The schema in
`src/content.config.ts` validates every file, so a missing or mistyped field fails
the build with a clear message.

## Adding a project

Create `src/content/projects/<slug>.md`:

```md
---
title: Short name of the project
order: 3                      # position on the Work page, 1 = first
org: Company or context
orgUrl: https://example.com   # optional
period: 2026                  # optional, free text
team: Team of 4               # optional, free text
problem: >-
  One or two sentences on the problem.
stack: [Databricks, PySpark, Terraform]
outcomes:                     # optional, shown as large figures
  - value: 40%
    label: lower monthly compute cost
  - value: 12 min
    label: nightly pipeline runtime, down from 3 h
---

What you built, in Markdown. This becomes the "What I built" section.
```

Paragraphs starting with `TODO` render on the page but are left out of `/llms.txt`.
Before you deploy, find the remaining ones with:

```sh
grep -rn TODO src/content
```

## Adding a post

Create `src/content/posts/<slug>.md`. The filename becomes the URL, `/writing/<slug>/`.

```md
---
title: Post title
description: One sentence for the index, RSS and link previews.
date: 2026-10-01
updated: 2026-10-05   # optional
draft: true           # optional; drafts show in `npm run dev` only
---

Post body in Markdown.
```

The Writing link appears in the nav automatically once there is at least one
published post. RSS and the sitemap update on the next build. Files starting with
`_` are ignored, so you can keep templates or unfinished notes there.

## Deploying (GitHub Pages)

The workflow in `.github/workflows/deploy.yml` runs on every push to `main`:
type-check, build, budget check, then deploy. Pull requests build and run the
checks but don't deploy.

One-time setup:

1. **Rename the repo to `masatemma.github.io`** to serve at the root domain. With
   the current name (`personal-website`) the site is served at
   `https://masatemma.github.io/personal-website/`. The workflow detects the right
   base path either way, so no code changes are needed.
2. In the repo on GitHub: **Settings → Pages → Build and deployment → Source:
   GitHub Actions**.
3. Push to `main`, or run the workflow manually from the Actions tab.

Under a project path (`/personal-website/`), crawlers only read `robots.txt` at
the domain root, so the sitemap reference in it is ignored. Renaming the repo
fixes that too.

### Custom domain later

Add `public/CNAME` containing the domain, point DNS at GitHub Pages, and set the
domain under Settings → Pages. `configure-pages` picks up the new origin, so
canonical URLs, the sitemap, RSS and the OG image all follow.

### Cloudflare Pages instead

Build command `npm run build`, output directory `dist`, environment variables
`NODE_VERSION=22` and `SITE=https://<your-project>.pages.dev`. No other changes
needed.

## Design notes

- **Type:** Martian Mono 500 for display type, labels and metadata. It's one
  self-hosted Latin subset (`src/assets/fonts`, 10 KB, preloaded, SIL OFL) with a
  size-adjusted fallback, so it causes no layout shift. Body text uses the system
  sans stack. All sizes are fluid with `clamp()`.
- **Layout:** a 72rem frame. Inner pages put section labels in an 11rem gutter
  that stays in place while you scroll (on screens 52rem and wider) and stacks
  above the content on narrow screens. Project cards use container queries, so
  they adapt to their own width rather than the viewport. The base size steps up
  on very large displays.
- **Colour:** one accent, teal `#0f6e6e` light and `#5ec8c8` dark, on warm
  neutrals. Every text/background pair is at least 5.5:1.
- **Dark mode:** `prefers-color-scheme` only, no toggle, no JS.
- **Motion:** hover transitions only, under `prefers-reduced-motion: no-preference`.
- **Badge:** the home page badge shows the location. Uncomment `status` in
  `profile.yaml` to add a note before it.
- **Email:** HTML-entity-encoded on the Contact page. Browsers and reader mode
  decode it; naive scrapers don't. Without JS that's as far as obfuscation goes.
  The address isn't in the JSON-LD, `llms.txt` or OG image.
- **OG image:** an SVG template rasterised by resvg at build time, using the
  Martian Mono and Inter TTFs in `assets/fonts`. Those TTFs are never shipped to
  browsers.
- **Readable source:** `compressHTML` is off and there are no scoped styles, so
  view-source shows plain, indented HTML.
