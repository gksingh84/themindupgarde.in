import React from 'react';
import Link from 'next/link';
import { getBlogsServer } from '@/lib/blog-service';
import { BlogPost } from '@/types/blog';
import { ArchiveClientView } from '@/components/ArchiveClientView';
import { parseDate } from '@/lib/date-utils';

export const metadata = {
  title: 'Article Archive | The Mind Upgrade',
  description: 'Chronological archive of all articles published on The Mind Upgrade.',
};

export default function ArchivePage() {
  const blogs = getBlogsServer().filter((b) => b.status === 'published');

  // Group blogs by Month & Year
  const grouped: Record<string, BlogPost[]> = {};

  blogs.forEach((b) => {
    const date = parseDate(b.publishedAt);
    const monthYear = isNaN(date.getTime())
      ? 'Archive'
      : date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (!grouped[monthYear]) {
      grouped[monthYear] = [];
    }
    grouped[monthYear].push(b);
  });

  return <ArchiveClientView grouped={grouped} totalCount={blogs.length} />;
}
