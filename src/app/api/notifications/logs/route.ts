import { NextResponse } from 'next/server';
import { getNotificationLogsAsync, clearNotificationLogs } from '@/lib/notification-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const logs = await getNotificationLogsAsync();
    return NextResponse.json(logs, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch notification logs', details: String(err) }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    clearNotificationLogs();
    return NextResponse.json({ success: true, message: 'Notification logs cleared' });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to clear notification logs', details: String(err) }, { status: 500 });
  }
}
