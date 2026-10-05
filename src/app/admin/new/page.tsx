import React from 'react';
import { BlogEditorClient } from '@/components/BlogEditorClient';

export const metadata = {
  title: 'Create New Article | The Mind Upgrade Admin',
};

export default function NewBlogPage() {
  return <BlogEditorClient isEditing={false} />;
}
