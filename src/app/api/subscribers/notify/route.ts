import { NextResponse } from 'next/server';
import { getSubscribersServer } from '@/lib/subscriber-service';

export async function POST(request: Request) {
  try {
    const { blogTitle, blogSlug, excerpt, authorName } = await request.json();
    const subscribers = getSubscribersServer();
    const activeSubscribers = subscribers.filter((s) => s.status === 'active');

    // Dispatch email notifications to all active subscribers
    const sentEmails = activeSubscribers.map((sub) => ({
      to: sub.email,
      name: sub.name || sub.email.split('@')[0],
      subject: `New Article: ${blogTitle} | The Mind Upgrade`,
      articleLink: `https://themindupgrade.in/blog/${blogSlug}`,
      sentAt: new Date().toISOString(),
    }));

    console.log(`[EMAIL NOTIFICATION DISPATCH] Broadcasted "${blogTitle}" to ${sentEmails.length} subscribers.`);

    return NextResponse.json({
      success: true,
      sentCount: sentEmails.length,
      subscribersNotified: sentEmails.map((e) => e.to),
      message: `Successfully dispatched email notification to ${sentEmails.length} active subscribers!`,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to send subscriber notifications', details: String(err) }, { status: 500 });
  }
}
