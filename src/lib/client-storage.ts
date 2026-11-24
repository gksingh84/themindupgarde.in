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
    return isBookmarked;
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
    return localStorage.getItem('tmu_custom_admin_password') || '';
  },
  setCustomAdminPassword(password: string): void {
    if (typeof window === 'undefined') return;
    if (password) {
      localStorage.setItem('tmu_custom_admin_password', password);
    } else {
      localStorage.removeItem('tmu_custom_admin_password');
    }
  },
  validateAdminPassword(entered: string): boolean {
    if (!entered) return false;
    const custom = this.getCustomAdminPassword();
    if (custom) {
      // Once a custom password is set, ONLY the custom password is valid.
      // The default password ('admin123') is STRICTLY DISABLED and REJECTED!
      return entered === custom;
    }
    // Only when no custom password exists in this browser:
    if (process.env.NEXT_PUBLIC_ADMIN_PASSWORD && entered === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) return true;
    if (entered === 'admin123') return true;
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

    const deletedIds = this.getDeletedBlogIds();
    const customMap = this.getCustomBlogs();

    // 1. Filter out deleted blogs from initial list
    let result = initialBlogs.filter(
      (b) => !deletedIds.includes(b.id) && !deletedIds.includes(b.slug)
    );

    // 2. Replace any modified initial blogs with custom versions
    result = result.map((b) => {
      const key = b.id || b.slug;
      if (customMap[key]) return customMap[key];
      const match = Object.values(customMap).find((c) => c.id === b.id || c.slug === b.slug);
      return match || b;
    });

    // 3. Append newly created blogs not in initial list
    const initialKeys = new Set(initialBlogs.map((b) => b.id));
    const initialSlugs = new Set(initialBlogs.map((b) => b.slug));

    Object.values(customMap).forEach((customBlog) => {
      if (
        !initialKeys.has(customBlog.id) &&
        !initialSlugs.has(customBlog.slug) &&
        !deletedIds.includes(customBlog.id) &&
        !deletedIds.includes(customBlog.slug)
      ) {
        result.unshift(customBlog);
      }
    });

    return result;
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
};
