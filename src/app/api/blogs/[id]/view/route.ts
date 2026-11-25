import { NextResponse } from 'next/server';
import { incrementBlogViewsAsync } from '@/lib/blog-service';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const blog = await incrementBlogViewsAsync(id);

    if (!blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, views: blog.views });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to increment view count', details: String(err) }, { status: 500 });
  }
}
