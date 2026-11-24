import React from 'react';
import { getBlogsServerAsync } from '@/lib/blog-service';
import { SearchClientView } from '@/components/SearchClientView';

export const metadata = {
  title: 'Search Results | The Mind Upgrade',
  description: 'Search articles, mental models, personal finance guides, and insights.',
};

export default async function SearchResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const allBlogs = (await getBlogsServerAsync()).filter((b) => b.status === 'published');

  return <SearchClientView initialQuery={q} initialBlogs={allBlogs} />;
}
