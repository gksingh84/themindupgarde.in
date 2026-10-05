import fs from 'fs';
import path from 'path';
import { BlogPost } from '@/types/blog';
import initialBlogs from '@/data/blogs.json';
import { prisma } from '@/lib/prisma';

const DATA_FILE = path.join(process.cwd(), 'src/data/blogs.json');

/**
 * Reads blogs synchronously from blogs.json fallback.
 */
export function getBlogsServer(): BlogPost[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const fileData = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(fileData);
    }
  } catch (error) {
    console.error('Error reading blogs.json:', error);
  }
  return initialBlogs as BlogPost[];
}

/**
 * Saves blogs synchronously to blogs.json fallback.
 */
export function saveBlogsServer(blogs: BlogPost[]): boolean {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(blogs, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error saving blogs.json:', error);
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
 * Async PostgreSQL Prisma query with JSON file fallback.
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
    console.warn('PostgreSQL query notice (falling back to JSON store):', error);
  }

  return getBlogsServer();
}

/**
 * Async PostgreSQL blog creation / upsert with JSON file sync.
 */
export async function createOrUpdateBlogDb(blog: BlogPost): Promise<BlogPost> {
  // Always update JSON fallback
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
