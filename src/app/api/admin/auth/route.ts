import { NextRequest, NextResponse } from 'next/server';
import { getAuthConfig, verifyAdminPassword, changeAdminPassword, setAdminPasswordDirect } from '@/lib/auth-service';

export async function GET() {
  const config = getAuthConfig();
  return NextResponse.json({
    isCustom: config.isCustom,
    updatedAt: config.updatedAt,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password, syncCustom } = body;

    if (!password) {
      return NextResponse.json({ success: false, error: 'Password is required' }, { status: 400 });
    }

    const isValid = verifyAdminPassword(password);
    if (isValid) {
      if (syncCustom) {
        setAdminPasswordDirect(password);
      }
      return NextResponse.json({ success: true, message: 'Authenticated successfully' });
    } else {
      return NextResponse.json({ success: false, error: 'Incorrect admin password' }, { status: 401 });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { currentPassword, newPassword, direct } = body;

    if (direct && newPassword && newPassword.length >= 6) {
      const ok = setAdminPasswordDirect(newPassword);
      return NextResponse.json({
        success: ok,
        message: 'Admin password updated.',
      });
    }

    const result = changeAdminPassword(currentPassword, newPassword);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Admin password successfully updated.',
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to update password.',
      }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message || 'Internal server error',
    }, { status: 500 });
  }
}
