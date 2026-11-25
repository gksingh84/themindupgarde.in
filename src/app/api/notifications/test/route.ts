import { NextResponse } from 'next/server';
import { sendAdminNotification, getNotificationSettingsAsync } from '@/lib/notification-service';

export async function POST() {
  try {
    const settings = await getNotificationSettingsAsync();
    if (!settings.adminEmail || !settings.adminEmail.includes('@')) {
      return NextResponse.json({ error: 'Please set a valid Admin Email ID first.' }, { status: 400 });
    }

    if (!settings.smtpPass && !process.env.SMTP_PASS) {
      return NextResponse.json({
        error: 'SMTP Password / App Password is not set. Please expand Custom SMTP Settings below, enter your 16-character Google App Password, and click "Save Email Settings".',
      }, { status: 400 });
    }

    const result = await sendAdminNotification({
      type: 'test',
      title: '🔔 Test Notification Alert',
      message: 'Congratulations! Your email notification service is active and working properly on The Mind Upgrade.',
      details: { testTime: new Date().toISOString() },
    });

    if (result.error || result.log.status === 'failed') {
      return NextResponse.json({
        error: `SMTP Delivery Failed: ${result.error || 'Authentication rejected'}. Please check your 16-character Google App Password.`,
        log: result.log,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Test email notification successfully delivered to ${settings.adminEmail}!`,
      log: result.log,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to send test notification', details: String(err) }, { status: 500 });
  }
}
