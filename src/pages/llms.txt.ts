import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { absolute, formatMonth, getProfile, getProjects } from '../lib/site';

// A plain-text summary for language models, built from the same content as the pages.
// Paragraphs starting with TODO are skipped so placeholders never end up quoted.
export const GET: APIRoute = async ({ site }) => {
  const profile = await getProfile();
  const experience = await getCollection('experience');
  const education = await getCollection('education');
  const projects = await getProjects();

  const paragraphs = (markdown = '') =>
    markdown
      .split(/\n\s*\n/)
      .map((p) => p.replace(/\s*\n\s*/g, ' ').trim())
      .filter((p) => p && !p.startsWith('TODO'));

  const lines = [
    `# ${profile.name}`,
    '',
    `> ${profile.tagline}`,
    '',
    profile.summary,
    '',
    `Now: ${profile.now}`,
    '',
    `Looking for: ${profile.lookingFor}`,
    '',
    '## Experience',
    '',
    ...experience.map(({ data }) =>
      `- ${data.title}, ${data.org} (${formatMonth(data.start)} – ${data.end ? formatMonth(data.end) : 'present'})`,
    ),
    '',
    '## Education',
    '',
    ...education.map(({ data }) => `- ${data.degree}, ${data.institution} (${data.start} – ${data.end})`),
    '',
    '## Projects',
    '',
    ...projects.flatMap(({ data, body }) => [
      `### ${data.title}`,
      '',
      [data.org, data.period, data.team].filter(Boolean).join(' · '),
      '',
      `Problem: ${data.problem}`,
      '',
      ...paragraphs(body).flatMap((p) => [p, '']),
      `Stack: ${data.stack.join(', ')}`,
      ...(data.outcomes.length > 0
        ? ['', `Outcomes: ${data.outcomes.map(({ value, label }) => `${value} ${label}`).join('; ')}`]
        : []),
      '',
    ]),
    '## Skills and languages',
    '',
    `- Stack: ${[...profile.stack.primary, ...profile.stack.secondary].join(', ')}`,
    `- Languages: ${profile.languages.map(({ name, level }) => `${name} (${level})`).join(', ')}`,
    `- Based in ${profile.location.city}, ${profile.location.country}`,
    '',
    '## Links',
    '',
    `- [Work](${absolute('/work/', site)}): projects in detail`,
    `- [About](${absolute('/about/', site)}): career, education, languages`,
    `- [Contact](${absolute('/contact/', site)}): email, LinkedIn, GitHub`,
    `- [Résumé](${absolute(`/${profile.resume}`, site)}): PDF`,
    `- [LinkedIn](${profile.links.linkedin})`,
    `- [GitHub](${profile.links.github})`,
    '',
  ];

  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
