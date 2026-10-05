import { NextResponse } from 'next/server';
import { getBlogsServer, saveBlogsServer } from '@/lib/blog-service';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const blogs = getBlogsServer();
    const index = blogs.findIndex((b) => b.id === id || b.slug === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    blogs[index].views = (blogs[index].views || 0) + 1;
    saveBlogsServer(blogs);

    return NextResponse.json({ success: true, views: blogs[index].views });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to increment view count', details: String(err) }, { status: 500 });
  }
}
