import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBlogsServer, getBlogBySlugServer } from '@/lib/blog-service';
import { BlogPostClientView } from '@/components/BlogPostClientView';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogBySlugServer(slug);
  if (!post) return { title: 'Post Not Found' };

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `https://themindupgrade.in/blog/${post.slug}`,
      images: [{ url: post.coverImage }],
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author.name],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogBySlugServer(slug);

  if (!post || post.status === 'draft') {
    notFound();
  }

  const allBlogs = getBlogsServer().filter((b) => b.status === 'published' && b.slug !== slug);
  const relatedPosts = allBlogs
    .filter((b) => b.category === post.category)
    .slice(0, 3);

  // If not enough related in same category, fill with latest
  if (relatedPosts.length < 3) {
    const remaining = allBlogs.filter((b) => !relatedPosts.some((r) => r.id === b.id));
    relatedPosts.push(...remaining.slice(0, 3 - relatedPosts.length));
  }

  // JSON-LD Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage,
    datePublished: post.publishedAt,
    author: {
      '@type': 'Person',
      name: post.author.name,
    },
    publisher: {
      '@type': 'Organization',
      name: 'The Mind Upgrade',
      logo: {
        '@type': 'ImageObject',
        url: 'https://themindupgrade.in/logo.svg',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://themindupgrade.in/blog/${post.slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogPostClientView post={post} relatedPosts={relatedPosts} />
    </>
  );
}
