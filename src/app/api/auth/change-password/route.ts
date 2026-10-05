import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { changeAdminPassword, verifySessionCookieValue, createSessionCookieValue } from '@/lib/auth-service';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('tmu_admin_session')?.value;
    const isAuthenticated = verifySessionCookieValue(sessionCookie);

    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized. Please log in first.' }, { status: 401 });
    }

    const { oldPassword, newPassword } = await request.json();

    if (!oldPassword || !newPassword) {
      return NextResponse.json({ error: 'Current password and new password are required' }, { status: 400 });
    }

    const result = changeAdminPassword(oldPassword, newPassword);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to change password' }, { status: 400 });
    }

    // Refresh session cookie with new password signature
    const newSessionValue = createSessionCookieValue();
    const response = NextResponse.json({ success: true, message: 'Password updated successfully' });

    response.cookies.set('tmu_admin_session', newSessionValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (err) {
    return NextResponse.json({ error: 'Failed to change password', details: String(err) }, { status: 500 });
  }
}
