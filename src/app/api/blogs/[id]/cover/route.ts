import { NextResponse } from 'next/server';
import { getBlogByIdOrSlugFromDynamoDB, applyDynamoCredsHeader, isDynamoDBConfigured } from '@/lib/dynamodb';
import { getBlogBySlugServer } from '@/lib/blog-service';

export const dynamic = 'force-dynamic';

function getCategoryFallback(category?: string): string {
  const cat = (category || '').toLowerCase();
  if (cat.includes('insurance')) return '/images/insurance.svg';
  if (cat.includes('bank') || cat.includes('finance') || cat.includes('money') || cat.includes('wealth')) return '/images/banking.svg';
  if (cat.includes('psychology') || cat.includes('mind') || cat.includes('habit')) return '/images/mental-models.svg';
  if (cat.includes('deep-work') || cat.includes('productivity')) return '/images/deep-work.svg';
  return '/images/financial-independence.svg';
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    applyDynamoCredsHeader(request.headers.get('x-dynamo-creds'));
    const { id } = await params;
    const decodedId = decodeURIComponent(id || '').trim();

    if (!decodedId) {
      return NextResponse.redirect(new URL('/images/financial-independence.svg', request.url));
    }

    let blog = null;
    if (isDynamoDBConfigured()) {
      try {
        blog = await getBlogByIdOrSlugFromDynamoDB(decodedId);
      } catch (err) {
        console.warn('Cover route DynamoDB lookup notice:', err);
      }
    }

    if (!blog) {
      blog = getBlogBySlugServer(decodedId) || null;
    }

    const fallbackUrl = getCategoryFallback(blog?.category);

    if (!blog || !blog.coverImage) {
      return NextResponse.redirect(new URL(fallbackUrl, request.url));
    }

    const cover = blog.coverImage.trim();

    // 1. If base64 data URI, convert to binary stream with optimal image headers & cache
    if (cover.startsWith('data:')) {
      const match = cover.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        const contentType = match[1] || 'image/jpeg';
        const buffer = Buffer.from(match[2], 'base64');
        return new Response(buffer, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Content-Length': String(buffer.length),
            'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
          },
        });
      }
    }

    // 2. If relative path (/images/...)
    if (cover.startsWith('/')) {
      return NextResponse.redirect(new URL(cover, request.url));
    }

    // 3. If external absolute URL (https://...)
    if (cover.startsWith('http://') || cover.startsWith('https://')) {
      return NextResponse.redirect(new URL(cover));
    }

    // 4. Default fallback
    return NextResponse.redirect(new URL(fallbackUrl, request.url));
  } catch (error) {
    console.error('Error serving cover image:', error);
    return NextResponse.redirect(new URL('/images/financial-independence.svg', request.url));
  }
}
