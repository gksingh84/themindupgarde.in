import { NextResponse } from 'next/server';
import { getNotificationLogs, clearNotificationLogs } from '@/lib/notification-service';

export async function GET() {
  try {
    const logs = getNotificationLogs();
    return NextResponse.json(logs);
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
