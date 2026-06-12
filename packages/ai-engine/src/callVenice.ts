import type { AgentRole } from '@trueengage/shared';
import type { z } from 'zod';

export interface VeniceConfig {
  apiKey?: string;
  apiUrl?: string;
}

const ROLE_PROMPTS: Record<AgentRole, string> = {
  campaign:
    'You are the TrueEngage Campaign Agent. Validate and structure creator campaign requirements into clear, verifiable task rules. Respond ONLY with valid JSON.',
  verification:
    'You are the TrueEngage Venice Verification Agent. Analyze participant proof submissions against campaign requirements. Evaluate authenticity, content quality, requirement matching, and spam risk. Respond ONLY with valid JSON matching the required schema.',
  payment:
    'You are the TrueEngage Payment Agent. Confirm payment readiness based on verification results and campaign budget. Respond ONLY with valid JSON.',
};

export async function callVenice<T>(
  config: VeniceConfig,
  role: AgentRole,
  input: unknown,
  schema: z.ZodType<T>,
  fallback: () => T,
): Promise<T> {
  if (!config.apiKey) {
    console.warn(`[venice:${role}] API key not set — using fallback`);
    return fallback();
  }

  try {
    const response = await fetch(config.apiUrl ?? 'https://api.venice.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'venice-uncensored',
        messages: [
          { role: 'system', content: ROLE_PROMPTS[role] },
          { role: 'user', content: JSON.stringify(input) },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      console.warn(`[venice:${role}] API error ${response.status} — fallback`);
      return fallback();
    }

    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return fallback();

    const parsed = schema.safeParse(JSON.parse(content));
    if (parsed.success) return parsed.data;
  } catch (err) {
    console.warn(`[venice:${role}] failed — fallback`, err);
  }

  return fallback();
}
