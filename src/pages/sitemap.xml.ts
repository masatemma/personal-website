import type { APIRoute } from 'astro';
import { absolute, getPosts } from '../lib/site';

export const GET: APIRoute = async ({ site }) => {
  const posts = await getPosts();
  const iso = (date: Date) => date.toISOString().slice(0, 10);

  const urls = [
    { loc: absolute('/', site) },
    { loc: absolute('/work/', site) },
    { loc: absolute('/about/', site) },
    { loc: absolute('/contact/', site) },
    // The Writing index is noindex while empty, so leave it out until there is a post.
    ...(posts.length > 0 ? [{ loc: absolute('/writing/', site), lastmod: iso(posts[0].data.date) }] : []),
    ...posts.map(({ id, data }) => ({
      loc: absolute(`/writing/${id}/`, site),
      lastmod: iso(data.updated ?? data.date),
    })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(({ loc, lastmod }) => `  <url><loc>${loc}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`).join('\n')}
</urlset>
`;

  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
