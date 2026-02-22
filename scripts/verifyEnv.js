/**
 * Environment Verification Utility (#32)
 *
 * Checks that all required API keys are present and valid
 * for the current environment (dev/prod).
 *
 * Run: node scripts/verifyEnv.js
 */

const fs = require('fs');
const path = require('path');

const ENV_FILE =
  process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';

const REQUIRED_KEYS = [
  'MAPBOX_ACCESS_TOKEN',
  'FIREBASE_WEB_API_KEY',
  'FIREBASE_PROJECT_ID',
  'WORLDTIDES_API_KEY',
  'REVENUECAT_IOS_KEY',
  'REVENUECAT_ANDROID_KEY',
  'SENTRY_DSN',
  'AI_SPECIES_API_URL',
  'STRIPE_PUBLISHABLE_KEY',
  'AMAZON_ASSOCIATE_TAG',
];

const PLACEHOLDER_PATTERNS = [
  /^__.*__$/, // __PLACEHOLDER__
  /^pk\.dev_/, // dev placeholders
  /^dev_/,
  /^$/, // empty
];

function verify() {
  const envPath = path.resolve(__dirname, '..', ENV_FILE);

  if (!fs.existsSync(envPath)) {
    console.error(`❌ ${ENV_FILE} not found at ${envPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(envPath, 'utf8');
  const vars = {};

  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const [key, ...valueParts] = trimmed.split('=');
    vars[key.trim()] = valueParts.join('=').trim();
  });

  let errors = 0;
  let warnings = 0;

  REQUIRED_KEYS.forEach(key => {
    const value = vars[key];

    if (!value) {
      console.error(`❌ MISSING: ${key}`);
      errors++;
      return;
    }

    if (process.env.NODE_ENV === 'production') {
      const isPlaceholder = PLACEHOLDER_PATTERNS.some(p => p.test(value));
      if (isPlaceholder) {
        console.error(`❌ PLACEHOLDER in production: ${key}=${value}`);
        errors++;
        return;
      }
    }

    console.log(`✅ ${key} = ${value.substring(0, 8)}...`);
  });

  console.log(`\n--- Environment: ${ENV_FILE} ---`);
  console.log(`✅ ${REQUIRED_KEYS.length - errors} keys verified`);
  if (errors) console.log(`❌ ${errors} errors`);
  if (warnings) console.log(`⚠️  ${warnings} warnings`);

  if (errors > 0 && process.env.NODE_ENV === 'production') {
    console.error('\n🚫 Production deployment blocked — fix missing keys.');
    process.exit(1);
  }
}

verify();
