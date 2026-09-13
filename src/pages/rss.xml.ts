import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { absolute, getPosts, getProfile } from '../lib/site';

export const GET: APIRoute = async ({ site }) => {
  const profile = await getProfile();
  const posts = await getPosts();

  return rss({
    title: `${profile.name}: Writing`,
    description: `Notes from ${profile.name}, ${profile.tagline}`,
    site: absolute('/', site),
    customData: '<language>en-au</language>',
    items: posts.map(({ id, data }) => ({
      title: data.title,
      description: data.description,
      pubDate: data.date,
      link: absolute(`/writing/${id}/`, site),
    })),
  });
};
