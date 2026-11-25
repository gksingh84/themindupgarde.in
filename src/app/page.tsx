import React from 'react';
import {
  getBlogsServerAsync,
  getEditorsPicks,
  getPopularBlogs,
  getFeaturedArticles,
} from '@/lib/blog-service';
import { HomeClientView } from '@/components/HomeClientView';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const allBlogs = await getBlogsServerAsync();
  const publishedBlogs = allBlogs.filter((b) => b.status === 'published');

  // Featured post: specifically selected or first featured or latest
  const featuredPosts = getFeaturedArticles(4);
  const featuredPost = featuredPosts[0] || publishedBlogs[0];
  const editorsPicks = getEditorsPicks(4);
  const popularPosts = getPopularBlogs(5);

  return (
    <HomeClientView
      initialBlogs={publishedBlogs}
      featuredPost={featuredPost}
      editorsPicks={editorsPicks}
      popularPosts={popularPosts}
    />
  );
}
