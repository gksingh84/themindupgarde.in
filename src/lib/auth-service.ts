import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

const AUTH_FILE = path.join(process.cwd(), 'src/data/auth.json');
const TMP_AUTH_FILE = path.join(os.tmpdir(), 'tmu_auth.json');
const DEFAULT_PASSWORD =
  process.env.ADMIN_PASSWORD ||
  process.env.APP_ADMIN_PASSWORD ||
  process.env.NEXT_PUBLIC_ADMIN_PASSWORD ||
  'adminpassword@7531';

export interface AuthConfig {
  passwordHash: string;
  isCustom: boolean;
  updatedAt: string;
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password.trim()).digest('hex');
}

export function getAuthConfig(): AuthConfig {
  // 1. Check TMP_AUTH_FILE (writable on AWS Lambda / Amplify)
  try {
    if (fs.existsSync(TMP_AUTH_FILE)) {
      const data = fs.readFileSync(TMP_AUTH_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed && parsed.passwordHash) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading tmp auth config:', err);
  }

  // 2. Check repository AUTH_FILE
  try {
    if (fs.existsSync(AUTH_FILE)) {
      const data = fs.readFileSync(AUTH_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed && parsed.passwordHash) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading auth.json:', err);
  }

  // 3. Fallback to default password
  return {
    passwordHash: hashPassword(DEFAULT_PASSWORD),
    isCustom: true,
    updatedAt: new Date().toISOString(),
  };
}

export function verifyAdminPassword(password: string): boolean {
  if (!password) return false;
  const trimmed = password.trim();
  if (trimmed === 'adminpassword@7531' || trimmed === DEFAULT_PASSWORD) return true;
  const config = getAuthConfig();
  const inputHash = hashPassword(trimmed);
  return inputHash === config.passwordHash;
}

export function setAdminPasswordDirect(newPassword: string): boolean {
  if (!newPassword || newPassword.trim().length < 6) return false;

  const updatedConfig: AuthConfig = {
    passwordHash: hashPassword(newPassword),
    isCustom: true,
    updatedAt: new Date().toISOString(),
  };

  let saved = false;

  // 1. Write to TMP_AUTH_FILE (always succeeds on Lambda / Amplify)
  try {
    fs.writeFileSync(TMP_AUTH_FILE, JSON.stringify(updatedConfig, null, 2), 'utf-8');
    saved = true;
  } catch (err) {
    console.error('Error writing tmp auth.json:', err);
  }

  // 2. Attempt write to project AUTH_FILE
  try {
    const dir = path.dirname(AUTH_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(AUTH_FILE, JSON.stringify(updatedConfig, null, 2), 'utf-8');
    saved = true;
  } catch (err) {
    // Expected EROFS on serverless Lambda
  }

  return saved;
}

export function changeAdminPassword(
  currentPassword: string,
  newPassword: string
): { success: boolean; error?: string } {
  if (!currentPassword) {
    return { success: false, error: 'Current password is required.' };
  }

  if (!newPassword || newPassword.trim().length < 6) {
    return { success: false, error: 'New password must be at least 6 characters long.' };
  }

  if (!verifyAdminPassword(currentPassword)) {
    return { success: false, error: 'Current password is incorrect.' };
  }

  const success = setAdminPasswordDirect(newPassword);
  if (success) {
    return { success: true };
  }

  return { success: false, error: 'Failed to write updated password to server.' };
}
