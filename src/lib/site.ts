import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Prefix a root-relative path with the deploy base, e.g. "/work/". */
export const href = (path: string): string => `${base}${path}`;

/** Absolute URL for canonical tags, feeds and the sitemap. */
export const absolute = (path: string, site: URL | undefined): string =>
  new URL(href(path), site).toString();

export async function getProfile() {
  const entry = await getEntry('profile', 'profile');
  if (!entry) throw new Error('src/content/profile.yaml is missing');
  return entry.data;
}

/** Published posts, newest first. Drafts are visible in dev only. */
export function getPosts(): Promise<Post[]> {
  const load = () =>
    getCollection('posts', ({ data }) => import.meta.env.DEV || !data.draft).then((entries) =>
      entries.sort((a, b) => b.data.date.getTime() - a.data.date.getTime()),
    );
  // In dev, reload so new posts show up. At build time every page's nav asks, so load once.
  if (import.meta.env.DEV) return load();
  postsCache ??= load();
  return postsCache;
}

type Post = CollectionEntry<'posts'>;
let postsCache: Promise<Post[]> | undefined;

export async function getProjects() {
  const projects = await getCollection('projects');
  return projects.sort((a, b) => a.data.order - b.data.order);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-07" -> "Jul 2026" */
export const formatMonth = (value: string): string => {
  const [year, month] = value.split('-');
  return `${MONTHS[Number(month) - 1]} ${year}`;
};

export const formatDate = (date: Date): string =>
  `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;

/**
 * Encode every character as a numeric HTML entity. Browsers decode it and
 * reader mode shows it normally, but scrapers that regex raw HTML for
 * addresses miss it. With no JS this is the best available.
 */
export const obfuscate = (text: string): string =>
  [...text].map((char) => `&#${char.codePointAt(0)};`).join('');
