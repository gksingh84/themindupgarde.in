'use me';
import React from 'react';
import Link from 'next/link';
import { getBlogsServer } from '@/lib/blog-service';
import { CATEGORIES } from '@/data/categories';
import { BlogCard } from '@/components/BlogCard';
import { 
  Sparkles, 
  ArrowRight, 
  Zap, 
  Brain, 
  Cpu, 
  Activity, 
  TrendingUp, 
  Compass, 
  CheckCircle2, 
  Search,
  BookOpen
} from 'lucide-react';
import { HomeClientView } from '@/components/HomeClientView';

export const revalidate = 60; // Revalidate every minute

export default function HomePage() {
  const blogs = getBlogsServer().filter((b) => b.status === 'published');
  const featuredPost = blogs.find((b) => b.featured) || blogs[0];

  return <HomeClientView initialBlogs={blogs} featuredPost={featuredPost} />;
}
