import React from 'react';
import { getBlogsServerAsync } from '@/lib/blog-service';
import { AdminDashboardClient } from '@/components/AdminDashboardClient';
import { BlogPost } from '@/types/blog';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Admin Dashboard | The Mind Upgrade',
  description: 'Manage blog posts, edit content, toggle drafts, and publish articles.',
};

function stripContent(b: BlogPost): BlogPost {
  if (!b) return b;
  const { content, ...rest } = b;
  return {
    ...rest,
    content: '',
  };
}

export default async function AdminPage() {
  const blogs = await getBlogsServerAsync();
  return <AdminDashboardClient initialBlogs={blogs.map(stripContent)} />;
}
