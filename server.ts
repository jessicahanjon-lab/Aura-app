// server.js
import express from 'express';
import cors from 'cors';
import { createUIMessageStream, createUIMessageStreamResponse } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { streamObject } from 'ai';
import { AuraResultSchema } from './src/lib/aura-schema.js';

const app = express();
app.use(cors());
app.use(express.json());

const STEPS = [
  "Analyzing personality matrix…",
  "Generating wallpaper variants…",
  "Composing color harmonics…",
  "Optimizing widget layout…",
  "Curating icon packs…",
  "Finalizing aesthetic pack…",
];

// ─── YOUR ORIGINAL MOODS ARRAY (complete) ───
const MOODS = [
  { id: "focused", label: "Focused", emoji: "🎯", desc: "Clean, distraction-free", gradient: "from-slate-900 via-blue-950 to-slate-900", accent: "#3b82f6", sub: "#60a5fa" },
  { id: "luxury", label: "Luxury", emoji: "✦", desc: "Gold, marble, prestige", gradient: "from-stone-950 via-yellow-950 to-stone-950", accent: "#d4a017", sub: "#f5c842" },
  { id: "calm", label: "Calm", emoji: "🌿", desc: "Nature, soft, breathable", gradient: "from-emerald-950 via-teal-900 to-slate-900", accent: "#34d399", sub: "#6ee7b7" },
  { id: "gaming", label: "Gaming", emoji: "⚡", desc: "Neon, electric, intense", gradient: "from-violet-950 via-purple-900 to-fuchsia-950", accent: "#a855f7", sub: "#c084fc" },
  { id: "night", label: "Night Mode", emoji: "🌙", desc: "OLED, deep dark, minimal", gradient: "from-black via-zinc-950 to-black", accent: "#71717a", sub: "#a1a1aa" },
  { id: "feminine", label: "Soft Feminine", emoji: "🌸", desc: "Blush, bloom, dreamy", gradient: "from-rose-950 via-pink-900 to-fuchsia-950", accent: "#f472b6", sub: "#f9a8d4" },
  { id: "masculine", label: "Masc Minimal", emoji: "◼", desc: "Bold, geometric, sharp", gradient: "from-zinc-950 via-stone-900 to-zinc-950", accent: "#e7e5e4", sub: "#d6d3d1" },
  { id: "cyber", label: "Cyber", emoji: "⬡", desc: "Glitch, neon, matrix", gradient: "from-black via-cyan-950 to-black", accent: "#06b6d4", sub: "#22d3ee" },
];

app.post('/api/generate-aura', async (req, res) => {
  const { moodId, answers } = req.body;

  const moodData = MOODS.find((m) => m.id === moodId);

  const prompt = `You are a phone aesthetic designer. Based on:
Mood: ${moodData?.label} (${moodData?.desc})
Personality quiz answers: ${JSON.stringify(answers)}

Generate a JSON object (ONLY JSON, no markdown, no backticks) with these keys:
- wallpaperDescription: string (2 sentences describing the ideal wallpaper)
- colorStory: string (1 sentence about the color philosophy)
- moodTagline: string (a short punchy tagline for this setup, max 8 words)
- topTip: string (one specific actionable setup tip)
- fontPairing: string (e.g., "SF Pro Display + Helvetica Neue")
- lockscreenIdea: string (describe the lockscreen concept in 1-2 sentences)`;

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      // Stream progress steps
      for (let i = 0; i < STEPS.length; i++) {
        writer.write({
          type: 'data-progress',
          id: `step-${i}`,
          data: {
            stepIndex: i,
            totalSteps: STEPS.length,
            message: STEPS[i],
            progress: Math.round(((i + 1) / STEPS.length) * 100),
            emoji: '✦',
          },
        });
        await new Promise(r => setTimeout(r, 380));
      }

      // Stream structured object (partial JSON)
      const result = streamObject({
        model: anthropic('claude-sonnet-4.5'),
        schema: AuraResultSchema,
        prompt,
        temperature: 0.75,
      });

      writer.merge(result.toUIMessageStream());
    },
  });

  return createUIMessageStreamResponse({ stream })(req, res);
});

// Health check
app.get('/', (req, res) => {
  res.send('AURA Streaming Server is running ✨');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 AURA server running on port ${PORT}`);
});
