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

    blogs[index].likes = (blogs[index].likes || 0) + 1;
    saveBlogsServer(blogs);

    return NextResponse.json({ likes: blogs[index].likes });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to increment likes', details: String(err) }, { status: 500 });
  }
}

export async function DELETE(
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

    blogs[index].likes = Math.max(0, (blogs[index].likes || 0) - 1);
    saveBlogsServer(blogs);

    return NextResponse.json({ likes: blogs[index].likes });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to decrement likes', details: String(err) }, { status: 500 });
  }
}
