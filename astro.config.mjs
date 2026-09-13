// @ts-check
import { defineConfig } from 'astro/config';

// SITE and BASE are set by the deploy workflow from actions/configure-pages,
// so the same build works at masatemma.github.io, /personal-website/ or a
// custom domain. Locally they default to the user site.
const site = process.env.SITE || 'https://masatemma.github.io';
const base = process.env.BASE || '/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  output: 'static',
  // Keep view-source readable. The gzip cost is a few hundred bytes.
  compressHTML: false,
  build: {
    // One cached stylesheet shared by every page, never inlined.
    inlineStylesheets: 'never',
  },
});
