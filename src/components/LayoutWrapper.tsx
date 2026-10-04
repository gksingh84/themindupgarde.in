'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SearchModal } from '@/components/SearchModal';
import { BlogPost } from '@/types/blog';
import initialBlogs from '@/data/blogs.json';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [posts, setPosts] = useState<BlogPost[]>(initialBlogs as BlogPost[]);

  useEffect(() => {
    fetch('/api/blogs')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setPosts(data);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <Header onSearchClick={() => setIsSearchOpen(true)} />
      <main className="flex-1">{children}</main>
      <Footer />
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        posts={posts}
      />
    </>
  );
}
