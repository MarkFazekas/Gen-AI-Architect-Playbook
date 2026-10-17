import { z } from 'zod';

export const patternSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string(),
  status: z.enum(['draft', 'published']),
});

export const patternListSchema = z.array(patternSchema);

export type Pattern = z.infer<typeof patternSchema>;
