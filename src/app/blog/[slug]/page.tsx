import React from 'react';
import { getBlogsServer, getBlogBySlugServer } from '@/lib/blog-service';
import { BlogPostClientView } from '@/components/BlogPostClientView';
import { BlogPost } from '@/types/blog';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogBySlugServer(slug);
  if (!post) {
    return {
      title: 'Publication Library | The Mind Upgrade',
      description: 'Explore curated insights, frameworks, and mental models on The Mind Upgrade.',
    };
  }

  return {
    title: `${post.title} | The Mind Upgrade`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `https://themindupgrade.in/blog/${post.slug}`,
      images: [{ url: post.coverImage }],
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author?.name || 'Gaurav Kumar Singh'],
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
  const post = getBlogBySlugServer(slug) || null;

  const allBlogs = getBlogsServer().filter((b) => b.status === 'published' && b.slug !== slug);
  let relatedPosts: BlogPost[] = [];
  if (post) {
    relatedPosts = allBlogs
      .filter((b) => b.category === post.category)
      .slice(0, 3);
    if (relatedPosts.length < 3) {
      const remaining = allBlogs.filter((b) => !relatedPosts.some((r) => r.id === b.id));
      relatedPosts.push(...remaining.slice(0, 3 - relatedPosts.length));
    }
  } else {
    relatedPosts = allBlogs.slice(0, 3);
  }

  // JSON-LD Structured Data
  const jsonLd = post
    ? {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.excerpt,
        image: post.coverImage,
        datePublished: post.publishedAt,
        author: {
          '@type': 'Person',
          name: post.author?.name || 'Gaurav Kumar Singh',
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
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <BlogPostClientView post={post} slug={slug} relatedPosts={relatedPosts} />
    </>
  );
}
