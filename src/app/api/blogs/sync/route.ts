import { NextResponse } from 'next/server';
import { getBlogsServer, saveBlogsServer, getBlogsServerAsync } from '@/lib/blog-service';
import {
  isDynamoDBConfigured,
  saveBlogsToDynamoDBDetailed,
  getAllBlogsFromDynamoDB,
  getDynamoTableName,
  getDynamoRegion,
  getDynamoAccessKeyId,
  getDynamoSecretAccessKey,
} from '@/lib/dynamodb';
import { BlogPost } from '@/types/blog';

export async function GET() {
  const configured = isDynamoDBConfigured();
  const tableName = getDynamoTableName();
  const region = getDynamoRegion();
  const hasAccessKey = Boolean(getDynamoAccessKeyId());
  const hasSecretKey = Boolean(getDynamoSecretAccessKey());

  if (!configured) {
    return NextResponse.json({
      configured: false,
      tableName,
      region,
      hasAccessKey,
      hasSecretKey,
      message:
        'DynamoDB environment variables not active yet on AWS Amplify. In Amplify Console > Environment variables, add APP_AWS_ACCESS_KEY_ID, APP_AWS_SECRET_ACCESS_KEY, APP_AWS_REGION, and DYNAMODB_TABLE_NAME, then click "Redeploy this version".',
    });
  }

  try {
    const cloudBlogs = await getAllBlogsFromDynamoDB();
    return NextResponse.json({
      configured: true,
      tableName,
      region,
      hasAccessKey,
      hasSecretKey,
      count: cloudBlogs ? cloudBlogs.length : 0,
      blogs: cloudBlogs || [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        configured: true,
        tableName,
        region,
        hasAccessKey,
        hasSecretKey,
        error: String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const clientBlogs: BlogPost[] = body.blogs || [];

    // Base blogs from server
    let blogsToSync: BlogPost[] = clientBlogs.length > 0 ? clientBlogs : getBlogsServer();

    // 1. Update serverless tmp & disk fallback
    saveBlogsServer(blogsToSync);

    // 2. Check if DynamoDB is configured with credentials
    if (!isDynamoDBConfigured()) {
      return NextResponse.json(
        {
          success: false,
          dynamoConfigured: false,
          error:
            'DynamoDB credentials not detected yet on AWS Amplify. After adding environment variables in Amplify Console, you MUST trigger a redeploy (or click "Redeploy this version") for them to take effect!',
        },
        { status: 400 }
      );
    }

    // 3. Try saving to DynamoDB with detailed diagnostics
    const result = await saveBlogsToDynamoDBDetailed(blogsToSync);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          dynamoConfigured: true,
          error: `DynamoDB Error (${getDynamoRegion()} / ${getDynamoTableName()}): ${result.error}`,
        },
        { status: 500 }
      );
    }

    // 4. Force refresh in-memory cache
    await getBlogsServerAsync(true);

    return NextResponse.json({
      success: true,
      dynamoConfigured: true,
      syncedCount: result.savedCount,
      message: `Successfully written ${result.savedCount} articles to AWS DynamoDB table "${getDynamoTableName()}" in region "${getDynamoRegion()}"!`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to sync blogs', details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
