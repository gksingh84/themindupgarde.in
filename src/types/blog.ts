export type CategoryType =
  | 'Personal Finance'
  | 'Insurance'
  | 'Psychology and Self-Improvement'
  | 'Economy and Current Affairs'
  | 'Daily Insights';

export type ArticleStatus = 'draft' | 'in_review' | 'scheduled' | 'published' | 'archived';

export interface AuthorInfo {
  id?: string;
  name: string;
  avatar: string;
  role: string;
  bio?: string;
  showPhoto?: boolean;
}

export interface SeoMetadata {
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogImage?: string;
  keywords?: string[];
}

export interface ArticleRevision {
  id: string;
  articleId: string;
  title: string;
  excerpt: string;
  content: string;
  authorName: string;
  savedAt: string;
  revisionNote?: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  excerpt: string;
  content: string;
  coverImage: string;
  coverCaption?: string;
  category: CategoryType | string;
  subcategory?: string;
  tags: string[];
  author: AuthorInfo;
  publishedAt: string;
  updatedAt?: string;
  scheduledAt?: string;
  readTime: string;
  status: ArticleStatus;
  featured?: boolean;
  editorsPick?: boolean;
  views?: number;
  likes?: number;
  seo?: SeoMetadata;
  revisions?: ArticleRevision[];
}

export interface SubcategoryInfo {
  name: string;
  slug: string;
  description: string;
}

export interface CategoryInfo {
  name: string;
  slug: string;
  description: string;
  iconName: string;
  subcategories: SubcategoryInfo[];
  gradient: string;
  color: string;
  badgeBg: string;
  badgeText: string;
}

export interface Comment {
  id: string;
  postSlug: string;
  parentId?: string | null;
  authorName: string;
  authorEmail?: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
  likes: number;
  status?: 'pending' | 'approved' | 'spam' | 'rejected';
  isAuthorReply?: boolean;
}

export interface Subscriber {
  id: string;
  email: string;
  name?: string;
  status: 'active' | 'unconfirmed' | 'unsubscribed';
  subscribedAt: string;
  confirmedAt?: string;
  source?: string;
}

export interface WebsiteSettings {
  siteName: string;
  tagline: string;
  description: string;
  logoUrl: string;
  faviconUrl: string;
  contactEmail: string;
  announcementBar: {
    enabled: boolean;
    text: string;
    linkUrl?: string;
    badgeText?: string;
  };
  socialLinks: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    youtube?: string;
    instagram?: string;
  };
  articleFooterCta?: {
    enabled: boolean;
    text: string;
    imageUrl: string;
  };
  seo: {
    defaultTitle: string;
    defaultDescription: string;
    defaultOgImage: string;
  };
  enableComments: boolean;
  maintenanceMode: boolean;
}

export interface RedirectRule {
  id: string;
  sourcePath: string;
  targetPath: string;
  statusCode: 301 | 302;
  hits: number;
  active: boolean;
  createdAt: string;
}
