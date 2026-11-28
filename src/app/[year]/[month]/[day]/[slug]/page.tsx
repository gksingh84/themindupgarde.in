import { permanentRedirect } from 'next/navigation';
import { getBlogsServerAsync } from '@/lib/blog-service';

export const dynamic = 'force-dynamic';

export default async function LegacyWordPressDateRedirect({
  params,
}: {
  params: Promise<{ year: string; month: string; day: string; slug: string }>;
}) {
  const { slug } = await params;
  const cleanSlug = decodeURIComponent(slug || '').toLowerCase().trim().replace(/\/+$/, '');

  const allBlogs = await getBlogsServerAsync();

  // 1. Exact match on slug
  let target = allBlogs.find((b) => b.slug.toLowerCase() === cleanSlug);

  // 2. Substring match (e.g. "grass-is-greener" inside longer WordPress slug)
  if (!target) {
    target = allBlogs.find((b) => {
      const bSlug = b.slug.toLowerCase();
      return cleanSlug.includes(bSlug) || bSlug.includes(cleanSlug);
    });
  }

  // 3. Significant keyword match against title or slug
  if (!target) {
    const keywords = cleanSlug.split(/[-_]+/).filter((w) => w.length >= 4);
    if (keywords.length > 0) {
      target = allBlogs.find((b) => {
        const titleLower = b.title.toLowerCase();
        const matches = keywords.filter((k) => titleLower.includes(k));
        return matches.length >= 2;
      });
    }
  }

  if (target) {
    permanentRedirect(`/blog/${target.slug}`);
  }

  // Fallback to home page with permanent redirect
  permanentRedirect('/');
}
