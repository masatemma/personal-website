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
  const tagline = wrap(profile.tagline, 42)
    .map((line, i) => `<tspan x="96" dy="${i === 0 ? 0 : 56}">${escape(line)}</tspan>`)
    .join('');

  const dots = Array.from({ length: 14 }, (_, row) =>
    Array.from({ length: 27 }, (_, col) => `<circle cx="${636 + col * 22}" cy="${24 + row * 22}" r="1.6"/>`).join(''),
  ).join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="fade" x1="1" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="1"/>
      <stop offset="0.75" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <mask id="m"><rect width="1200" height="630" fill="url(#fade)"/></mask>
  </defs>
  <rect width="1200" height="630" fill="#f6f6f3"/>
  <g fill="#cfcfc7" mask="url(#m)">${dots}</g>
  <rect x="96" y="112" width="22" height="22" rx="5" fill="#0f6e6e"/>
  <text x="134" y="131" font-family="Martian Mono" font-size="24" fill="#5d5e59">${escape(host)}</text>
  <text x="90" y="300" font-family="Martian Mono" font-size="84" letter-spacing="-4" fill="#121212">${escape(profile.name)}</text>
  <text x="96" y="380" font-family="Inter" font-size="42" fill="#121212">${tagline}</text>
  <rect x="96" y="500" width="1008" height="1" fill="#e1e1dc"/>
  <text x="96" y="548" font-family="Martian Mono" font-size="22" fill="#0f6e6e">${escape(profile.jobTitle.toUpperCase())}</text>
  <text x="1104" y="548" text-anchor="end" font-family="Martian Mono" font-size="22" fill="#5d5e59">${escape(`${profile.location.city.toUpperCase()}, ${profile.location.countryCode}`)}</text>
</svg>`;

  const fonts = ['Inter-Regular.ttf', 'MartianMono-StdMd.ttf'].map((name) => resolve('assets/fonts', name));
  for (const font of fonts) readFileSync(font); // Fail loudly if a font is missing.

  const png = new Resvg(svg, {
    font: { fontFiles: fonts, loadSystemFonts: false, defaultFontFamily: 'Inter' },
  })
    .render()
    .asPng();

  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
