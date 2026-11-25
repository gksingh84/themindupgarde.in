import React from 'react';
import { getBlogsServerAsync } from '@/lib/blog-service';
import { AdminStatsClient } from '@/components/AdminStatsClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Platform Analytics & Stats | The Mind Upgrade Admin',
  description: 'View traffic statistics, reader engagement, top read blogs, likes, and comment metrics.',
};

export default async function AdminStatsPage() {
  const blogs = await getBlogsServerAsync();
  return <AdminStatsClient initialBlogs={blogs} />;
}
