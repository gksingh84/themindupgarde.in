import { NextResponse } from 'next/server';
import { sendEditorialInquiryNotification } from '@/lib/notification-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Your full name is required.' }, { status: 400 });
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
    }

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'A message is required.' }, { status: 400 });
    }

    const cleanSubject = typeof subject === 'string' && subject.trim() ? subject.trim() : 'Editorial Inquiry';

    const result = await sendEditorialInquiryNotification({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: cleanSubject,
      message: message.trim(),
    });

    return NextResponse.json({
      success: true,
      message: 'Your editorial inquiry has been sent to mindupgrade.support@gmail.com.',
      log: result.log,
    });
  } catch (err: any) {
    console.error('Contact API Error:', err);
    return NextResponse.json(
      { error: 'Failed to process inquiry. Please try again or email mindupgrade.support@gmail.com directly.' },
      { status: 500 }
    );
  }
}
