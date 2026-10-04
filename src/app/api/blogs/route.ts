import { NextResponse } from 'next/server';
import { getBlogsServer, saveBlogsServer } from '@/lib/blog-service';
import { BlogPost } from '@/types/blog';
import { formatDateDDMMYYYY } from '@/lib/date-utils';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const includeDrafts = searchParams.get('includeDrafts') === 'true';

  let blogs = getBlogsServer();

  if (!includeDrafts) {
    blogs = blogs.filter((b) => b.status === 'published');
  }

  if (category && category !== 'All') {
    blogs = blogs.filter((b) => b.category.toLowerCase() === category.toLowerCase());
  }

  if (search) {
    const q = search.toLowerCase();
    blogs = blogs.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.excerpt.toLowerCase().includes(q) ||
        b.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  return NextResponse.json(blogs);
}

export async function POST(request: Request) {
  try {
    const newBlog: Partial<BlogPost> = await request.json();
    const blogs = getBlogsServer();

    const created: BlogPost = {
      id: newBlog.id || String(Date.now()),
      slug: newBlog.slug || (newBlog.title ? newBlog.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : `post-${Date.now()}`),
      title: newBlog.title || 'Untitled Post',
      excerpt: newBlog.excerpt || '',
      content: newBlog.content || '',
      category: newBlog.category || 'Personal Finance',
      tags: newBlog.tags || [],
      coverImage: newBlog.coverImage || '/images/deep-work.svg',
      publishedAt: newBlog.publishedAt ? formatDateDDMMYYYY(newBlog.publishedAt) : formatDateDDMMYYYY(new Date()),
      readTime: newBlog.readTime || '5 min read',
      status: newBlog.status || 'published',
      featured: Boolean(newBlog.featured),
      views: 0,
      likes: 0,
      author: newBlog.author || {
        name: 'The Mind Upgrade Team',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MindUpgrade',
        role: 'Editorial Team',
      },
    };

    // Check slug collision
    let slugCandidate = created.slug;
    let count = 1;
    while (blogs.some((b) => b.slug === slugCandidate)) {
      slugCandidate = `${created.slug}-${count++}`;
    }
    created.slug = slugCandidate;

    blogs.unshift(created);
    saveBlogsServer(blogs);

    // If published, trigger subscriber email notifications
    let notificationResult = null;
    if (created.status === 'published') {
      try {
        const notifyRes = await fetch(`${new URL(request.url).origin}/api/subscribers/notify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            blogTitle: created.title,
            blogSlug: created.slug,
            excerpt: created.excerpt,
            authorName: created.author.name,
          }),
        });
        notificationResult = await notifyRes.json();
      } catch (e) {
        console.error('Failed to trigger subscriber notification:', e);
      }
    }

    return NextResponse.json({ ...created, notification: notificationResult }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create post', details: String(err) }, { status: 500 });
  }
}
