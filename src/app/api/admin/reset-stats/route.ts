import { NextResponse } from 'next/server';
import { resetAllBlogStatsServerAsync } from '@/lib/blog-service';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    await resetAllBlogStatsServerAsync();
    return NextResponse.json({
      success: true,
      message: 'All likes and reads (views) have been reset to 0 in DynamoDB, server cache, and files.',
    });
  } catch (err) {
    console.error('Error in POST /api/admin/reset-stats:', err);
    return NextResponse.json(
      { error: 'Failed to reset stats', details: String(err) },
      { status: 500 }
    );
  }
}
