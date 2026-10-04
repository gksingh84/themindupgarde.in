import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting PostgreSQL database seed...');

  // Read blogs.json
  const blogsPath = path.join(__dirname, '../src/data/blogs.json');
  if (fs.existsSync(blogsPath)) {
    const blogsData = JSON.parse(fs.readFileSync(blogsPath, 'utf-8'));
    for (const blog of blogsData) {
      await prisma.blogPost.upsert({
        where: { slug: blog.slug },
        update: {
          title: blog.title,
          excerpt: blog.excerpt,
          content: blog.content,
          coverImage: blog.coverImage,
          category: blog.category,
          tags: blog.tags || [],
          authorName: blog.author?.name || 'Alex Mercer',
          authorAvatar: blog.author?.avatar || '',
          authorRole: blog.author?.role || 'Contributor',
          publishedAt: blog.publishedAt,
          readTime: blog.readTime,
          status: blog.status || 'published',
          featured: Boolean(blog.featured),
          views: blog.views || 0,
          likes: blog.likes || 0,
        },
        create: {
          id: blog.id,
          slug: blog.slug,
          title: blog.title,
          excerpt: blog.excerpt,
          content: blog.content,
          coverImage: blog.coverImage,
          category: blog.category,
          tags: blog.tags || [],
          authorName: blog.author?.name || 'Alex Mercer',
          authorAvatar: blog.author?.avatar || '',
          authorRole: blog.author?.role || 'Contributor',
          publishedAt: blog.publishedAt,
          readTime: blog.readTime,
          status: blog.status || 'published',
          featured: Boolean(blog.featured),
          views: blog.views || 0,
          likes: blog.likes || 0,
        },
      });
      console.log(`  ✓ Seeded blog: ${blog.title}`);
    }
  }

  // Read comments.json
  const commentsPath = path.join(__dirname, '../src/data/comments.json');
  if (fs.existsSync(commentsPath)) {
    const commentsData = JSON.parse(fs.readFileSync(commentsPath, 'utf-8'));
    for (const comment of commentsData) {
      await prisma.comment.upsert({
        where: { id: comment.id },
        update: {
          postSlug: comment.postSlug,
          authorName: comment.authorName,
          authorEmail: comment.authorEmail,
          authorAvatar: comment.authorAvatar,
          content: comment.content,
          createdAt: comment.createdAt,
          likes: comment.likes || 0,
        },
        create: {
          id: comment.id,
          postSlug: comment.postSlug,
          authorName: comment.authorName,
          authorEmail: comment.authorEmail,
          authorAvatar: comment.authorAvatar,
          content: comment.content,
          createdAt: comment.createdAt,
          likes: comment.likes || 0,
        },
      });
      console.log(`  ✓ Seeded comment for slug: ${comment.postSlug}`);
    }
  }

  console.log('✅ PostgreSQL Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
