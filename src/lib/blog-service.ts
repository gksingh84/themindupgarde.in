import fs from 'fs';
import path from 'path';
import os from 'os';
import { BlogPost, ArticleRevision } from '@/types/blog';
import initialBlogs from '@/data/blogs.json';
import { prisma } from '@/lib/prisma';
import { parseDate } from '@/lib/date-utils';

const DATA_FILE = path.join(process.cwd(), 'src/data/blogs.json');
const TMP_DATA_FILE = path.join(os.tmpdir(), 'tmu_blogs.json');

/**
 * Reads blogs synchronously from blogs.json fallback with scheduled post auto-publish logic.
 */
export function getBlogsServer(): BlogPost[] {
  let blogs: BlogPost[] = [];
  try {
    if (fs.existsSync(TMP_DATA_FILE)) {
      const fileData = fs.readFileSync(TMP_DATA_FILE, 'utf-8');
      blogs = JSON.parse(fileData);
    } else if (fs.existsSync(DATA_FILE)) {
      const fileData = fs.readFileSync(DATA_FILE, 'utf-8');
      blogs = JSON.parse(fileData);
    } else {
      blogs = initialBlogs as BlogPost[];
    }
  } catch (error) {
    console.error('Error reading blogs.json:', error);
    blogs = initialBlogs as BlogPost[];
  }

  // Auto-publish any scheduled posts whose scheduledAt has passed
  const now = new Date().toISOString();
  let updated = false;
  blogs = blogs.map((b) => {
    if (b.status === 'scheduled' && b.scheduledAt && b.scheduledAt <= now) {
      updated = true;
      return { ...b, status: 'published' };
    }
    return b;
  });

  if (updated) {
    saveBlogsServer(blogs);
  }

  // Sort blogs chronologically by publication date descending (latest first, backdated posts in historical order)
  blogs.sort((a, b) => {
    const timeB = parseDate(b.publishedAt).getTime();
    const timeA = parseDate(a.publishedAt).getTime();
    return timeB - timeA;
  });

  return blogs;
}

/**
 * Saves blogs synchronously to blogs.json fallback (and /tmp on serverless environments).
 */
export function saveBlogsServer(blogs: BlogPost[]): boolean {
  let saved = false;

  // 1. Always save to TMP_DATA_FILE (writable on AWS Lambda / Amplify)
  try {
    fs.writeFileSync(TMP_DATA_FILE, JSON.stringify(blogs, null, 2), 'utf-8');
    saved = true;
  } catch (err) {
    console.error('Error saving to tmp blogs:', err);
  }

  // 2. Also try writing to project DATA_FILE (works on local/persistent servers)
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(blogs, null, 2), 'utf-8');
    saved = true;
  } catch (error) {
    // EROFS is expected on serverless / read-only production lambda
  }

  return saved;
}

/**
 * Synchronous helper to find blog by slug (case-insensitive with URL decoding & aliases).
 */
export function getBlogBySlugServer(slug: string): BlogPost | undefined {
  if (!slug) return undefined;
  const decoded = decodeURIComponent(slug).toLowerCase().trim();
  const blogs = getBlogsServer();

  return blogs.find((b) => {
    const bSlug = (b.slug || '').toLowerCase().trim();
    const bId = (b.id || '').toLowerCase().trim();
    if (bSlug === decoded || bId === decoded) return true;

    // Backward-compatibility aliases for renamed or migrated slugs
    if (
      (decoded === 'pure-term-life-insurance-vs-endowment-ulip' || decoded === 'understanding-repo-rate') &&
      (b.id === '6' || bSlug === 'understanding-repo-rate' || bSlug === 'pure-term-life-insurance-vs-endowment-ulip')
    ) {
      return true;
    }
    if (
      (decoded === 'cash-reserve-ratio') &&
      (b.id === '1' || bSlug === 'cash-reserve-ratio')
    ) {
      return true;
    }
    return false;
  });
}

/**
 * Synchronous helper to find blog by ID.
 */
export function getBlogByIdServer(id: string): BlogPost | undefined {
  const blogs = getBlogsServer();
  return blogs.find((b) => b.id === id);
}

/**
 * Delete a blog post by id from both JSON and DB.
 */
export async function deleteBlogServer(id: string): Promise<boolean> {
  const blogs = getBlogsServer();
  const filtered = blogs.filter((b) => b.id !== id);
  const success = saveBlogsServer(filtered);

  if (process.env.DATABASE_URL) {
    try {
      await prisma.blogPost.deleteMany({ where: { id } });
    } catch (e) {
      console.warn('DB delete warning:', e);
    }
  }
  return success;
}

/**
 * Increment view count for an article.
 */
export function incrementBlogViews(slugOrId: string): number {
  const blogs = getBlogsServer();
  const blog = blogs.find((b) => b.slug === slugOrId || b.id === slugOrId);
  if (blog) {
    blog.views = (blog.views || 0) + 1;
    saveBlogsServer(blogs);
    return blog.views;
  }
  return 0;
}

/**
 * Increment like count for an article.
 */
export function incrementBlogLikes(slugOrId: string): number {
  const blogs = getBlogsServer();
  const blog = blogs.find((b) => b.slug === slugOrId || b.id === slugOrId);
  if (blog) {
    blog.likes = (blog.likes || 0) + 1;
    saveBlogsServer(blogs);
    return blog.likes;
  }
  return 0;
}

/**
 * Get popular articles sorted by view counts.
 */
export function getPopularBlogs(limit = 5): BlogPost[] {
  const blogs = getBlogsServer().filter((b) => b.status === 'published');
  return blogs.sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, limit);
}

/**
 * Get Editor's Picks.
 */
export function getEditorsPicks(limit = 4): BlogPost[] {
  const blogs = getBlogsServer().filter((b) => b.status === 'published');
  const picks = blogs.filter((b) => b.editorsPick);
  if (picks.length > 0) return picks.slice(0, limit);
  return blogs.slice(0, limit);
}

/**
 * Get Featured articles.
 */
export function getFeaturedArticles(limit = 4): BlogPost[] {
  const blogs = getBlogsServer().filter((b) => b.status === 'published');
  const featured = blogs.filter((b) => b.featured);
  if (featured.length > 0) return featured.slice(0, limit);
  return blogs.slice(0, limit);
}

/**
 * Full-text keyword and taxonomy search.
 */
export function searchArticles(query: string): BlogPost[] {
  if (!query || query.trim() === '') return [];
  const q = query.toLowerCase().trim();
  const blogs = getBlogsServer().filter((b) => b.status === 'published');

  return blogs.filter((b) => {
    const titleMatch = b.title.toLowerCase().includes(q);
    const excerptMatch = b.excerpt.toLowerCase().includes(q);
    const categoryMatch = b.category.toLowerCase().includes(q);
    const subcategoryMatch = b.subcategory?.toLowerCase().includes(q);
    const tagMatch = b.tags?.some((t) => t.toLowerCase().includes(q));
    const contentMatch = b.content.toLowerCase().includes(q);
    return titleMatch || excerptMatch || categoryMatch || subcategoryMatch || tagMatch || contentMatch;
  });
}

/**
 * Save an article revision snapshot.
 */
export function saveArticleRevision(articleId: string, revisionNote?: string): ArticleRevision | null {
  const blogs = getBlogsServer();
  const blog = blogs.find((b) => b.id === articleId);
  if (!blog) return null;

  const revision: ArticleRevision = {
    id: 'rev_' + Date.now(),
    articleId: blog.id,
    title: blog.title,
    excerpt: blog.excerpt,
    content: blog.content,
    authorName: blog.author.name,
    savedAt: new Date().toISOString(),
    revisionNote: revisionNote || 'Autosave snapshot',
  };

  if (!blog.revisions) {
    blog.revisions = [];
  }
  blog.revisions.unshift(revision);
  // Keep maximum 20 revisions
  if (blog.revisions.length > 20) {
    blog.revisions = blog.revisions.slice(0, 20);
  }

  saveBlogsServer(blogs);
  return revision;
}

/**
 * Restore an article revision.
 */
export function restoreArticleRevision(articleId: string, revisionId: string): BlogPost | null {
  const blogs = getBlogsServer();
  const blog = blogs.find((b) => b.id === articleId);
  if (!blog || !blog.revisions) return null;

  const revision = blog.revisions.find((r) => r.id === revisionId);
  if (!revision) return null;

  // Snapshot current state before restoring
  saveArticleRevision(articleId, 'Pre-restore backup snapshot');

  blog.title = revision.title;
  blog.excerpt = revision.excerpt;
  blog.content = revision.content;
  blog.updatedAt = new Date().toISOString();

  saveBlogsServer(blogs);
  return blog;
}

/**
 * Async PostgreSQL Prisma query with JSON file fallback.
 */
export async function getBlogsDb(): Promise<BlogPost[]> {
  try {
    if (process.env.DATABASE_URL) {
      const dbBlogs = await prisma.blogPost.findMany({
        orderBy: { createdAt: 'desc' },
      });

      if (dbBlogs && dbBlogs.length > 0) {
        return dbBlogs.map((b) => {
          const raw = b as any;
          return {
            id: raw.id,
            slug: raw.slug,
            title: raw.title,
            subtitle: raw.subtitle || undefined,
            excerpt: raw.excerpt,
            content: raw.content,
            coverImage: raw.coverImage,
            coverCaption: raw.coverCaption || undefined,
            category: raw.category,
            subcategory: raw.subcategory || undefined,
            tags: raw.tags,
            author: {
              name: raw.authorName,
              avatar: raw.authorAvatar,
              role: raw.authorRole,
            },
            publishedAt: raw.publishedAt,
            readTime: raw.readTime,
            status: raw.status as any,
            featured: raw.featured,
            editorsPick: raw.editorsPick,
            views: raw.views,
            likes: raw.likes,
            seo: {
              metaTitle: raw.metaTitle || undefined,
              metaDescription: raw.metaDescription || undefined,
              canonicalUrl: raw.canonicalUrl || undefined,
              ogImage: raw.ogImage || undefined,
            },
          };
        });
      }
    }
  } catch (error) {
    console.warn('PostgreSQL query notice (falling back to JSON store):', error);
  }

  return getBlogsServer();
}

/**
 * Async PostgreSQL blog creation / upsert with JSON file sync.
 */
export async function createOrUpdateBlogDb(blog: BlogPost): Promise<BlogPost> {
  const existing = getBlogsServer();
  const idx = existing.findIndex((b) => b.id === blog.id || b.slug === blog.slug);

  if (idx > -1) {
    // Snapshot revision if content changed
    if (existing[idx].content !== blog.content || existing[idx].title !== blog.title) {
      saveArticleRevision(existing[idx].id, 'Auto-version before update');
    }
    existing[idx] = { ...existing[idx], ...blog, updatedAt: new Date().toISOString() };
  } else {
    existing.push({
      ...blog,
      views: blog.views || 0,
      likes: blog.likes || 0,
      status: blog.status || 'published',
      publishedAt: blog.publishedAt || new Date().toISOString().split('T')[0],
    });
  }

  // Ensure chronological sort
  existing.sort((a, b) => {
    const timeB = parseDate(b.publishedAt).getTime();
    const timeA = parseDate(a.publishedAt).getTime();
    return timeB - timeA;
  });

  saveBlogsServer(existing);

  // If DATABASE_URL is configured, save to PostgreSQL
  try {
    if (process.env.DATABASE_URL) {
      await (prisma.blogPost as any).upsert({
        where: { slug: blog.slug },
        update: {
          title: blog.title,
          subtitle: blog.subtitle,
          excerpt: blog.excerpt,
          content: blog.content,
          coverImage: blog.coverImage,
          coverCaption: blog.coverCaption,
          category: blog.category,
          subcategory: blog.subcategory,
          tags: blog.tags,
          authorName: blog.author.name,
          authorAvatar: blog.author.avatar,
          authorRole: blog.author.role,
          publishedAt: blog.publishedAt,
          readTime: blog.readTime,
          status: blog.status,
          featured: Boolean(blog.featured),
          editorsPick: Boolean(blog.editorsPick),
          views: blog.views || 0,
          likes: blog.likes || 0,
          metaTitle: blog.seo?.metaTitle,
          metaDescription: blog.seo?.metaDescription,
          canonicalUrl: blog.seo?.canonicalUrl,
          ogImage: blog.seo?.ogImage,
        },
        create: {
          id: blog.id,
          slug: blog.slug,
          title: blog.title,
          subtitle: blog.subtitle,
          excerpt: blog.excerpt,
          content: blog.content,
          coverImage: blog.coverImage,
          coverCaption: blog.coverCaption,
          category: blog.category,
          subcategory: blog.subcategory,
          tags: blog.tags,
          authorName: blog.author.name,
          authorAvatar: blog.author.avatar,
          authorRole: blog.author.role,
          publishedAt: blog.publishedAt,
          readTime: blog.readTime,
          status: blog.status,
          featured: Boolean(blog.featured),
          editorsPick: Boolean(blog.editorsPick),
          views: blog.views || 0,
          likes: blog.likes || 0,
          metaTitle: blog.seo?.metaTitle,
          metaDescription: blog.seo?.metaDescription,
          canonicalUrl: blog.seo?.canonicalUrl,
          ogImage: blog.seo?.ogImage,
        },
      });
    }
  } catch (error) {
    console.warn('PostgreSQL write notice:', error);
  }

  return blog;
}
