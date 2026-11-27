import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getBlogsServerAsync, saveBlogServerAsync } from '@/lib/blog-service';
import { BlogPost } from '@/types/blog';
import { formatDateDDMMYYYY, parseDate } from '@/lib/date-utils';
import { applyDynamoCredsHeader, isBlogItem } from '@/lib/dynamodb';

export async function GET(request: Request) {
  // If client provided credentials in header, configure runtime
  applyDynamoCredsHeader(request.headers.get('x-dynamo-creds'));

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const includeDrafts = searchParams.get('includeDrafts') === 'true';

  let blogs = await getBlogsServerAsync(true);
  blogs = blogs.filter((b) => isBlogItem(b));

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

  // Strip heavy HTML and raw base64 content from bulk API listing unless specifically requested
  const includeContent = searchParams.get('includeContent') === 'true';
  if (!includeContent) {
    blogs = blogs.map((b) => {
      const { content, ...rest } = b;
      return {
        ...rest,
        content: '',
      };
    });
  }

  return NextResponse.json(blogs);
}

export async function POST(request: Request) {
  try {
    applyDynamoCredsHeader(request.headers.get('x-dynamo-creds'));
    const newBlog: Partial<BlogPost> = await request.json();
    const blogs = await getBlogsServerAsync();

    const created: BlogPost = {
      id: newBlog.id || String(Date.now()),
      slug: newBlog.slug || (newBlog.title ? newBlog.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : `post-${Date.now()}`),
      title: newBlog.title || 'Untitled Post',
      subtitle: newBlog.subtitle?.trim() || undefined,
      excerpt: newBlog.excerpt || newBlog.subtitle || '',
      content: newBlog.content || '',
      category: newBlog.category || 'Personal Finance',
      subcategory: newBlog.subcategory?.trim() || undefined,
      tags: newBlog.tags || [],
      coverImage: newBlog.coverImage || '/images/deep-work.svg',
      coverCaption: newBlog.coverCaption?.trim() || undefined,
      publishedAt: newBlog.publishedAt ? formatDateDDMMYYYY(newBlog.publishedAt) : formatDateDDMMYYYY(new Date()),
      readTime: newBlog.readTime || '5 min read',
      status: newBlog.status || 'published',
      featured: Boolean(newBlog.featured),
      editorsPick: Boolean(newBlog.editorsPick),
      scheduledAt: newBlog.scheduledAt || undefined,
      views: 0,
      likes: 0,
      author: newBlog.author || {
        name: 'The Mind Upgrade Team',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MindUpgrade',
        role: 'Editorial Team',
      },
      seo: newBlog.seo || undefined,
    };

    // Check slug collision
    let slugCandidate = created.slug;
    let count = 1;
    while (blogs.some((b) => b.slug === slugCandidate && b.id !== created.id)) {
      slugCandidate = `${created.slug}-${count++}`;
    }
    created.slug = slugCandidate;

    // Save to DynamoDB and local fallback
    await saveBlogServerAsync(created);
    try {
      revalidatePath('/');
      revalidatePath('/admin');
    } catch {}

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
