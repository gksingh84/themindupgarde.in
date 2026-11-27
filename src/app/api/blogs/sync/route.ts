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
  applyDynamoCredsHeader,
  setDynamoRuntimeConfig,
} from '@/lib/dynamodb';
import { BlogPost } from '@/types/blog';

export async function GET(request: Request) {
  const credsHeader = request.headers.get('x-dynamo-creds');
  if (credsHeader) {
    applyDynamoCredsHeader(credsHeader);
  }

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
    const lightweightBlogs = (cloudBlogs || []).map((b) => {
      const { content, ...rest } = b;
      return {
        ...rest,
        content: '',
      };
    });
    return NextResponse.json({
      configured: true,
      tableName,
      region,
      hasAccessKey,
      hasSecretKey,
      count: cloudBlogs ? cloudBlogs.length : 0,
      blogs: lightweightBlogs,
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
    const credsHeader = request.headers.get('x-dynamo-creds');
    if (credsHeader) {
      applyDynamoCredsHeader(credsHeader);
    }

    const body = await request.json().catch(() => ({}));
    const clientBlogs: BlogPost[] = body.blogs || [];
    const creds = body.credentials;

    // If client supplied credentials directly from Admin UI, configure runtime immediately
    if (creds && creds.accessKeyId && creds.secretAccessKey) {
      setDynamoRuntimeConfig({
        tableName: creds.tableName,
        region: creds.region,
        accessKeyId: creds.accessKeyId,
        secretAccessKey: creds.secretAccessKey,
      });
    }

    // Base blogs from server merged with any client changes so no articles are ever lost
    const serverBlogs = getBlogsServer();
    let blogsToSync: BlogPost[] = [];
    if (clientBlogs && clientBlogs.length > 0) {
      const clientMap = new Map<string, BlogPost>();
      clientBlogs.forEach((b) => {
        if (b.id) clientMap.set(b.id, b);
        if (b.slug) clientMap.set(b.slug, b);
      });
      const mergedServer = serverBlogs.map((sb) => {
        const match = clientMap.get(sb.id) || clientMap.get(sb.slug);
        return match ? { ...sb, ...match } : sb;
      });
      const serverIds = new Set(serverBlogs.map((b) => b.id));
      const serverSlugs = new Set(serverBlogs.map((b) => b.slug));
      const newFromClient = clientBlogs.filter(
        (b) => !serverIds.has(b.id) && !serverSlugs.has(b.slug)
      );
      blogsToSync = [...mergedServer, ...newFromClient];
    } else {
      blogsToSync = serverBlogs;
    }

    // 1. Update serverless tmp & disk fallback
    saveBlogsServer(blogsToSync);

    // 2. Check if DynamoDB is configured with credentials
    if (!isDynamoDBConfigured()) {
      return NextResponse.json(
        {
          success: false,
          dynamoConfigured: false,
          error:
            'DynamoDB credentials not detected yet on AWS Amplify. You can enter your credentials directly in the Admin DynamoDB dialog, or trigger a redeploy in AWS Amplify Console after adding environment variables.',
        },
        { status: 400 }
      );
    }

    // 3. Try saving to DynamoDB with detailed diagnostics
    const result = await saveBlogsToDynamoDBDetailed(blogsToSync, creds);
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
