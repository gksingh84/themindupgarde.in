import { NextResponse } from 'next/server';
import { getBlogsServer, saveBlogsServer } from '@/lib/blog-service';
import { BlogPost } from '@/types/blog';
import { formatDateDDMMYYYY, parseDate } from '@/lib/date-utils';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const blogs = getBlogsServer();
  const blog = blogs.find((b) => b.id === id || b.slug === id);

  if (!blog) {
    return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
  }

  return NextResponse.json(blog);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates: Partial<BlogPost> = await request.json();
    const blogs = getBlogsServer();
    const index = blogs.findIndex((b) => b.id === id || b.slug === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    blogs[index] = {
      ...blogs[index],
      ...updates,
      publishedAt: updates.publishedAt ? formatDateDDMMYYYY(updates.publishedAt) : blogs[index].publishedAt,
    };

    // Keep blogs sorted chronologically by publication date
    blogs.sort((a, b) => {
      const dateB = parseDate(b.publishedAt).getTime();
      const dateA = parseDate(a.publishedAt).getTime();
      return dateB - dateA;
    });

    saveBlogsServer(blogs);
    return NextResponse.json(blogs[index]);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update blog', details: String(err) }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const blogs = getBlogsServer();
    const filtered = blogs.filter((b) => b.id !== id && b.slug !== id);

    if (blogs.length === filtered.length) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    saveBlogsServer(filtered);
    return NextResponse.json({ success: true, message: 'Blog deleted successfully' });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete blog', details: String(err) }, { status: 500 });
  }
}
