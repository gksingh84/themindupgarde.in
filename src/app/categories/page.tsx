import React from 'react';
import { CATEGORIES } from '@/data/categories';
import { getBlogsServerAsync } from '@/lib/blog-service';
import { CategoriesIndexClientView } from '@/components/CategoriesIndexClientView';

export const metadata = {
  title: 'Content Domains | The Mind Upgrade',
  description: 'Explore curated articles in Personal Finance, Insurance, Psychology, Economy, and Practical Everyday Knowledge.',
};

export default async function CategoriesPage() {
  const blogs = (await getBlogsServerAsync()).filter((b) => b.status === 'published');

  return <CategoriesIndexClientView categories={CATEGORIES} initialBlogs={blogs} />;
}
