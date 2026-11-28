import React from 'react';
import { getBlogsServerAsync, getBlogsServer, getBlogBySlugServerAsync } from '@/lib/blog-service';
import { BlogEditorClient } from '@/components/BlogEditorClient';
import { BlogPost } from '@/types/blog';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    let decodedId = '';
    try {
      decodedId = decodeURIComponent(id || '').trim();
    } catch {
      decodedId = (id || '').trim();
    }

    const blog = (await getBlogBySlugServerAsync(decodedId)) || null;
    if (!blog) return { title: 'Edit Article | Admin' };
    return { title: `Edit: ${blog.title} | Admin` };
  } catch {
    return { title: 'Edit Article | Admin' };
  }
}

export default async function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
  let decodedId = '';
  let blog: BlogPost | null = null;

  try {
    const resolvedParams = await params;
    const rawId = resolvedParams?.id || '';
    try {
      decodedId = decodeURIComponent(rawId).trim();
    } catch {
      decodedId = rawId.trim();
    }

    if (decodedId) {
      blog = (await getBlogBySlugServerAsync(decodedId)) || null;
    }

    if (!blog && decodedId) {
      const blogs = getBlogsServer();
      blog =
        blogs.find(
          (b) =>
            b.id === decodedId ||
            (b.slug && b.slug.toLowerCase() === decodedId.toLowerCase()) ||
            (b.id === '7' && (decodedId === '7' || decodedId.includes('pure-term'))) ||
            (b.id === '8' && (decodedId === '8' || decodedId.includes('checklist')))
        ) || null;
    }
  } catch (err) {
    console.warn('EditBlogPage params resolution notice:', err);
  }

  return <BlogEditorClient initialPost={blog} isEditing={true} postId={decodedId} />;
}
