import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const AUTH_FILE_PATH = path.join(process.cwd(), 'src/data/admin-auth.json');
const DEFAULT_PASSWORD = process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

interface AdminAuthData {
  passwordHash: string;
  salt: string;
  updatedAt: string;
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

function getAuthData(): AdminAuthData {
  try {
    if (fs.existsSync(AUTH_FILE_PATH)) {
      const fileContent = fs.readFileSync(AUTH_FILE_PATH, 'utf-8');
      const data = JSON.parse(fileContent) as AdminAuthData;
      if (data.passwordHash && data.salt) {
        return data;
      }
    }
  } catch (err) {
    console.error('Error reading admin auth file:', err);
  }

  // Fallback to default password hash
  const defaultSalt = 'tmu_default_salt_2026';
  const defaultHash = hashPassword(DEFAULT_PASSWORD, defaultSalt);
  return {
    passwordHash: defaultHash,
    salt: defaultSalt,
    updatedAt: new Date().toISOString(),
  };
}

function saveAuthData(data: AdminAuthData): void {
  try {
    const dir = path.dirname(AUTH_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(AUTH_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving admin auth file:', err);
    throw new Error('Failed to save password updates');
  }
}

export function verifyAdminPassword(password: string): boolean {
  if (!password) return false;
  const authData = getAuthData();
  const testHash = hashPassword(password, authData.salt);
  
  try {
    return crypto.timingSafeEqual(
      Buffer.from(testHash, 'hex'),
      Buffer.from(authData.passwordHash, 'hex')
    );
  } catch {
    return false;
  }
}

export function changeAdminPassword(oldPassword: string, newPassword: string): { success: boolean; error?: string } {
  if (!oldPassword || !newPassword) {
    return { success: false, error: 'Both old and new passwords are required.' };
  }

  if (newPassword.length < 6) {
    return { success: false, error: 'New password must be at least 6 characters long.' };
  }

  if (!verifyAdminPassword(oldPassword)) {
    return { success: false, error: 'Incorrect current password.' };
  }

  if (oldPassword === newPassword) {
    return { success: false, error: 'New password must be different from current password.' };
  }

  const newSalt = crypto.randomBytes(16).toString('hex');
  const newHash = hashPassword(newPassword, newSalt);

  const newAuthData: AdminAuthData = {
    passwordHash: newHash,
    salt: newSalt,
    updatedAt: new Date().toISOString(),
  };

  saveAuthData(newAuthData);
  return { success: true };
}

export function createSessionCookieValue(): string {
  const authData = getAuthData();
  const token = crypto.randomBytes(32).toString('hex');
  const timestamp = Date.now().toString();
  
  const payload = `${token}:${timestamp}`;
  const signature = crypto
    .createHmac('sha256', authData.passwordHash)
    .update(payload)
    .digest('hex');

  return `${payload}:${signature}`;
}

export function verifySessionCookieValue(cookieValue?: string): boolean {
  if (!cookieValue) return false;

  const parts = cookieValue.split(':');
  if (parts.length !== 3) return false;

  const [token, timestampStr, signature] = parts;
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return false;

  // Check expiration (24h)
  if (Date.now() - timestamp > SESSION_MAX_AGE_MS) {
    return false;
  }

  const authData = getAuthData();
  const payload = `${token}:${timestampStr}`;
  const expectedSignature = crypto
    .createHmac('sha256', authData.passwordHash)
    .update(payload)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch {
    return false;
  }
}
