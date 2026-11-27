import { BlogPost, Comment } from '@/types/blog';
import initialBlogs from '@/data/blogs.json';

const BOOKMARKS_KEY = 'tmu_bookmarks';
const LIKES_KEY = 'tmu_likes';
const ADMIN_AUTH_KEY = 'tmu_admin_auth';
const DELETED_BLOGS_KEY = 'tmu_deleted_blog_ids';
const CUSTOM_BLOGS_KEY = 'tmu_custom_blogs';

export const ClientStorage = {
  // Bookmarks
  getBookmarks(): string[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(BOOKMARKS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  toggleBookmark(slug: string): boolean {
    if (typeof window === 'undefined') return false;
    const bookmarks = this.getBookmarks();
    const index = bookmarks.indexOf(slug);
    let isBookmarked = false;
    if (index > -1) {
      bookmarks.splice(index, 1);
    } else {
      bookmarks.push(slug);
      isBookmarked = true;
    }
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
    try {
      window.dispatchEvent(new Event('tmu_bookmarks_updated'));
    } catch {}
    return isBookmarked;
  },
  clearAllBookmarks(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(BOOKMARKS_KEY);
      window.dispatchEvent(new Event('tmu_bookmarks_updated'));
    } catch {}
  },
  isBookmarked(slug: string): boolean {
    return this.getBookmarks().includes(slug);
  },

  // Liked Posts
  getLikedPosts(): string[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(LIKES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  addLikedPost(slug: string): boolean {
    if (typeof window === 'undefined') return false;
    const liked = this.getLikedPosts();
    if (!liked.includes(slug)) {
      liked.push(slug);
      localStorage.setItem(LIKES_KEY, JSON.stringify(liked));
      return true;
    }
    return false;
  },
  removeLikedPost(slug: string): boolean {
    if (typeof window === 'undefined') return false;
    const liked = this.getLikedPosts();
    const index = liked.indexOf(slug);
    if (index > -1) {
      liked.splice(index, 1);
      localStorage.setItem(LIKES_KEY, JSON.stringify(liked));
      return true;
    }
    return false;
  },
  isLiked(slug: string): boolean {
    return this.getLikedPosts().includes(slug);
  },

  // Admin Auth Session
  isAdminAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(ADMIN_AUTH_KEY) === 'true';
  },
  setAdminAuthenticated(auth: boolean): void {
    if (typeof window === 'undefined') return;
    if (auth) {
      localStorage.setItem(ADMIN_AUTH_KEY, 'true');
    } else {
      localStorage.removeItem(ADMIN_AUTH_KEY);
    }
  },
  getCustomAdminPassword(): string {
    if (typeof window === 'undefined') return '';
    const stored = localStorage.getItem('tmu_custom_admin_password') || '';
    if (stored === 'mindupgrade@7531' || stored === 'admin123') {
      localStorage.removeItem('tmu_custom_admin_password');
      return '';
    }
    return stored;
  },
  setCustomAdminPassword(password: string): void {
    if (typeof window === 'undefined') return;
    if (password && password !== 'mindupgrade@7531' && password !== 'admin123') {
      localStorage.setItem('tmu_custom_admin_password', password);
    } else {
      localStorage.removeItem('tmu_custom_admin_password');
    }
  },
  validateAdminPassword(entered: string): boolean {
    if (!entered) return false;
    const trimmed = entered.trim();
    if (trimmed === 'mindupgrade@7531' || trimmed === 'admin123') return false;
    if (trimmed === 'adminpassword@7531') return true;
    if (process.env.NEXT_PUBLIC_ADMIN_PASSWORD && trimmed === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) return true;
    const custom = this.getCustomAdminPassword();
    if (custom && trimmed === custom) return true;
    return false;
  },

  // Deleted Blogs Persistence
  getDeletedBlogIds(): string[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(DELETED_BLOGS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  markBlogDeleted(idOrSlug: string): void {
    if (typeof window === 'undefined') return;
    const deleted = this.getDeletedBlogIds();
    if (!deleted.includes(idOrSlug)) {
      deleted.push(idOrSlug);
      localStorage.setItem(DELETED_BLOGS_KEY, JSON.stringify(deleted));
    }
    // Also remove from custom blogs if it was there
    const custom = this.getCustomBlogs();
    if (custom[idOrSlug]) {
      delete custom[idOrSlug];
      localStorage.setItem(CUSTOM_BLOGS_KEY, JSON.stringify(custom));
    }
  },

  // Custom / Edited Blogs Persistence
  getCustomBlogs(): Record<string, BlogPost> {
    if (typeof window === 'undefined') return {};
    try {
      const data = localStorage.getItem(CUSTOM_BLOGS_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },
  saveBlog(blog: BlogPost): void {
    if (typeof window === 'undefined') return;
    const custom = this.getCustomBlogs();
    const key = blog.id || blog.slug;
    custom[key] = blog;
    localStorage.setItem(CUSTOM_BLOGS_KEY, JSON.stringify(custom));

    // Ensure it is removed from deleted list if re-saved
    const deleted = this.getDeletedBlogIds();
    const filtered = deleted.filter((d) => d !== blog.id && d !== blog.slug);
    localStorage.setItem(DELETED_BLOGS_KEY, JSON.stringify(filtered));
  },
  getCustomBlog(idOrSlug: string): BlogPost | undefined {
    if (typeof window === 'undefined') return undefined;
    const custom = this.getCustomBlogs();
    if (custom[idOrSlug]) return custom[idOrSlug];
    return Object.values(custom).find((b) => b.id === idOrSlug || b.slug === idOrSlug);
  },

  // Merged Blogs for Editorial Views
  getMergedBlogs(initialBlogs: BlogPost[] = []): BlogPost[] {
    if (typeof window === 'undefined') return initialBlogs;

    // One-time cleanup: remove any cached custom blogs that are invalid, ghost/untitled, or match initialBlogs
    try {
      const customMap = this.getCustomBlogs();
      const initialKeys = new Set(initialBlogs.map((b) => b.id));
      const initialSlugs = new Set(initialBlogs.map((b) => b.slug));
      let changed = false;
      for (const k in customMap) {
        const blog = customMap[k];
        if (
          !blog ||
          !blog.id ||
          String(blog.id).startsWith('__') ||
          String(blog.id).startsWith('subscriber#') ||
          String(blog.id).startsWith('comment#') ||
          (blog.title || '').trim().toLowerCase() === 'untitled article' ||
          (blog.title || '').trim().toLowerCase() === 'untitled post' ||
          (!blog.title && !blog.content && !blog.slug) ||
          (initialBlogs.length > 0 && (initialKeys.has(blog.id) || initialSlugs.has(blog.slug)))
        ) {
          delete customMap[k];
          changed = true;
        }
      }
      if (changed) {
        localStorage.setItem(CUSTOM_BLOGS_KEY, JSON.stringify(customMap));
      }
    } catch {}

    const customMap = this.getCustomBlogs();
    const deletedIds = this.getDeletedBlogIds();

    // When initialBlogs is provided from the server/DynamoDB, server data is authoritative!
    if (initialBlogs && initialBlogs.length > 0) {
      const initialKeys = new Set(initialBlogs.map((b) => b.id));
      const initialSlugs = new Set(initialBlogs.map((b) => b.slug));

      // Append any newly created blogs in offline/local storage that don't exist on server yet
      const offlineOnly: BlogPost[] = [];
      Object.values(customMap).forEach((customBlog) => {
        if (
          customBlog &&
          customBlog.id &&
          !initialKeys.has(customBlog.id) &&
          !initialSlugs.has(customBlog.slug) &&
          !deletedIds.includes(customBlog.id) &&
          !deletedIds.includes(customBlog.slug)
        ) {
          offlineOnly.push(customBlog);
        }
      });

      // Filter out deleted blogs
      const filtered = initialBlogs.filter(
        (b) => !deletedIds.includes(b.id) && !deletedIds.includes(b.slug)
      );

      return [...offlineOnly, ...filtered];
    }

    // Fallback when initialBlogs is empty
    return Object.values(customMap).filter(
      (b) => b && b.id && !deletedIds.includes(b.id) && !deletedIds.includes(b.slug)
    );
  },

  // Export current publication state as JSON
  exportBlogsJson(blogs: BlogPost[]): void {
    if (typeof window === 'undefined') return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(blogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'blogs.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },

  // Reset local browser overrides to live server state
  resetToLiveServer(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(DELETED_BLOGS_KEY);
    localStorage.removeItem(CUSTOM_BLOGS_KEY);
  },

  // Reset all likes and views in local storage
  clearAllStats(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(LIKES_KEY);
    const custom = this.getCustomBlogs();
    for (const k in custom) {
      if (custom[k]) {
        custom[k].views = 0;
        custom[k].likes = 0;
      }
    }
    localStorage.setItem(CUSTOM_BLOGS_KEY, JSON.stringify(custom));
  },

  // DynamoDB Direct Credentials (for seamless sync even before server redeploy)
  getDynamoCreds(): { tableName: string; region: string; accessKeyId: string; secretAccessKey: string } | null {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem('tmu_dynamo_creds');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  setDynamoCreds(creds: { tableName: string; region: string; accessKeyId: string; secretAccessKey: string }): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('tmu_dynamo_creds', JSON.stringify(creds));
  },

  // Cached Hero Post to prevent flash on page refresh
  getCachedHeroPost(): BlogPost | null {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem('tmu_cached_hero_post');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  setCachedHeroPost(post: BlogPost): void {
    if (typeof window === 'undefined' || !post) return;
    try {
      localStorage.setItem('tmu_cached_hero_post', JSON.stringify(post));
    } catch {}
  },
  clearCachedHeroPost(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem('tmu_cached_hero_post');
    } catch {}
  },
};
