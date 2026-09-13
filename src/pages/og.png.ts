import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import type { APIRoute } from 'astro';
import { getProfile } from '../lib/site';

// Rendered once at build time into dist/og.png. Nothing here ships to browsers.
const escape = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Greedy word wrap by character count. Good enough for a known font and size. */
function wrap(text: string, maxChars: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    if (line && `${line} ${word}`.length > maxChars) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  return line ? [...lines, line] : lines;
}

export const GET: APIRoute = async ({ site }) => {
  const profile = await getProfile();
  const host = site ? new URL(import.meta.env.BASE_URL, site).host + import.meta.env.BASE_URL.replace(/\/$/, '') : '';
  const tagline = wrap(profile.tagline, 40)
    .map((line, i) => `<tspan x="96" dy="${i === 0 ? 0 : 58}">${escape(line)}</tspan>`)
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#fcfcfb"/>
  <rect x="0" y="0" width="1200" height="12" fill="#0f6e6e"/>
  <text x="96" y="236" font-family="Inter" font-weight="600" font-size="80" letter-spacing="-1.5" fill="#1b1b1a">${escape(profile.name)}</text>
  <text x="96" y="322" font-family="Inter" font-weight="400" font-size="44" fill="#5c5c58">${tagline}</text>
  <text x="96" y="534" font-family="Inter" font-weight="600" font-size="30" fill="#0f6e6e">${escape(host)}</text>
</svg>`;

  const fonts = ['Inter-Regular.ttf', 'Inter-SemiBold.ttf'].map((name) => resolve('assets/fonts', name));
  for (const font of fonts) readFileSync(font); // Fail loudly if a font is missing.

  const png = new Resvg(svg, {
    font: { fontFiles: fonts, loadSystemFonts: false, defaultFontFamily: 'Inter' },
  })
    .render()
    .asPng();

  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
