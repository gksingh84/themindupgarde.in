import fs from 'fs';
import path from 'path';
import os from 'os';
import { BlogPost, ArticleRevision } from '@/types/blog';
import initialBlogs from '@/data/blogs.json';
import { prisma } from '@/lib/prisma';
import { parseDate } from '@/lib/date-utils';
import {
  isDynamoDBConfigured,
  getAllBlogsFromDynamoDB,
  getBlogByIdOrSlugFromDynamoDB,
  saveBlogToDynamoDB,
  deleteBlogFromDynamoDB,
  seedDynamoDBIfEmpty,
  incrementBlogViewsInDynamoDB,
  incrementBlogLikesInDynamoDB,
  decrementBlogLikesInDynamoDB,
  resetAllStatsInDynamoDB,
} from '@/lib/dynamodb';

const DATA_FILE = path.join(process.cwd(), 'src/data/blogs.json');
const TMP_DATA_FILE = path.join(os.tmpdir(), 'tmu_blogs.json');

// In-memory cache for fast SSR response and minimizing DynamoDB RCUs
let cachedBlogs: BlogPost[] | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 60000; // 60 seconds in-memory cache

/**
 * Reads blogs asynchronously, prioritizing AWS DynamoDB if configured,
 * with automatic fallback to JSON file.
 */
export async function getBlogsServerAsync(forceRefresh = false): Promise<BlogPost[]> {
  const now = Date.now();
  if (!forceRefresh && cachedBlogs && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedBlogs;
  }

  if (isDynamoDBConfigured()) {
    try {
      await resetAllStatsInDynamoDB();
      const dynamoBlogs = await getAllBlogsFromDynamoDB();
      if (dynamoBlogs && dynamoBlogs.length > 0) {
        const targetBlogs = dynamoBlogs.filter((b) => b.id && !String(b.id).startsWith('__'));

        // Auto-publish any scheduled posts whose scheduledAt has passed
        const isoNow = new Date().toISOString();
        let updated = false;
        const processed = targetBlogs.map((b) => {
          if (b.status === 'scheduled' && b.scheduledAt && b.scheduledAt <= isoNow) {
            updated = true;
            return { ...b, status: 'published' as const };
          }
          return b;
        });

        // Sort chronologically (newest first)
        processed.sort((a, b) => {
          const timeB = parseDate(b.publishedAt).getTime();
          const timeA = parseDate(a.publishedAt).getTime();
          return timeB - timeA;
        });

        cachedBlogs = processed;
        lastCacheTime = now;

        if (updated) {
          // Asynchronously update published status in DynamoDB
          Promise.all(processed.filter((b) => b.status === 'published').map(saveBlogToDynamoDB)).catch(
            () => {}
          );
        }

        return processed;
      } else if (dynamoBlogs && dynamoBlogs.length === 0) {
        // Table exists and was scanned, but has 0 items -> Auto-seed with local blogs
        const local = getBlogsServer();
        seedDynamoDBIfEmpty(local).catch(() => {});
        cachedBlogs = local;
        lastCacheTime = now;
        return local;
      }
    } catch {
      // DynamoDB not ready or error -> continue to fallback smoothly
    }
  }

  // Fallback to local files
  const fallback = getBlogsServer();
  cachedBlogs = fallback;
  lastCacheTime = now;
  return fallback;
}

/**
 * Reads blogs synchronously from in-memory cache or blogs.json fallback.
 */
export function getBlogsServer(): BlogPost[] {
  if (cachedBlogs && cachedBlogs.length > 0) {
    return cachedBlogs;
  }

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

  // Sort blogs chronologically by publication date descending
  blogs.sort((a, b) => {
    const timeB = parseDate(b.publishedAt).getTime();
    const timeA = parseDate(a.publishedAt).getTime();
    return timeB - timeA;
  });

  cachedBlogs = blogs;
  lastCacheTime = Date.now();
  return blogs;
}

/**
 * Saves blogs synchronously to blogs.json fallback (and /tmp on serverless environments).
 */
export function saveBlogsServer(blogs: BlogPost[]): boolean {
  let saved = false;
  cachedBlogs = blogs;
  lastCacheTime = Date.now();

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
 * Saves or updates a single blog post across DynamoDB, in-memory cache, and fallback files.
 */
export async function saveBlogServerAsync(blog: BlogPost): Promise<boolean> {
  // 1. Save to DynamoDB if configured
  if (isDynamoDBConfigured()) {
    try {
      await saveBlogToDynamoDB(blog);
    } catch (e) {
      console.warn('DynamoDB save warning:', e);
    }
  }

  // 2. Update local state
  const current = getBlogsServer();
  const index = current.findIndex((b) => b.id === blog.id || b.slug === blog.slug);
  if (index > -1) {
    current[index] = blog;
  } else {
    current.unshift(blog);
  }

  // Keep sorted chronologically
  current.sort((a, b) => {
    const timeB = parseDate(b.publishedAt).getTime();
    const timeA = parseDate(a.publishedAt).getTime();
    return timeB - timeA;
  });

  saveBlogsServer(current);
  return true;
}

/**
 * Asynchronous helper to find blog by slug or ID with DynamoDB support.
 */
export async function getBlogBySlugServerAsync(slug: string): Promise<BlogPost | undefined> {
  if (!slug) return undefined;
  const decoded = decodeURIComponent(slug).toLowerCase().trim();

  // 1. Fast path: check memory cache first (0ms latency, zero DynamoDB round trips)
  const blogs = await getBlogsServerAsync();
  const match = blogs.find((b) => {
    const bSlug = (b.slug || '').toLowerCase().trim();
    const bId = (b.id || '').toLowerCase().trim();
    if (bSlug === decoded || bId === decoded) return true;
    if (
      decoded === 'pure-term-life-insurance-vs-endowment-ulip' &&
      (b.id === '7' || bSlug === 'pure-term-life-insurance-vs-endowment-ulip')
    ) {
      return true;
    }
    if (
      decoded === 'checklist-to-compare-term-insurance-plans-in-india' &&
      (b.id === '8' || b.id === '7' || bSlug === 'checklist-to-compare-term-insurance-plans-in-india')
    ) {
      return true;
    }
    return false;
  });
  if (match) return match;

  // 2. Fallback to direct query if not in current cache
  if (isDynamoDBConfigured()) {
    try {
      const fromDb = await getBlogByIdOrSlugFromDynamoDB(decoded);
      if (fromDb) return fromDb;
    } catch (e) {
      console.warn('DynamoDB getBlog warning:', e);
    }
  }

  return getBlogBySlugServer(slug);
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
      decoded === 'pure-term-life-insurance-vs-endowment-ulip' &&
      (b.id === '7' || bSlug === 'pure-term-life-insurance-vs-endowment-ulip')
    ) {
      return true;
    }
    if (
      decoded === 'checklist-to-compare-term-insurance-plans-in-india' &&
      (b.id === '8' || b.id === '7' || bSlug === 'checklist-to-compare-term-insurance-plans-in-india')
    ) {
      return true;
    }
    if (
      decoded === 'understanding-repo-rate' &&
      (b.id === '6' || bSlug === 'understanding-repo-rate')
    ) {
      return true;
    }
    if (
      decoded === 'cash-reserve-ratio' &&
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
 * Delete a blog post by id from DynamoDB, JSON and Prisma DB.
 */
export async function deleteBlogServer(id: string): Promise<boolean> {
  if (isDynamoDBConfigured()) {
    try {
      await deleteBlogFromDynamoDB(id);
    } catch (e) {
      console.warn('DynamoDB delete warning:', e);
    }
  }

  const blogs = getBlogsServer();
  const filtered = blogs.filter((b) => b.id !== id && b.slug !== id);
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
    if (isDynamoDBConfigured()) {
      saveBlogToDynamoDB(blog).catch(() => {});
    }
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
    if (isDynamoDBConfigured()) {
      saveBlogToDynamoDB(blog).catch(() => {});
    }
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
    const titleMatch = (b.title || '').toLowerCase().includes(q);
    const excerptMatch = (b.excerpt || '').toLowerCase().includes(q);
    const categoryMatch = (b.category || '').toLowerCase().includes(q);
    const subcategoryMatch = (b.subcategory || '').toLowerCase().includes(q);
    const tagMatch = Array.isArray(b.tags) && b.tags.some((t) => typeof t === 'string' && t.toLowerCase().includes(q));
    const contentMatch = (b.content || '').toLowerCase().includes(q);
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
  if (isDynamoDBConfigured()) {
    saveBlogToDynamoDB(blog).catch(() => {});
  }
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
  if (isDynamoDBConfigured()) {
    saveBlogToDynamoDB(blog).catch(() => {});
  }
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

  return getBlogsServerAsync();
}

/**
 * Async PostgreSQL blog creation / upsert with JSON file sync.
 */
export async function createOrUpdateBlogDb(blog: BlogPost): Promise<BlogPost> {
  await saveBlogServerAsync(blog);
  return blog;
}

/**
 * Increment blog views across DynamoDB, in-memory cache, and fallback files.
 */
export async function incrementBlogViewsAsync(idOrSlug: string): Promise<BlogPost | null> {
  const blogs = getBlogsServer();
  const index = blogs.findIndex((b) => b.id === idOrSlug || b.slug === idOrSlug);
  let targetId = index > -1 ? blogs[index].id : idOrSlug;

  let newViews: number | null = null;

  if (isDynamoDBConfigured()) {
    try {
      // Resolve actual primary key id if slug was passed
      const fromDb = await getBlogByIdOrSlugFromDynamoDB(idOrSlug);
      if (fromDb && fromDb.id) {
        targetId = fromDb.id;
      }
      newViews = await incrementBlogViewsInDynamoDB(targetId);
    } catch (e) {
      console.warn('DynamoDB view increment failed, falling back to local:', e);
    }
  }

  // Invalidate in-memory server cache so next fetch gets fresh counts
  cachedBlogs = null;
  lastCacheTime = 0;

  if (index > -1) {
    blogs[index].views = typeof newViews === 'number' ? newViews : (blogs[index].views || 0) + 1;
    saveBlogsServer(blogs);
    return blogs[index];
  } else if (typeof newViews === 'number') {
    const fromDb = await getBlogByIdOrSlugFromDynamoDB(targetId);
    if (fromDb) {
      fromDb.views = newViews;
      return fromDb;
    }
  }

  return null;
}

/**
 * Increment blog likes across DynamoDB, in-memory cache, and fallback files.
 */
export async function incrementBlogLikesAsync(idOrSlug: string): Promise<BlogPost | null> {
  const blogs = getBlogsServer();
  const index = blogs.findIndex((b) => b.id === idOrSlug || b.slug === idOrSlug);
  let targetId = index > -1 ? blogs[index].id : idOrSlug;

  let newLikes: number | null = null;

  if (isDynamoDBConfigured()) {
    try {
      const fromDb = await getBlogByIdOrSlugFromDynamoDB(idOrSlug);
      if (fromDb && fromDb.id) {
        targetId = fromDb.id;
      }
      newLikes = await incrementBlogLikesInDynamoDB(targetId);
    } catch (e) {
      console.warn('DynamoDB like increment failed, falling back to local:', e);
    }
  }

  // Invalidate in-memory server cache
  cachedBlogs = null;
  lastCacheTime = 0;

  if (index > -1) {
    blogs[index].likes = typeof newLikes === 'number' ? newLikes : (blogs[index].likes || 0) + 1;
    saveBlogsServer(blogs);
    return blogs[index];
  } else if (typeof newLikes === 'number') {
    const fromDb = await getBlogByIdOrSlugFromDynamoDB(targetId);
    if (fromDb) {
      fromDb.likes = newLikes;
      return fromDb;
    }
  }

  return null;
}

/**
 * Decrement blog likes across DynamoDB, in-memory cache, and fallback files.
 */
export async function decrementBlogLikesAsync(idOrSlug: string): Promise<BlogPost | null> {
  const blogs = getBlogsServer();
  const index = blogs.findIndex((b) => b.id === idOrSlug || b.slug === idOrSlug);
  let targetId = index > -1 ? blogs[index].id : idOrSlug;

  let newLikes: number | null = null;

  if (isDynamoDBConfigured()) {
    try {
      const fromDb = await getBlogByIdOrSlugFromDynamoDB(idOrSlug);
      if (fromDb && fromDb.id) {
        targetId = fromDb.id;
      }
      newLikes = await decrementBlogLikesInDynamoDB(targetId);
    } catch (e) {
      console.warn('DynamoDB like decrement failed, falling back to local:', e);
    }
  }

  // Invalidate in-memory server cache
  cachedBlogs = null;
  lastCacheTime = 0;

  if (index > -1) {
    blogs[index].likes = typeof newLikes === 'number' ? newLikes : Math.max(0, (blogs[index].likes || 0) - 1);
    saveBlogsServer(blogs);
    return blogs[index];
  } else if (typeof newLikes === 'number') {
    const fromDb = await getBlogByIdOrSlugFromDynamoDB(targetId);
    if (fromDb) {
      fromDb.likes = newLikes;
      return fromDb;
    }
  }

  return null;
}

/**
 * Force-reset all views and likes across DynamoDB, local fallback files, and memory cache.
 */
export async function resetAllBlogStatsServerAsync(): Promise<void> {
  if (isDynamoDBConfigured()) {
    try {
      await resetAllStatsInDynamoDB(true);
    } catch (e) {
      console.warn('DynamoDB force reset failed:', e);
    }
  }

  const blogs = getBlogsServer();
  const reset = blogs.map((b) => ({ ...b, views: 0, likes: 0 }));
  saveBlogsServer(reset);

  cachedBlogs = reset;
  lastCacheTime = Date.now();
}
