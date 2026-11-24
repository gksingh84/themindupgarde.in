import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const AUTH_FILE = path.join(process.cwd(), 'src/data/auth.json');
const DEFAULT_PASSWORD = process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';

export interface AuthConfig {
  passwordHash: string;
  isCustom: boolean;
  updatedAt: string;
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password.trim()).digest('hex');
}

export function getAuthConfig(): AuthConfig {
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

  // Fallback to default password
  return {
    passwordHash: hashPassword(DEFAULT_PASSWORD),
    isCustom: false,
    updatedAt: new Date().toISOString(),
  };
}

export function verifyAdminPassword(password: string): boolean {
  if (!password) return false;
  const config = getAuthConfig();
  const inputHash = hashPassword(password);

  // Match hashed password
  if (inputHash === config.passwordHash) {
    return true;
  }

  // Also support default password if not custom
  if (!config.isCustom && password.trim() === DEFAULT_PASSWORD) {
    return true;
  }

  return false;
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

  const updatedConfig: AuthConfig = {
    passwordHash: hashPassword(newPassword),
    isCustom: true,
    updatedAt: new Date().toISOString(),
  };

  try {
    const dir = path.dirname(AUTH_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(AUTH_FILE, JSON.stringify(updatedConfig, null, 2), 'utf-8');
    return { success: true };
  } catch (err: any) {
    console.error('Error writing auth.json:', err);
    return { success: false, error: 'Failed to write updated password to server.' };
  }
}
