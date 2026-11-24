import React from 'react';
import { notFound } from 'next/navigation';
import { CATEGORIES } from '@/data/categories';
import { getBlogsServerAsync } from '@/lib/blog-service';
import { CategoryDetailClientView } from '@/components/CategoryDetailClientView';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = CATEGORIES.find((c) => c.slug === slug);
  if (!category) return { title: 'Category Not Found | The Mind Upgrade' };

  return {
    title: `${category.name} Articles & Guides | The Mind Upgrade`,
    description: category.description,
    openGraph: {
      title: `${category.name} | The Mind Upgrade`,
      description: category.description,
      url: `https://themindupgrade.in/categories/${category.slug}`,
    },
  };
}

export default async function CategoryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sub?: string }>;
}) {
  const { slug } = await params;
  const { sub } = await searchParams;
  const category = CATEGORIES.find((c) => c.slug === slug);

  if (!category) {
    notFound();
  }

  const allBlogs = (await getBlogsServerAsync()).filter((b) => b.status === 'published');

  return (
    <CategoryDetailClientView
      category={category}
      initialBlogs={allBlogs}
      initialSub={sub}
    />
  );
}
