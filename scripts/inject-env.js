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
];

const envLines = [];
for (const key of envKeys) {
  const val = process.env[key];
  if (val && typeof val === 'string' && val.trim() !== '') {
    envLines.push(`${key}=${val.trim()}`);
  }
}

// Ensure ADMIN_PASSWORD and NEXT_PUBLIC_ADMIN_PASSWORD always default to adminpassword@7531 if not provided
if (!envLines.some((l) => l.startsWith('ADMIN_PASSWORD='))) {
  envLines.push(`ADMIN_PASSWORD=${process.env.ADMIN_PASSWORD || 'adminpassword@7531'}`);
}
if (!envLines.some((l) => l.startsWith('NEXT_PUBLIC_ADMIN_PASSWORD='))) {
  envLines.push(`NEXT_PUBLIC_ADMIN_PASSWORD=${process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'adminpassword@7531'}`);
}

// Also capture any other key starting with APP_AWS_, DYNAMO, or TMU_
for (const [k, v] of Object.entries(process.env)) {
  if (
    (k.startsWith('APP_AWS_') || k.startsWith('DYNAMO') || k.startsWith('TMU_')) &&
    !envKeys.includes(k) &&
    v &&
    typeof v === 'string' &&
    v.trim() !== ''
  ) {
    envLines.push(`${k}=${v.trim()}`);
  }
}

if (envLines.length > 0) {
  const content = envLines.join('\n') + '\n';
  try {
    fs.writeFileSync(path.join(process.cwd(), '.env.production'), content, 'utf-8');
    console.log(`[inject-env] Successfully injected ${envLines.length} environment variables into .env.production`);
  } catch (err) {
    console.warn('[inject-env] Warning writing .env.production:', err);
  }
} else {
  console.log('[inject-env] Note: No specific DynamoDB keys present in current shell; will use existing .env if present.');
}
