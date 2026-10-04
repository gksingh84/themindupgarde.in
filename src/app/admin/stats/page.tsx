import React from 'react';
import { getBlogsServer } from '@/lib/blog-service';
import { AdminStatsClient } from '@/components/AdminStatsClient';

export const metadata = {
  title: 'Platform Analytics & Stats | The Mind Upgrade Admin',
  description: 'View traffic statistics, reader engagement, top read blogs, likes, and comment metrics.',
};

export default function AdminStatsPage() {
  const blogs = getBlogsServer();
  return <AdminStatsClient initialBlogs={blogs} />;
}
