import React from 'react';
import { getBlogsServerAsync } from '@/lib/blog-service';
import { BookmarksClientView } from '@/components/BookmarksClientView';

export const metadata = {
  title: 'Saved Articles & Reading List | The Mind Upgrade',
  description: 'Your privately saved articles and bookmarked reading list on The Mind Upgrade.',
};

export default async function BookmarksPage() {
  const allBlogs = (await getBlogsServerAsync(true)).filter((b) => b.status === 'published');
  return <BookmarksClientView initialBlogs={allBlogs} />;
}
