import { NextResponse } from 'next/server';
import { verifyAdminPassword, createSessionCookieValue } from '@/lib/auth-service';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    const isValid = verifyAdminPassword(password);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid admin password' }, { status: 401 });
    }

    const sessionValue = createSessionCookieValue();
    const response = NextResponse.json({ success: true, message: 'Authenticated successfully' });

    response.cookies.set('tmu_admin_session', sessionValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (err) {
    return NextResponse.json({ error: 'Authentication failed', details: String(err) }, { status: 500 });
  }
}
