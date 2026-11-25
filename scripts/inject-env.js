/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const envKeys = [
  'APP_AWS_ACCESS_KEY_ID',
  'APP_AWS_SECRET_ACCESS_KEY',
  'APP_AWS_REGION',
  'DYNAMODB_TABLE_NAME',
  'TMU_DYNAMODB_TABLE_NAME',
  'DYNAMO_TABLE_NAME',
  'DYNAMO_REGION',
  'MY_AWS_REGION',
  'MY_AWS_ACCESS_KEY_ID',
  'MY_AWS_SECRET_ACCESS_KEY',
  'DYNAMO_ACCESS_KEY_ID',
  'DYNAMO_SECRET_ACCESS_KEY',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_REGION',
  'AWS_DEFAULT_REGION',
  'DATABASE_URL',
  'ADMIN_PASSWORD',
  'APP_ADMIN_PASSWORD',
  'NEXT_PUBLIC_ADMIN_PASSWORD',
  'ADMIN_NOTIFICATION_EMAIL',
  'ADMIN_EMAIL',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_FROM',
];

const envMap = new Map();
const envProdPath = path.join(process.cwd(), '.env.production');

// 1. Read existing .env.production if it exists so we do not overwrite keys injected by Amplify
if (fs.existsSync(envProdPath)) {
  try {
    const existing = fs.readFileSync(envProdPath, 'utf-8');
    for (const line of existing.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const idx = trimmed.indexOf('=');
        const k = trimmed.slice(0, idx).trim();
        const v = trimmed.slice(idx + 1).trim();
        if (k && v) {
          envMap.set(k, v);
        }
      }
    }
  } catch (e) {
    console.warn('[inject-env] Note reading existing .env.production:', e.message);
  }
}

// 2. Add process.env keys
for (const key of envKeys) {
  const val = process.env[key];
  if (val && typeof val === 'string' && val.trim() !== '') {
    envMap.set(key, val.trim());
  }
}

// 3. Fallback defaults for admin password and notifications
if (!envMap.has('ADMIN_PASSWORD') || !envMap.get('ADMIN_PASSWORD')) {
  envMap.set('ADMIN_PASSWORD', process.env.ADMIN_PASSWORD || 'adminpassword@7531');
}
if (!envMap.has('NEXT_PUBLIC_ADMIN_PASSWORD') || !envMap.get('NEXT_PUBLIC_ADMIN_PASSWORD')) {
  envMap.set('NEXT_PUBLIC_ADMIN_PASSWORD', process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'adminpassword@7531');
}
if (!envMap.has('ADMIN_NOTIFICATION_EMAIL') || !envMap.get('ADMIN_NOTIFICATION_EMAIL')) {
  envMap.set('ADMIN_NOTIFICATION_EMAIL', process.env.ADMIN_NOTIFICATION_EMAIL || 'mindupgrade.support@gmail.com');
}

// 4. Also capture any other key starting with APP_AWS_, DYNAMO, TMU_, or MY_AWS_
for (const [k, v] of Object.entries(process.env)) {
  if (
    (k.startsWith('APP_AWS_') || k.startsWith('DYNAMO') || k.startsWith('TMU_') || k.startsWith('MY_AWS_')) &&
    v &&
    typeof v === 'string' &&
    v.trim() !== ''
  ) {
    envMap.set(k, v.trim());
  }
}

if (envMap.size > 0) {
  const content = Array.from(envMap.entries()).map(([k, v]) => `${k}=${v}`).join('\n') + '\n';
  try {
    fs.writeFileSync(envProdPath, content, 'utf-8');
    console.log(`[inject-env] Successfully injected ${envMap.size} environment variables into .env.production`);
  } catch (err) {
    console.warn('[inject-env] Warning writing .env.production:', err);
  }
} else {
  console.log('[inject-env] Note: No specific DynamoDB keys present in current shell; will use existing .env if present.');
}
