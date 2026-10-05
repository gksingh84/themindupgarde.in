'use me';
import React from 'react';
import { getBlogsServer } from '@/lib/blog-service';
import { AdminDashboardClient } from '@/components/AdminDashboardClient';

export const metadata = {
  title: 'Admin Dashboard | The Mind Upgrade',
  description: 'Manage blog posts, edit content, toggle drafts, and publish articles.',
};

export default function AdminPage() {
  const blogs = getBlogsServer();
  return <AdminDashboardClient initialBlogs={blogs} />;
}
