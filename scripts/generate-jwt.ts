import { JwtStrategy } from '../src/security/auth/jwt-strategy';
import { SecurityConfig } from '../src/config/security';

/**
 * CLI utility to generate signed JWT tokens for development and testing.
 *
 * Usage:
 * ```bash
 * ts-node scripts/generate-jwt.ts [subject] [scopes...]
 * ```
 */
async function generateToken(): Promise<void> {
  const args = process.argv.slice(2);
  const sub = args[0] ?? 'test-user-001';
  const scopes = args.slice(1).length > 0 ? args.slice(1) : ['read:results', 'write:destinations'];

  const config: SecurityConfig = {
    jwtSecret: process.env.JWT_SECRET ?? 'test-jwt-secret-min-32-characters-long-abc',
    jwtAlgorithm: 'HS256',
    jwtExpiryHours: 24,
  } as any;

  const strategy = new JwtStrategy(config);
  try {
    const token = await strategy.sign({ sub, scope: scopes });
    console.log('\n--- Generated JWT Token ---');
    console.log(`Subject: ${sub}`);
    console.log(`Scopes : ${scopes.join(', ')}`);
    console.log(`Token  : ${token}\n`);
  } catch (err: any) {
    console.error(`[Generate-JWT] Token generation failed: ${err.message}`);
  }
}

if (require.main === module) {
  generateToken().then(() => process.exit(0));
}

export { generateToken };
