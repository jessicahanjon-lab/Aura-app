// src/lib/aura-schema.ts
import { z } from 'zod';

export const AuraResultSchema = z.object({
  wallpaperDescription: z.string().min(10),
  colorStory: z.string(),
  moodTagline: z.string().max(60),
  topTip: z.string(),
  fontPairing: z.string(),
  lockscreenIdea: z.string(),
});

export type AuraResult = z.infer<typeof AuraResultSchema>;
