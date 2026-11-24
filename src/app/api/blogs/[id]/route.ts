import { NextResponse } from 'next/server';
import {
  getBlogsServerAsync,
  getBlogBySlugServerAsync,
  saveBlogServerAsync,
  deleteBlogServer,
} from '@/lib/blog-service';
import { BlogPost } from '@/types/blog';
import { formatDateDDMMYYYY } from '@/lib/date-utils';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const blog = await getBlogBySlugServerAsync(id);

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
    const blogs = await getBlogsServerAsync();
    const index = blogs.findIndex((b) => b.id === id || b.slug === id);

    if (index === -1) {
      // If it doesn't exist, create it if minimum fields provided
      if (updates.title) {
        const newPost: BlogPost = {
          id,
          slug: updates.slug || `post-${Date.now()}`,
          title: updates.title,
          subtitle: updates.subtitle,
          excerpt: updates.excerpt || '',
          content: updates.content || '',
          category: updates.category || 'Personal Finance',
          subcategory: updates.subcategory,
          tags: updates.tags || [],
          coverImage: updates.coverImage || '/images/deep-work.svg',
          coverCaption: updates.coverCaption,
          publishedAt: updates.publishedAt ? formatDateDDMMYYYY(updates.publishedAt) : formatDateDDMMYYYY(new Date()),
          readTime: updates.readTime || '5 min read',
          status: updates.status || 'published',
          featured: Boolean(updates.featured),
          editorsPick: Boolean(updates.editorsPick),
          views: updates.views || 0,
          likes: updates.likes || 0,
          author: updates.author || {
            name: 'The Mind Upgrade Team',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MindUpgrade',
            role: 'Editorial Team',
          },
        };
        await saveBlogServerAsync(newPost);
        return NextResponse.json(newPost);
      }
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    const updatedBlog: BlogPost = {
      ...blogs[index],
      ...updates,
      publishedAt: updates.publishedAt ? formatDateDDMMYYYY(updates.publishedAt) : blogs[index].publishedAt,
    };

    await saveBlogServerAsync(updatedBlog);
    return NextResponse.json(updatedBlog);
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
    const success = await deleteBlogServer(id);

    return NextResponse.json({
      success,
      message: 'Blog deleted successfully',
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete blog', details: String(err) }, { status: 500 });
  }
}
