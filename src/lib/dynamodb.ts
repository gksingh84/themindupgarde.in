import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
  PutCommand,
  DeleteCommand,
  BatchWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { BlogPost } from '@/types/blog';

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'tmu_blogs';
const AWS_REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'ap-south-1';

let docClientInstance: DynamoDBDocumentClient | null = null;

export function isDynamoDBConfigured(): boolean {
  // Configured if explicit table name and either explicit AWS creds or running in AWS Amplify / Lambda
  const hasTable = Boolean(process.env.DYNAMODB_TABLE_NAME);
  const hasExplicitCreds = Boolean(
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
  );
  const isAwsLambda = Boolean(
    process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.AWS_EXECUTION_ENV
  );

  return hasTable && (hasExplicitCreds || isAwsLambda);
}

export function getDynamoDBClient(): DynamoDBDocumentClient {
  if (docClientInstance) return docClientInstance;

  const clientConfig: any = {
    region: AWS_REGION,
  };

  // Only pass explicit credentials if provided in env vars (e.g. Amplify Console)
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    clientConfig.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID.trim(),
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY.trim(),
    };
  }

  const rawClient = new DynamoDBClient(clientConfig);
  docClientInstance = DynamoDBDocumentClient.from(rawClient, {
    marshallOptions: {
      removeUndefinedValues: true,
      convertEmptyValues: true,
    },
    unmarshallOptions: {
      wrapNumbers: false,
    },
  });

  return docClientInstance;
}

/**
 * Fetch all blogs from AWS DynamoDB.
 */
export async function getAllBlogsFromDynamoDB(): Promise<BlogPost[]> {
  if (!isDynamoDBConfigured()) return [];

  try {
    const client = getDynamoDBClient();
    const command = new ScanCommand({
      TableName: TABLE_NAME,
    });
    const response = await client.send(command);

    if (!response.Items || response.Items.length === 0) {
      return [];
    }

    return response.Items as BlogPost[];
  } catch (error) {
    console.error('DynamoDB Scan Error:', error);
    return [];
  }
}

/**
 * Fetch a single blog by ID or Slug from AWS DynamoDB.
 */
export async function getBlogByIdOrSlugFromDynamoDB(
  idOrSlug: string
): Promise<BlogPost | null> {
  if (!isDynamoDBConfigured() || !idOrSlug) return null;

  try {
    const client = getDynamoDBClient();

    // 1. First try direct Primary Key GetItem (fastest, O(1), 0.5 RCU)
    const getCommand = new GetCommand({
      TableName: TABLE_NAME,
      Key: { id: idOrSlug },
    });
    const getRes = await client.send(getCommand);
    if (getRes.Item) {
      return getRes.Item as BlogPost;
    }

    // 2. If not found by ID, scan by slug or alias
    const scanCommand = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: 'slug = :s OR id = :s',
      ExpressionAttributeValues: {
        ':s': idOrSlug,
      },
    });
    const scanRes = await client.send(scanCommand);
    if (scanRes.Items && scanRes.Items.length > 0) {
      return scanRes.Items[0] as BlogPost;
    }

    return null;
  } catch (error) {
    console.error(`DynamoDB Get Error for ${idOrSlug}:`, error);
    return null;
  }
}

/**
 * Put or update a blog post in AWS DynamoDB.
 */
export async function saveBlogToDynamoDB(blog: BlogPost): Promise<boolean> {
  if (!isDynamoDBConfigured() || !blog || !blog.id) return false;

  try {
    const client = getDynamoDBClient();
    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        ...blog,
        updatedAt: new Date().toISOString(),
      },
    });
    await client.send(command);
    return true;
  } catch (error) {
    console.error(`DynamoDB Put Error for ${blog.id}:`, error);
    return false;
  }
}

/**
 * Delete a blog post by ID from AWS DynamoDB.
 */
export async function deleteBlogFromDynamoDB(id: string): Promise<boolean> {
  if (!isDynamoDBConfigured() || !id) return false;

  try {
    const client = getDynamoDBClient();
    const command = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { id },
    });
    await client.send(command);
    return true;
  } catch (error) {
    console.error(`DynamoDB Delete Error for ${id}:`, error);
    return false;
  }
}

/**
 * Batch save multiple blogs to AWS DynamoDB (chunks of 25).
 */
export async function saveBlogsBatchToDynamoDB(blogs: BlogPost[]): Promise<boolean> {
  if (!isDynamoDBConfigured() || !blogs || blogs.length === 0) return false;

  try {
    const client = getDynamoDBClient();
    const CHUNK_SIZE = 25;

    for (let i = 0; i < blogs.length; i += CHUNK_SIZE) {
      const chunk = blogs.slice(i, i + CHUNK_SIZE);
      const putRequests = chunk.map((blog) => ({
        PutRequest: {
          Item: {
            ...blog,
            updatedAt: new Date().toISOString(),
          },
        },
      }));

      const batchCommand = new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAME]: putRequests,
        },
      });

      await client.send(batchCommand);
    }

    return true;
  } catch (error) {
    console.error('DynamoDB BatchWrite Error:', error);
    return false;
  }
}

/**
 * If the DynamoDB table is empty, seed it with the initial blogs.
 */
export async function seedDynamoDBIfEmpty(seedBlogs: BlogPost[]): Promise<boolean> {
  if (!isDynamoDBConfigured() || !seedBlogs || seedBlogs.length === 0) return false;

  try {
    const existing = await getAllBlogsFromDynamoDB();
    if (existing.length === 0) {
      console.log(`DynamoDB table ${TABLE_NAME} is empty. Seeding ${seedBlogs.length} initial blogs...`);
      return await saveBlogsBatchToDynamoDB(seedBlogs);
    }
    return true;
  } catch (error) {
    console.error('DynamoDB seed error:', error);
    return false;
  }
}
