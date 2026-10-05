import React from 'react';
import { notFound } from 'next/navigation';
import { getBlogsServer } from '@/lib/blog-service';
import { BlogEditorClient } from '@/components/BlogEditorClient';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const blogs = getBlogsServer();
  const blog = blogs.find((b) => b.id === id || b.slug === id);
  if (!blog) return { title: 'Article Not Found' };
  return { title: `Edit: ${blog.title} | Admin` };
}

export default async function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const blogs = getBlogsServer();
  const blog = blogs.find((b) => b.id === id || b.slug === id);

  if (!blog) {
    notFound();
  }

  return <BlogEditorClient initialPost={blog} isEditing={true} />;
}
