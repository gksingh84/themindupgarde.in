import { NextResponse } from 'next/server';
import { incrementBlogLikesAsync, decrementBlogLikesAsync } from '@/lib/blog-service';
import { sendAdminNotification } from '@/lib/notification-service';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const blog = await incrementBlogLikesAsync(id);

    if (!blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    // Trigger admin email notification immediately before response so Lambda doesn't freeze
    try {
      await sendAdminNotification({
        type: 'like',
        title: `❤️ New Like on "${blog.title}"`,
        message: `Someone liked your article "${blog.title}". Total likes: ${blog.likes}`,
        details: {
          blogId: blog.id,
          blogTitle: blog.title,
          totalLikes: blog.likes,
        },
      });
    } catch (err) {
      console.error('Notification dispatch error on like:', err);
    }

    return NextResponse.json({ likes: blog.likes });
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
    const blog = await decrementBlogLikesAsync(id);

    if (!blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    return NextResponse.json({ likes: blog.likes });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to decrement likes', details: String(err) }, { status: 500 });
  }
}
