import React from 'react';
import {
  getBlogsServerAsync,
  getEditorsPicks,
  getPopularBlogs,
  getFeaturedArticles,
} from '@/lib/blog-service';
import { HomeClientView } from '@/components/HomeClientView';
import { BlogPost } from '@/types/blog';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function stripContent(b: BlogPost): BlogPost {
  if (!b) return b;
  const { content, ...rest } = b;
  let coverImage = b.coverImage;
  if (coverImage && coverImage.startsWith('data:image')) {
    coverImage = `/api/blogs/${encodeURIComponent(b.id)}/cover`;
  }
  return {
    ...rest,
    coverImage,
    content: '',
  };
}

export default async function HomePage() {
  const allBlogs = await getBlogsServerAsync(true);
  const publishedBlogs = allBlogs.filter((b) => b.status === 'published');

  // Featured post: specifically selected featured story or latest published article
  const featuredPost = publishedBlogs.find((b) => b.featured) || publishedBlogs[0];
  const editorsPicks = getEditorsPicks(4);
  const popularPosts = getPopularBlogs(5);

  return (
    <HomeClientView
      initialBlogs={publishedBlogs.map(stripContent)}
      featuredPost={stripContent(featuredPost)}
      editorsPicks={editorsPicks.map(stripContent)}
      popularPosts={popularPosts.map(stripContent)}
    />
  );
}
