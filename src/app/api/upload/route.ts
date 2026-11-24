import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 1. Attempt writing to public/uploads (local dev / persistent servers)
    try {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `${Date.now()}-${safeName}`;
      const filePath = path.join(uploadsDir, filename);

      fs.writeFileSync(filePath, buffer);

      const url = `/uploads/${filename}`;
      return NextResponse.json({ url, success: true });
    } catch {
      // 2. Fallback for AWS Amplify / serverless read-only Lambda
      // Return Base64 Data URI so uploads never fail on read-only environments
      const mimeType = file.type || 'image/jpeg';
      const base64 = buffer.toString('base64');
      const url = `data:${mimeType};base64,${base64}`;
      return NextResponse.json({ url, success: true });
    }
  } catch (err) {
    return NextResponse.json({ error: 'File upload failed', details: String(err) }, { status: 500 });
  }
}
