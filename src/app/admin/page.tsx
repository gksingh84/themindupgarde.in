import React from 'react';
import { getBlogsServerAsync } from '@/lib/blog-service';
import { AdminDashboardClient } from '@/components/AdminDashboardClient';

export const metadata = {
  title: 'Admin Dashboard | The Mind Upgrade',
  description: 'Manage blog posts, edit content, toggle drafts, and publish articles.',
};

export default async function AdminPage() {
  const blogs = await getBlogsServerAsync();
  return <AdminDashboardClient initialBlogs={blogs} />;
}
