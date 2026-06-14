import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  CORS_EXTRA_ORIGINS: z.string().optional(),
  DATABASE_URL: z.string(),
  VENICE_API_KEY: z.string().optional(),
  VENICE_API_URL: z.string().default('https://api.venice.ai/api/v1/chat/completions'),
  ONESHOT_API_KEY: z.string().optional(),
  ONESHOT_API_SECRET: z
    .preprocess((v) => (v === '' || v === undefined ? undefined : v), z.string().optional()),
  ONESHOT_API_URL: z.string().default('https://api.1shotapi.com'),
  ONESHOT_METHOD_ID: z
    .preprocess((v) => (v === '' || v === undefined ? undefined : v), z.string().uuid().optional()),
  ONESHOT_DELEGATOR_METHOD_ID: z
    .preprocess((v) => (v === '' || v === undefined ? undefined : v), z.string().uuid().optional()),
  ONESHOT_WALLET_ID: z
    .preprocess((v) => (v === '' || v === undefined ? undefined : v), z.string().uuid().optional()),
  ONESHOT_RELAYER_URL: z.string().default('https://relayer.1shotapi.dev/relayers'),
  SEPOLIA_RPC_URL: z.string().default('https://ethereum-sepolia-rpc.publicnode.com'),
  CHAIN_ID: z.coerce.number().default(11155111),
  RELAYER_PRIVATE_KEY: z.string().optional(),
  USDC_ADDRESS: z.string().optional(),
  CAMPAIGN_MANAGER_ADDRESS: z.string().optional(),
  SUBMISSION_MANAGER_ADDRESS: z.string().optional(),
  REWARD_ESCROW_ADDRESS: z.string().optional(),
  PLATFORM_TREASURY_ADDRESS: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Invalid environment:', parsed.error.flatten());
    throw new Error('Invalid environment configuration');
  }
  return parsed.data;
}
