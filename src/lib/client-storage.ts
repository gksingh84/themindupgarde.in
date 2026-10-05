import { BlogPost, Comment } from '@/types/blog';
import initialBlogs from '@/data/blogs.json';

const BOOKMARKS_KEY = 'tmu_bookmarks';
const LIKES_KEY = 'tmu_likes';
const ADMIN_AUTH_KEY = 'tmu_admin_auth';

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
};
