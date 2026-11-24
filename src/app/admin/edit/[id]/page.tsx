import React from 'react';
import { getBlogsServerAsync } from '@/lib/blog-service';
import { BlogEditorClient } from '@/components/BlogEditorClient';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const decodedId = decodeURIComponent(id || '').trim();
    const blogs = await getBlogsServerAsync();
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
  const { id } = await params;
  const decodedId = decodeURIComponent(id || '').trim();
  const blogs = await getBlogsServerAsync();
  const blog =
    blogs.find(
      (b) =>
        b.id === decodedId ||
        (b.slug && b.slug.toLowerCase() === decodedId.toLowerCase()) ||
        (b.id === '7' && (decodedId === '7' || decodedId.includes('checklist') || decodedId.includes('pure-term')))
    ) || null;

  return <BlogEditorClient initialPost={blog} isEditing={true} postId={decodedId} />;
}
