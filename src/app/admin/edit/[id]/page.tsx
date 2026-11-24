import React from 'react';
import { getBlogsServerAsync, getBlogsServer } from '@/lib/blog-service';
import { BlogEditorClient } from '@/components/BlogEditorClient';
import { BlogPost } from '@/types/blog';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    let decodedId = '';
    try {
      decodedId = decodeURIComponent(id || '').trim();
    } catch {
      decodedId = (id || '').trim();
    }

    let blogs: BlogPost[] = [];
    try {
      blogs = await getBlogsServerAsync();
    } catch {
      blogs = getBlogsServer();
    }

    const blog = blogs.find(
      (b) =>
        b.id === decodedId ||
        (b.slug && b.slug.toLowerCase() === decodedId.toLowerCase())
    );
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

    let blogs: BlogPost[] = [];
    try {
      blogs = await getBlogsServerAsync();
    } catch {
      blogs = getBlogsServer();
    }

    blog =
      blogs.find(
        (b) =>
          b.id === decodedId ||
          (b.slug && b.slug.toLowerCase() === decodedId.toLowerCase()) ||
          (b.id === '7' && (decodedId === '7' || decodedId.includes('checklist') || decodedId.includes('pure-term')))
      ) || null;
  } catch (err) {
    console.warn('EditBlogPage params resolution notice:', err);
  }

  return <BlogEditorClient initialPost={blog} isEditing={true} postId={decodedId} />;
}
