import { ApiKeyStrategy } from '../src/security/auth/api-key-strategy';
import { SecurityConfig } from '../src/config/security';

/**
 * CLI utility to generate high-entropy API Keys.
 *
 * Usage:
 * ```bash
 * ts-node scripts/generate-api-key.ts
 * ```
 */
async function generateKey(): Promise<void> {
  const config: SecurityConfig = {
    apiKeySecret: process.env.API_KEY_SECRET ?? 'test-api-key-secret-min-32-characters-long',
  } as any;

  const strategy = new ApiKeyStrategy(config);
  try {
    const key = strategy.generateApiKey();
    console.log('\n--- Generated API Key ---');
    console.log(`API Key: ${key}`);
    console.log('\nInstructions:');
    console.log('1. Append this key to API_KEY_SECRET in your .env file:');
    console.log(`   API_KEY_SECRET="${config.apiKeySecret},${key}"`);
    console.log('2. Send this key in the X-API-Key header to authenticate incoming requests.\n');
  } catch (err: any) {
    console.error(`[Generate-API-Key] API Key generation failed: ${err.message}`);
  }
}

if (require.main === module) {
  generateKey().then(() => process.exit(0));
}

export { generateKey };
