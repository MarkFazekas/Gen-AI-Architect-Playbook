import { z } from 'zod/mini';

export const patternSchema = z.object({
  id: z.string().check(z.minLength(1)),
  title: z.string().check(z.minLength(1)),
  summary: z.string(),
  status: z.enum(['draft', 'published']),
});

export const patternListSchema = z.array(patternSchema);

export type Pattern = z.infer<typeof patternSchema>;
