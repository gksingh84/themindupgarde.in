import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';

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
const LOGS_FILE = path.join(process.cwd(), 'src/data/notification-logs.json');

const defaultSettings: NotificationSettings = {
  adminEmail: 'gaurav@themindupgrade.in',
  notifyOnComment: true,
  notifyOnLike: true,
  notifyOnSubscriber: true,
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: Number(process.env.SMTP_PORT) || 587,
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  senderName: 'The Mind Upgrade Notifications',
};

// Get settings (internal with plain credentials)
export function getNotificationSettings(): NotificationSettings {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
      return { ...defaultSettings, ...data };
    }
  } catch (err) {
    console.error('Error reading notification-settings.json:', err);
  }
  return defaultSettings;
}

// Get sanitized settings for client GET requests (password masked)
export function getSanitizedNotificationSettings(): NotificationSettings {
  const settings = getNotificationSettings();
  const hasPass = Boolean(settings.smtpPass || process.env.SMTP_PASS);
  return {
    ...settings,
    smtpPass: hasPass ? '••••••••' : '',
  };
}

// Save settings (preserves password if masked value passed)
export function saveNotificationSettings(settings: NotificationSettings): NotificationSettings {
  try {
    const existing = getNotificationSettings();
    const dir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    // Preserve existing password if user didn't enter a new one
    let finalPass = settings.smtpPass;
    if (!finalPass || finalPass === '••••••••') {
      finalPass = existing.smtpPass || '';
    }

    const updated = {
      ...existing,
      ...settings,
      smtpPass: finalPass,
    };

    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    return updated;
  } catch (err) {
    console.error('Error saving notification-settings.json:', err);
    throw err;
  }
}

// Get logs
export function getNotificationLogs(): NotificationLog[] {
  try {
    if (fs.existsSync(LOGS_FILE)) {
      return JSON.parse(fs.readFileSync(LOGS_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Error reading notification-logs.json:', err);
  }
  return [];
}

// Clear logs
export function clearNotificationLogs(): void {
  try {
    const dir = path.dirname(LOGS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LOGS_FILE, JSON.stringify([], null, 2), 'utf-8');
  } catch (err) {
    console.error('Error clearing notification-logs.json:', err);
  }
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
    // Keep max 100 recent logs
    const trimmed = logs.slice(0, 100);
    const dir = path.dirname(LOGS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LOGS_FILE, JSON.stringify(trimmed, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing notification-logs.json:', err);
  }

  return newLog;
}

// Helper to create Nodemailer transporter
function createTransporter(settings: NotificationSettings) {
  const host = settings.smtpHost || process.env.SMTP_HOST;
  const port = settings.smtpPort || Number(process.env.SMTP_PORT) || 587;
  const user = settings.smtpUser || process.env.SMTP_USER;
  const pass = settings.smtpPass || process.env.SMTP_PASS;

  if (host && user && pass) {
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
}): Promise<{ success: boolean; log: NotificationLog }> {
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
    } catch (err) {
      console.error(`Failed to send email via SMTP to ${recipient}:`, err);
      deliveryStatus = 'logged';
    }
  } else {
    console.log(`Notification logged for ${recipient} (SMTP not configured, visible in Admin Inbox): ${params.title}`);
  }

  const log = addNotificationLog({
    type: params.type,
    title: params.title,
    message: params.message,
    recipient,
    status: deliveryStatus,
    details: params.details,
  });

  return { success: true, log };
}
