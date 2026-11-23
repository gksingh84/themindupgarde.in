import { NextResponse } from 'next/server';
import { getBlogsServer } from '@/lib/blog-service';

export async function GET() {
  const baseUrl = 'https://themindupgrade.in';
  const blogs = getBlogsServer().filter((b) => b.status === 'published');

  const rssItems = blogs
    .map(
      (b) => `
    <item>
      <title><![CDATA[${b.title}]]></title>
      <link>${baseUrl}/blog/${b.slug}</link>
      <guid isPermaLink="true">${baseUrl}/blog/${b.slug}</guid>
      <description><![CDATA[${b.excerpt}]]></description>
      <category>${b.category}</category>
      <pubDate>${new Date(b.publishedAt).toUTCString()}</pubDate>
      <dc:creator><![CDATA[${b.author.name}]]></dc:creator>
    </item>`
    )
    .join('');

  const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>The Mind Upgrade</title>
    <link>${baseUrl}</link>
    <description>Fresh Insights for a Smarter Life — Personal Finance, Insurance, Psychology, Economy, and Practical Knowledge.</description>
    <language>en-US</language>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${rssItems}
  </channel>
</rss>`;

  return new NextResponse(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate',
    },
  });
}
