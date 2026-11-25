import fs from 'fs';
import path from 'path';
import os from 'os';
import nodemailer from 'nodemailer';
import {
  saveNotificationSettingsToDynamoDB,
  getNotificationSettingsFromDynamoDB,
  saveNotificationLogsToDynamoDB,
  getNotificationLogsFromDynamoDB,
} from '@/lib/dynamodb';

export interface NotificationSettings {
  adminEmail: string;
  notifyOnComment: boolean;
  notifyOnLike: boolean;
  notifyOnSubscriber: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  senderName?: string;
}

export interface NotificationLog {
  id: string;
  type: 'comment' | 'like' | 'subscriber' | 'test';
  title: string;
  message: string;
  recipient: string;
  status: 'sent' | 'failed' | 'logged';
  timestamp: string;
  details?: Record<string, unknown>;
}

const SETTINGS_FILE = path.join(process.cwd(), 'src/data/notification-settings.json');
const TMP_SETTINGS_FILE = path.join(os.tmpdir(), 'tmu_notification_settings.json');

const LOGS_FILE = path.join(process.cwd(), 'src/data/notification-logs.json');
const TMP_LOGS_FILE = path.join(os.tmpdir(), 'tmu_notification_logs.json');

const defaultSettings: NotificationSettings = {
  adminEmail:
    process.env.ADMIN_NOTIFICATION_EMAIL ||
    process.env.ADMIN_EMAIL ||
    'mindupgrade.support@gmail.com',
  notifyOnComment: true,
  notifyOnLike: true,
  notifyOnSubscriber: true,
  smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
  smtpPort: Number(process.env.SMTP_PORT) || 465,
  smtpUser: process.env.SMTP_USER || 'mindupgrade.support@gmail.com',
  smtpPass: process.env.SMTP_PASS || '',
  senderName: 'The Mind Upgrade',
};

// In-memory cache for fast Lambda response
let memorySettingsCache: NotificationSettings | null = null;

// Synchronous get settings (checks memory, tmp, disk, env)
export function getNotificationSettings(): NotificationSettings {
  if (memorySettingsCache) {
    return memorySettingsCache;
  }

  let loaded: Partial<NotificationSettings> = {};

  // 1. Try TMP_SETTINGS_FILE (writable on Lambda)
  try {
    if (fs.existsSync(TMP_SETTINGS_FILE)) {
      const data = fs.readFileSync(TMP_SETTINGS_FILE, 'utf-8');
      loaded = JSON.parse(data);
    }
  } catch (err) {
    console.warn('Notice reading tmp notification settings:', err);
  }

  // 2. Try SETTINGS_FILE (bundled read-only)
  if (!loaded.adminEmail) {
    try {
      if (fs.existsSync(SETTINGS_FILE)) {
        const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
        loaded = JSON.parse(data);
      }
    } catch {}
  }

  // 3. Fallback / env overrides
  const finalSettings: NotificationSettings = {
    ...defaultSettings,
    ...loaded,
    adminEmail: loaded.adminEmail || defaultSettings.adminEmail,
    smtpHost: loaded.smtpHost || process.env.SMTP_HOST || defaultSettings.smtpHost,
    smtpPort: loaded.smtpPort || Number(process.env.SMTP_PORT) || defaultSettings.smtpPort,
    smtpUser: loaded.smtpUser || process.env.SMTP_USER || loaded.adminEmail || defaultSettings.adminEmail,
    smtpPass: loaded.smtpPass || process.env.SMTP_PASS || '',
  };

  memorySettingsCache = finalSettings;
  return finalSettings;
}

// Asynchronous get settings (also checks DynamoDB)
export async function getNotificationSettingsAsync(): Promise<NotificationSettings> {
  // Check DynamoDB first if configured
  try {
    const dynamoSettings = await getNotificationSettingsFromDynamoDB();
    if (dynamoSettings && dynamoSettings.adminEmail) {
      const merged: NotificationSettings = {
        ...getNotificationSettings(),
        ...(dynamoSettings as unknown as Partial<NotificationSettings>),
      };
      memorySettingsCache = merged;
      // Mirror to tmp file for sync access
      try {
        fs.writeFileSync(TMP_SETTINGS_FILE, JSON.stringify(merged, null, 2), 'utf-8');
      } catch {}
      return merged;
    }
  } catch (err) {
    console.warn('Notice loading notification settings from DynamoDB:', err);
  }

  return getNotificationSettings();
}

// Get sanitized settings for client (password masked)
export function getSanitizedNotificationSettings(customSettings?: NotificationSettings): NotificationSettings {
  const settings = customSettings || getNotificationSettings();
  const hasPass = Boolean(settings.smtpPass || process.env.SMTP_PASS);
  return {
    ...settings,
    smtpPass: hasPass ? '••••••••' : '',
  };
}

// Synchronous save settings (writes to /tmp, tries disk safely without throwing on read-only Lambda)
export function saveNotificationSettings(settings: NotificationSettings): NotificationSettings {
  const existing = getNotificationSettings();
  
  // Preserve existing password if user didn't enter a new one
  let finalPass = settings.smtpPass;
  if (!finalPass || finalPass === '••••••••') {
    finalPass = existing.smtpPass || process.env.SMTP_PASS || '';
  }

  // Clean spaces from Gmail App Password if needed
  if (finalPass && (settings.smtpHost?.includes('gmail.com') || !settings.smtpHost)) {
    finalPass = finalPass.replace(/\s+/g, '');
  }

  const updated: NotificationSettings = {
    ...existing,
    ...settings,
    smtpHost: settings.smtpHost || 'smtp.gmail.com',
    smtpPort: Number(settings.smtpPort) || 465,
    smtpUser: settings.smtpUser || settings.adminEmail,
    smtpPass: finalPass,
  };

  memorySettingsCache = updated;

  // 1. Write to TMP_SETTINGS_FILE (always writable on AWS Lambda / Amplify)
  try {
    fs.writeFileSync(TMP_SETTINGS_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving to tmp notification settings:', err);
  }

  // 2. Try writing to local project file (works on dev machine, silently ignored on read-only Lambda)
  try {
    const dir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch {
    // Read-only filesystem in serverless Lambda - completely expected
  }

  return updated;
}

// Asynchronous save settings (writes to /tmp and permanently saves to DynamoDB)
export async function saveNotificationSettingsAsync(settings: NotificationSettings): Promise<NotificationSettings> {
  const updated = saveNotificationSettings(settings);

  // Persist to DynamoDB so all serverless instances and future deployments share it
  try {
    await saveNotificationSettingsToDynamoDB({
      adminEmail: updated.adminEmail,
      notifyOnComment: updated.notifyOnComment,
      notifyOnLike: updated.notifyOnLike,
      notifyOnSubscriber: updated.notifyOnSubscriber,
      smtpHost: updated.smtpHost,
      smtpPort: updated.smtpPort,
      smtpUser: updated.smtpUser,
      smtpPass: updated.smtpPass,
      senderName: updated.senderName,
    });
  } catch (err) {
    console.warn('Notice saving notification settings to DynamoDB:', err);
  }

  return updated;
}

// Get logs (checks tmp first, then disk)
export function getNotificationLogs(): NotificationLog[] {
  try {
    if (fs.existsSync(TMP_LOGS_FILE)) {
      return JSON.parse(fs.readFileSync(TMP_LOGS_FILE, 'utf-8'));
    }
    if (fs.existsSync(LOGS_FILE)) {
      return JSON.parse(fs.readFileSync(LOGS_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Error reading notification logs:', err);
  }
  return [];
}

// Asynchronous get logs (syncs from DynamoDB so all serverless instances see it)
export async function getNotificationLogsAsync(): Promise<NotificationLog[]> {
  try {
    const dynamoLogs = await getNotificationLogsFromDynamoDB();
    if (dynamoLogs && Array.isArray(dynamoLogs) && dynamoLogs.length > 0) {
      // Mirror to tmp file for sync reads
      try {
        fs.writeFileSync(TMP_LOGS_FILE, JSON.stringify(dynamoLogs, null, 2), 'utf-8');
      } catch {}
      return dynamoLogs as unknown as NotificationLog[];
    }
  } catch (err) {
    console.warn('Notice reading notification logs from DynamoDB:', err);
  }

  return getNotificationLogs();
}

// Clear logs
export function clearNotificationLogs(): void {
  try {
    fs.writeFileSync(TMP_LOGS_FILE, JSON.stringify([], null, 2), 'utf-8');
  } catch {}

  try {
    const dir = path.dirname(LOGS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LOGS_FILE, JSON.stringify([], null, 2), 'utf-8');
  } catch {}

  saveNotificationLogsToDynamoDB([]).catch(() => {});
}

// Append log
function addNotificationLog(log: Omit<NotificationLog, 'id' | 'timestamp'>): NotificationLog {
  const newLog: NotificationLog = {
    ...log,
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
  };

  try {
    const logs = getNotificationLogs();
    logs.unshift(newLog);
    const trimmed = logs.slice(0, 100);

    // Save to tmp (always succeeds)
    try {
      fs.writeFileSync(TMP_LOGS_FILE, JSON.stringify(trimmed, null, 2), 'utf-8');
    } catch {}

    // Save to disk if possible
    try {
      const dir = path.dirname(LOGS_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(LOGS_FILE, JSON.stringify(trimmed, null, 2), 'utf-8');
    } catch {}

    // Persist to DynamoDB across all serverless containers
    saveNotificationLogsToDynamoDB(trimmed as unknown as Record<string, unknown>[]).catch(() => {});
  } catch (err) {
    console.error('Error appending notification log:', err);
  }

  return newLog;
}

// Helper to create Nodemailer transporter
function createTransporter(settings: NotificationSettings) {
  const host = settings.smtpHost || process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(settings.smtpPort) || Number(process.env.SMTP_PORT) || 465;
  const user = settings.smtpUser || process.env.SMTP_USER || settings.adminEmail || 'mindupgrade.support@gmail.com';
  let pass = settings.smtpPass || process.env.SMTP_PASS;

  if (host && user && pass) {
    if (host.includes('gmail.com')) {
      pass = pass.replace(/\s+/g, '');
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user,
          pass,
        },
      });
    }

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }
  return null;
}

// Core notification dispatcher
export async function sendAdminNotification(params: {
  type: 'comment' | 'like' | 'subscriber' | 'test';
  title: string;
  message: string;
  details?: Record<string, unknown>;
}): Promise<{ success: boolean; log: NotificationLog; error?: string | null }> {
  const settings = getNotificationSettings();

  // Check event toggles
  if (params.type === 'comment' && !settings.notifyOnComment) {
    return {
      success: false,
      log: addNotificationLog({
        type: params.type,
        title: params.title,
        message: `${params.message} (Skipped: Comment notifications disabled)`,
        recipient: settings.adminEmail || 'Disabled',
        status: 'logged',
        details: params.details,
      }),
    };
  }

  if (params.type === 'like' && !settings.notifyOnLike) {
    return {
      success: false,
      log: addNotificationLog({
        type: params.type,
        title: params.title,
        message: `${params.message} (Skipped: Like notifications disabled)`,
        recipient: settings.adminEmail || 'Disabled',
        status: 'logged',
        details: params.details,
      }),
    };
  }

  if (params.type === 'subscriber' && !settings.notifyOnSubscriber) {
    return {
      success: false,
      log: addNotificationLog({
        type: params.type,
        title: params.title,
        message: `${params.message} (Skipped: Subscriber notifications disabled)`,
        recipient: settings.adminEmail || 'Disabled',
        status: 'logged',
        details: params.details,
      }),
    };
  }

  const recipient = settings.adminEmail;
  if (!recipient || !recipient.includes('@')) {
    const log = addNotificationLog({
      type: params.type,
      title: params.title,
      message: `${params.message} (No recipient email configured)`,
      recipient: 'Not Configured',
      status: 'failed',
      details: params.details,
    });
    return { success: false, log };
  }

  const transporter = createTransporter(settings);

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
          .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
          .header { background: linear-gradient(135deg, #4f46e5, #0284c7); padding: 24px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
          .header p { margin: 4px 0 0 0; font-size: 12px; opacity: 0.9; }
          .content { padding: 24px; }
          .badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 12px; }
          .badge-comment { background: #e0e7ff; color: #3730a3; }
          .badge-like { background: #ffe4e6; color: #9f1239; }
          .badge-subscriber { background: #dcfce7; color: #166534; }
          .badge-test { background: #f3e8ff; color: #6b21a8; }
          .title { font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0; }
          .message { font-size: 14px; line-height: 1.6; color: #334155; background: #f1f5f9; padding: 14px; border-radius: 10px; margin: 12px 0; border-left: 4px solid #4f46e5; }
          .footer { padding: 16px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
          .btn { display: inline-block; padding: 10px 20px; background: #4f46e5; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; border-radius: 8px; margin-top: 12px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h1>The Mind Upgrade</h1>
            <p>Admin Notification Alert</p>
          </div>
          <div class="content">
            <span class="badge badge-${params.type}">${params.type.toUpperCase()}</span>
            <h2 class="title">${params.title}</h2>
            <div class="message">${params.message}</div>
            <a href="http://themindupgrade.in/admin" class="btn">Open Admin Dashboard</a>
          </div>
          <div class="footer">
            Sent to <strong>${recipient}</strong> • You can configure your email notifications in your Admin Portal.
          </div>
        </div>
      </body>
    </html>
  `;

  let deliveryStatus: 'sent' | 'logged' | 'failed' = 'logged';
  let deliveryError: string | null = null;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"${settings.senderName || 'The Mind Upgrade'}" <${settings.smtpUser || recipient}>`,
        to: recipient,
        subject: `[The Mind Upgrade] ${params.title}`,
        text: `${params.title}\n\n${params.message}`,
        html: htmlBody,
      });
      deliveryStatus = 'sent';
      console.log(`Email notification successfully sent to ${recipient}`);
    } catch (err: any) {
      deliveryError = err?.message || String(err);
      console.error(`Failed to send email via SMTP to ${recipient}:`, err);
      deliveryStatus = 'failed';
    }
  } else {
    console.log(`Notification logged for ${recipient} (SMTP not configured, visible in Admin Inbox): ${params.title}`);
  }

  const log = addNotificationLog({
    type: params.type,
    title: params.title,
    message: deliveryError ? `${params.message} (Error: ${deliveryError})` : params.message,
    recipient,
    status: deliveryStatus,
    details: {
      ...(params.details || {}),
      ...(deliveryError ? { error: deliveryError } : {}),
    },
  });

  return {
    success: deliveryStatus === 'sent' || (!transporter && params.type !== 'test'),
    log,
    error: deliveryError,
  };
}
