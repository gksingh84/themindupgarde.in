import fs from 'fs';
import path from 'path';
import { BlogPost } from '@/types/blog';
import initialBlogs from '@/data/blogs.json';
import { prisma } from '@/lib/prisma';

const DATA_FILE = path.join(process.cwd(), 'src/data/blogs.json');
const TMP_DATA_FILE = path.join('/tmp', 'blogs.json');

let memoryBlogsCache: BlogPost[] | null = null;

/**
 * Reads blogs synchronously with Vercel /tmp and memory fallback support.
 */
export function getBlogsServer(): BlogPost[] {
  if (memoryBlogsCache && memoryBlogsCache.length > 0) {
    return memoryBlogsCache;
  }

  // Check /tmp fallback (on Vercel read-only filesystem)
  try {
    if (fs.existsSync(TMP_DATA_FILE)) {
      const fileData = fs.readFileSync(TMP_DATA_FILE, 'utf-8');
      const parsed = JSON.parse(fileData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryBlogsCache = parsed;
        return memoryBlogsCache!;
      }
    }
  } catch (err) {
    console.error('Error reading /tmp/blogs.json:', err);
  }

  // Check src/data/blogs.json
  try {
    if (fs.existsSync(DATA_FILE)) {
      const fileData = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(fileData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryBlogsCache = parsed;
        return memoryBlogsCache!;
      }
    }
  } catch (error) {
    console.error('Error reading blogs.json:', error);
  }

  memoryBlogsCache = initialBlogs as BlogPost[];
  return memoryBlogsCache;
}

/**
 * Saves blogs synchronously with Vercel /tmp fallback support.
 */
export function saveBlogsServer(blogs: BlogPost[]): boolean {
  memoryBlogsCache = blogs;

  // 1. Try saving to src/data/blogs.json (local dev environment)
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(blogs, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.warn('Notice: Primary blogs.json read-only or unwritable (Vercel environment). Using /tmp storage:', error);
  }

  // 2. Fallback to /tmp/blogs.json (Vercel serverless environment)
  try {
    const tmpDir = path.dirname(TMP_DATA_FILE);
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    fs.writeFileSync(TMP_DATA_FILE, JSON.stringify(blogs, null, 2), 'utf-8');
    return true;
  } catch (tmpError) {
    console.error('Error saving to /tmp/blogs.json:', tmpError);
    return false;
  }
}

/**
 * Synchronous helper to find blog by slug.
 */
export function getBlogBySlugServer(slug: string): BlogPost | undefined {
  const blogs = getBlogsServer();
  return blogs.find((b) => b.slug === slug);
}

/**
 * Async PostgreSQL Prisma query with JSON file / memory fallback.
 */
export async function getBlogsDb(): Promise<BlogPost[]> {
  try {
    if (process.env.DATABASE_URL) {
      const dbBlogs = await prisma.blogPost.findMany({
        orderBy: { createdAt: 'desc' },
      });

      if (dbBlogs && dbBlogs.length > 0) {
        return dbBlogs.map((b) => ({
          id: b.id,
          slug: b.slug,
          title: b.title,
          excerpt: b.excerpt,
          content: b.content,
          coverImage: b.coverImage,
          category: b.category as any,
          tags: b.tags,
          author: {
            name: b.authorName,
            avatar: b.authorAvatar,
            role: b.authorRole,
          },
          publishedAt: b.publishedAt,
          readTime: b.readTime,
          status: b.status as any,
          featured: b.featured,
          views: b.views,
          likes: b.likes,
        }));
      }
    }
  } catch (error) {
    console.warn('PostgreSQL query notice (falling back to local store):', error);
  }

  return getBlogsServer();
}

/**
 * Async PostgreSQL blog creation / upsert with local store sync.
 */
export async function createOrUpdateBlogDb(blog: BlogPost): Promise<BlogPost> {
  // Always update local store
  const existing = getBlogsServer();
  const idx = existing.findIndex((b) => b.id === blog.id || b.slug === blog.slug);
  if (idx > -1) {
    existing[idx] = { ...existing[idx], ...blog };
  } else {
    existing.unshift(blog);
  }
  saveBlogsServer(existing);

  // If DATABASE_URL is configured, save to PostgreSQL
  try {
    if (process.env.DATABASE_URL) {
      await prisma.blogPost.upsert({
        where: { slug: blog.slug },
        update: {
          title: blog.title,
          excerpt: blog.excerpt,
          content: blog.content,
          coverImage: blog.coverImage,
          category: blog.category,
          tags: blog.tags,
          authorName: blog.author.name,
          authorAvatar: blog.author.avatar,
          authorRole: blog.author.role,
          publishedAt: blog.publishedAt,
          readTime: blog.readTime,
          status: blog.status,
          featured: Boolean(blog.featured),
          views: blog.views || 0,
          likes: blog.likes || 0,
        },
        create: {
          id: blog.id,
          slug: blog.slug,
          title: blog.title,
          excerpt: blog.excerpt,
          content: blog.content,
          coverImage: blog.coverImage,
          category: blog.category,
          tags: blog.tags,
          authorName: blog.author.name,
          authorAvatar: blog.author.avatar,
          authorRole: blog.author.role,
          publishedAt: blog.publishedAt,
          readTime: blog.readTime,
          status: blog.status,
          featured: Boolean(blog.featured),
          views: blog.views || 0,
          likes: blog.likes || 0,
        },
      });
    }
  } catch (error) {
    console.warn('PostgreSQL write notice:', error);
  }

  return blog;
}
