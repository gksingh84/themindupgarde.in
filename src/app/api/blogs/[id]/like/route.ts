import { NextResponse } from 'next/server';
import { getBlogsServer, saveBlogsServer } from '@/lib/blog-service';
import { sendAdminNotification } from '@/lib/notification-service';

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

    // Trigger admin email notification asynchronously
    sendAdminNotification({
      type: 'like',
      title: `❤️ New Like on "${blogs[index].title}"`,
      message: `Someone liked your article "${blogs[index].title}". Total likes: ${blogs[index].likes}`,
      details: {
        blogId: blogs[index].id,
        blogTitle: blogs[index].title,
        totalLikes: blogs[index].likes,
      },
    }).catch((err) => console.error('Notification dispatch error:', err));

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
