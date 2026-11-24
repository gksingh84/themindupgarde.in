import { NextResponse } from 'next/server';
import { getBlogsServer, saveBlogsServer, getBlogsServerAsync } from '@/lib/blog-service';
import {
  isDynamoDBConfigured,
  saveBlogsBatchToDynamoDB,
  getAllBlogsFromDynamoDB,
} from '@/lib/dynamodb';
import { BlogPost } from '@/types/blog';

export async function GET() {
  const configured = isDynamoDBConfigured();
  if (!configured) {
    return NextResponse.json({
      configured: false,
      message: 'DynamoDB is not configured yet. Add environment variables in AWS Amplify.',
    });
  }

  try {
    const cloudBlogs = await getAllBlogsFromDynamoDB();
    return NextResponse.json({
      configured: true,
      count: cloudBlogs.length,
      blogs: cloudBlogs,
    });
  } catch (error) {
    return NextResponse.json({
      configured: true,
      error: String(error),
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const clientBlogs: BlogPost[] = body.blogs || [];

    // Base blogs from server
    let blogsToSync: BlogPost[] = clientBlogs.length > 0 ? clientBlogs : getBlogsServer();

    // 1. Update serverless tmp & disk
    saveBlogsServer(blogsToSync);

    // 2. If DynamoDB is configured, push all to DynamoDB
    let dynamoSuccess = false;
    if (isDynamoDBConfigured()) {
      dynamoSuccess = await saveBlogsBatchToDynamoDB(blogsToSync);
    }

    // Refresh memory cache
    await getBlogsServerAsync(true);

    return NextResponse.json({
      success: true,
      dynamoConfigured: isDynamoDBConfigured(),
      dynamoSuccess,
      syncedCount: blogsToSync.length,
      message: isDynamoDBConfigured()
        ? `Successfully synced ${blogsToSync.length} articles to AWS DynamoDB!`
        : `Saved ${blogsToSync.length} articles locally. DynamoDB credentials not detected yet.`,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to sync blogs', details: String(err) },
      { status: 500 }
    );
  }
}
