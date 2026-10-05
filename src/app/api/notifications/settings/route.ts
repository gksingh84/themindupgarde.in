import { NextResponse } from 'next/server';
import {
  getSanitizedNotificationSettings,
  saveNotificationSettings,
} from '@/lib/notification-service';

export async function GET() {
  try {
    const settings = getSanitizedNotificationSettings();
    return NextResponse.json(settings);
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

    saveNotificationSettings({
      adminEmail: body.adminEmail.trim(),
      notifyOnComment: Boolean(body.notifyOnComment),
      notifyOnLike: Boolean(body.notifyOnLike),
      notifyOnSubscriber: Boolean(body.notifyOnSubscriber),
      smtpHost: body.smtpHost || '',
      smtpPort: Number(body.smtpPort) || 587,
      smtpUser: body.smtpUser || '',
      smtpPass: body.smtpPass || '',
    });

    const sanitized = getSanitizedNotificationSettings();
    return NextResponse.json(sanitized);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update notification settings', details: String(err) }, { status: 500 });
  }
}
