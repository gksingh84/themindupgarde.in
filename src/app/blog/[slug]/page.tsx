import React from 'react';
import { getBlogsServerAsync, getBlogBySlugServerAsync } from '@/lib/blog-service';
import { BlogPostClientView } from '@/components/BlogPostClientView';
import { BlogPost } from '@/types/blog';

export const revalidate = 60; // ISR cache: instant <50ms edge delivery with background revalidation

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogBySlugServerAsync(slug);
  if (!post) {
    return {
      title: 'Publication Library | The Mind Upgrade',
      description: 'Explore curated insights, frameworks, and mental models on The Mind Upgrade.',
    };
  }

  const coverUrl = post.coverImage && post.coverImage.startsWith('data:')
    ? `https://themindupgrade.in/api/blogs/${encodeURIComponent(post.id)}/cover`
    : (post.coverImage || 'https://themindupgrade.in/images/financial-independence.svg');

  return {
    title: `${post.title} | The Mind Upgrade`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `https://themindupgrade.in/blog/${post.slug}`,
      images: [{ url: coverUrl }],
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author?.name || 'Gaurav Kumar Singh'],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [coverUrl],
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let post = (await getBlogBySlugServerAsync(slug)) || null;

  if (post && post.coverImage && post.coverImage.startsWith('data:')) {
    post = {
      ...post,
      coverImage: `/api/blogs/${encodeURIComponent(post.id)}/cover`,
    };
  }

  const allBlogs = (await getBlogsServerAsync()).filter((b) => b.status === 'published' && b.slug !== slug);
  let relatedPosts: BlogPost[] = [];
  if (post) {
    relatedPosts = allBlogs
      .filter((b) => b.category === post.category)
      .slice(0, 3);
    if (relatedPosts.length < 3) {
      const remaining = allBlogs.filter((b) => !relatedPosts.some((r) => r.id === b.id));
      relatedPosts.push(...remaining.slice(0, 3 - relatedPosts.length));
    }
  }

  return (
    <BlogPostClientView
      post={post}
      slug={slug}
      relatedPosts={relatedPosts}
    />
  );
}
