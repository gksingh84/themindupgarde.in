import { NextResponse } from 'next/server';
import { sendAdminNotification, getNotificationSettings } from '@/lib/notification-service';

export async function POST() {
  try {
    const settings = getNotificationSettings();
    if (!settings.adminEmail || !settings.adminEmail.includes('@')) {
      return NextResponse.json({ error: 'Please set a valid Admin Email ID first.' }, { status: 400 });
    }

    const result = await sendAdminNotification({
      type: 'test',
      title: '🔔 Test Notification Alert',
      message: 'Congratulations! Your email notification service is active and working properly on The Mind Upgrade.',
      details: { testTime: new Date().toISOString() },
    });

    return NextResponse.json({
      success: true,
      message: `Test notification generated for ${settings.adminEmail}`,
      log: result.log,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to send test notification', details: String(err) }, { status: 500 });
  }
}
