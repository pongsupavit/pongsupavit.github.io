import { defineCollection, z } from "astro:content";

const parseDate = (value: unknown): Date => {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return new Date();
};

export const collections = {
  blog: defineCollection({
    type: "content",
    schema: z.object({
      title: z.string(),
      description: z.string().optional(),
      pubDate: z.date(),
    }),
  }),
  gitbook: defineCollection({
    type: "content",
    schema: z
      .object({
        title: z.string().optional(),
        description: z.string().optional(),
        summary: z.string().optional(),
        pubDate: z.union([z.string(), z.date()]).optional(),
        date: z.union([z.string(), z.date()]).optional(),
      })
      .transform((data) => ({
        title: data.title ?? "Untitled",
        description: data.description ?? data.summary,
        pubDate: parseDate(data.pubDate ?? data.date),
      })),
  }),
};
