import { NextResponse } from 'next/server';
import {
  getNotificationSettingsAsync,
  getSanitizedNotificationSettings,
  saveNotificationSettingsAsync,
} from '@/lib/notification-service';

export async function GET() {
  try {
    const settings = await getNotificationSettingsAsync();
    const sanitized = getSanitizedNotificationSettings(settings);
    return NextResponse.json(sanitized);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load notification settings', details: String(err) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (!body.adminEmail || !body.adminEmail.includes('@')) {
      return NextResponse.json({ error: 'A valid Admin Email ID is required' }, { status: 400 });
    }

    const updated = await saveNotificationSettingsAsync({
      adminEmail: body.adminEmail.trim(),
      notifyOnComment: Boolean(body.notifyOnComment),
      notifyOnLike: Boolean(body.notifyOnLike),
      notifyOnSubscriber: Boolean(body.notifyOnSubscriber),
      smtpHost: body.smtpHost || 'smtp.gmail.com',
      smtpPort: Number(body.smtpPort) || 465,
      smtpUser: body.smtpUser || body.adminEmail.trim(),
      smtpPass: body.smtpPass || '',
      senderName: body.senderName || 'The Mind Upgrade',
    });

    const sanitized = getSanitizedNotificationSettings(updated);
    return NextResponse.json(sanitized);
  } catch (err) {
    console.error('Error in PUT /api/notifications/settings:', err);
    return NextResponse.json({ error: 'Failed to update notification settings', details: String(err) }, { status: 500 });
  }
}
