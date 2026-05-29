import { useState, useCallback } from 'react';
import type { AuraResult } from '../lib/aura-schema';

const BACKEND_URL = "https://aura-app-production-fb9c.up.railway.app";

interface GenerationProgress {
  stepIndex: number;
  totalSteps: number;
  message: string;
  progress: number;
}

export function useAuraGeneration() {
  const [object, setObject] = useState<Partial<AuraResult> | null>(null);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startGeneration = useCallback((mood: string, answers: Record<string, any>) => {
    setIsLoading(true);
    setError(null);
    setObject(null);
    setProgress(null);

    const generateAura = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            mood,
            answers,
          }),
        });

        if (!response.ok) {
          throw new Error(`Backend error: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let buffer = '';
        let stepIndex = 0;
        const totalSteps = 6;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim()) continue;

            // Handle server-sent events format
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.type === 'progress') {
                  setProgress({
                    stepIndex,
                    totalSteps,
                    message: data.message || 'Generating...',
                    progress: (stepIndex / totalSteps) * 100,
                  });
                  stepIndex++;
                } else if (data.type === 'chunk') {
                  setObject((prev) => ({
                    ...prev,
                    ...data.content,
                  }));
                } else if (data.type === 'complete') {
                  setObject(data.content);
                  setProgress({
                    stepIndex: totalSteps,
                    totalSteps,
                    message: 'Complete!',
                    progress: 100,
                  });
                }
              } catch (e) {
                console.error('Failed to parse streaming data:', e);
              }
            }
          }
        }

        setIsLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        setIsLoading(false);
        console.error('Generation failed:', err);
      }
    };

    generateAura();

    // Return cleanup function
    return () => {
      // Cleanup if needed
    };
  }, []);

  return {
    object,
    progress,
    isLoading,
    error,
    startGeneration,
  };
}
