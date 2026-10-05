import { NextResponse } from 'next/server';
import { getSubscribersServer, saveSubscribersServer, Subscriber } from '@/lib/subscriber-service';
import { formatDateDDMMYYYY } from '@/lib/date-utils';
import { sendAdminNotification } from '@/lib/notification-service';

export async function GET() {
  try {
    const subscribers = getSubscribersServer();
    return NextResponse.json(subscribers);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const subscribers = getSubscribersServer();
    const existing = subscribers.find((s) => s.email.toLowerCase() === email.toLowerCase());

    if (existing) {
      return NextResponse.json(existing, { status: 200 });
    }

    const newSub: Subscriber = {
      id: `sub_${Date.now()}`,
      email: email.trim().toLowerCase(),
      name: name || email.split('@')[0],
      subscribedAt: formatDateDDMMYYYY(new Date()),
      status: 'active',
    };

    subscribers.unshift(newSub);
    saveSubscribersServer(subscribers);

    // Trigger admin email notification asynchronously
    sendAdminNotification({
      type: 'subscriber',
      title: '📧 New Community Subscriber!',
      message: `${newSub.name} (${newSub.email}) joined your newsletter audience.`,
      details: {
        subscriberId: newSub.id,
        email: newSub.email,
        name: newSub.name,
      },
    }).catch((err) => console.error('Notification dispatch error:', err));

    return NextResponse.json(newSub, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to add subscriber' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const email = searchParams.get('email');

    let subscribers = getSubscribersServer();
    subscribers = subscribers.filter((s) => s.id !== id && s.email.toLowerCase() !== (email || '').toLowerCase());
    saveSubscribersServer(subscribers);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete subscriber' }, { status: 500 });
  }
}
