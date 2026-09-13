import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Month precision, e.g. "2026-07". Kept as a string so no timezone can shift it.
const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Use YYYY-MM');

const profile = defineCollection({
  loader: glob({ base: './src/content', pattern: 'profile.yaml' }),
  schema: z.object({
    name: z.string(),
    shortName: z.string(),
    jobTitle: z.string(),
    location: z.object({ city: z.string(), country: z.string(), countryCode: z.string().length(2) }),
    tagline: z.string(),
    summary: z.string(),
    about: z.array(z.string()),
    now: z.string(),
    lookingFor: z.string(),
    email: z.email(),
    links: z.object({ linkedin: z.url(), github: z.url() }),
    resume: z.string(),
    stack: z.object({ primary: z.array(z.string()), secondary: z.array(z.string()).default([]) }),
    languages: z.array(z.object({ name: z.string(), code: z.string(), level: z.string() })),
  }),
});

const experience = defineCollection({
  loader: file('src/content/experience.yaml'),
  schema: z.object({
    title: z.string(),
    org: z.string(),
    url: z.url().optional(),
    start: month,
    end: month.nullable(),
  }),
});

const education = defineCollection({
  loader: file('src/content/education.yaml'),
  schema: z.object({
    degree: z.string(),
    institution: z.string(),
    url: z.url().optional(),
    start: z.number().int(),
    end: z.number().int(),
  }),
});

const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    order: z.number().int(),
    org: z.string(),
    orgUrl: z.url().optional(),
    period: z.string().optional(),
    team: z.string().optional(),
    problem: z.string(),
    stack: z.array(z.string()).min(1),
    outcomes: z.array(z.object({ value: z.string(), label: z.string() })).default([]),
  }),
});

const posts = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: '**/[^_]*.md' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { profile, experience, education, projects, posts };
