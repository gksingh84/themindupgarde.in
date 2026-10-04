export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: CategoryType;
  tags: string[];
  author: {
    name: string;
    avatar: string;
    role: string;
    showPhoto?: boolean;
  };
  publishedAt: string;
  readTime: string;
  status: 'published' | 'draft';
  featured?: boolean;
  views?: number;
  likes?: number;
}

export type CategoryType = 
  | 'Personal Finance'
  | 'Banking'
  | 'Insurance'
  | 'Day to Day Insights'
  | 'Case Studies';

export interface CategoryInfo {
  name: CategoryType;
  slug: string;
  description: string;
  iconName: string;
  gradient: string;
  color: string;
}

export interface Comment {
  id: string;
  postSlug: string;
  authorName: string;
  authorEmail: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
  likes: number;
}
