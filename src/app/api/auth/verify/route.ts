import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionCookieValue } from '@/lib/auth-service';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('tmu_admin_session')?.value;
    const isAuthenticated = verifySessionCookieValue(sessionCookie);

    if (isAuthenticated) {
      return NextResponse.json({ authenticated: true });
    } else {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
  } catch (err) {
    return NextResponse.json({ authenticated: false, error: String(err) }, { status: 500 });
  }
}
