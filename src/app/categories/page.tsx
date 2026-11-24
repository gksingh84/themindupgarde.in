import React from 'react';
import { CATEGORIES } from '@/data/categories';
import { getBlogsServer } from '@/lib/blog-service';
import { CategoriesIndexClientView } from '@/components/CategoriesIndexClientView';

export const metadata = {
  title: 'Content Domains | The Mind Upgrade',
  description: 'Explore curated articles in Personal Finance, Insurance, Psychology, Economy, and Practical Everyday Knowledge.',
};

export default function CategoriesPage() {
  const blogs = getBlogsServer().filter((b) => b.status === 'published');

  return <CategoriesIndexClientView categories={CATEGORIES} initialBlogs={blogs} />;
}
