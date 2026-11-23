import { NextRequest, NextResponse } from 'next/server';
import { getWebsiteSettings, saveWebsiteSettings } from '@/lib/settings-service';

export async function GET() {
  const settings = getWebsiteSettings();
  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = saveWebsiteSettings(body);
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update settings' }, { status: 400 });
  }
}
