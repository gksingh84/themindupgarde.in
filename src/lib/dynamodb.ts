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
import fs from 'fs';
import path from 'path';
import os from 'os';

const DYNAMO_CONFIG_FILE = path.join(os.tmpdir(), 'tmu_dynamo_config.json');

// Helper to check multiple environment variable aliases (Amplify blocks variables starting with "AWS_")
function getEnvValue(keys: string[], fallback = ''): string {
  for (const k of keys) {
    const val = process.env[k];
    if (val && typeof val === 'string' && val.trim() !== '') {
      return val.trim();
    }
  }
  return fallback;
}

let runtimeConfig: {
  tableName?: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
} | null = null;

function loadDiskConfig() {
  if (runtimeConfig?.accessKeyId && runtimeConfig?.secretAccessKey) return;
  try {
    if (fs.existsSync(DYNAMO_CONFIG_FILE)) {
      const raw = fs.readFileSync(DYNAMO_CONFIG_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && parsed.accessKeyId) {
        runtimeConfig = { ...(runtimeConfig || {}), ...parsed };
      }
    }
  } catch {}

  // Parse .env.production or .env files directly if present
  try {
    const envPaths = [
      path.join(process.cwd(), '.env.production'),
      path.join(process.cwd(), '.env'),
      path.join(process.cwd(), '.env.local'),
    ];
    for (const p of envPaths) {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf-8');
        const lines = raw.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const idx = trimmed.indexOf('=');
          if (idx > -1) {
            const k = trimmed.slice(0, idx).trim();
            const v = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
            if (!process.env[k] && v) {
              process.env[k] = v;
            }
          }
        }
      }
    }
  } catch {}
}

export function setDynamoRuntimeConfig(config: {
  tableName?: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}) {
  runtimeConfig = { ...(runtimeConfig || {}), ...config };
  docClientInstance = null; // Re-create client with new credentials
  try {
    fs.writeFileSync(DYNAMO_CONFIG_FILE, JSON.stringify(runtimeConfig), 'utf-8');
  } catch {}
}

export function applyDynamoCredsHeader(headerValue?: string | null) {
  if (!headerValue) return;
  try {
    const parsed = typeof headerValue === 'string' ? JSON.parse(headerValue) : headerValue;
    if (parsed && (parsed.accessKeyId || parsed.secretAccessKey)) {
      setDynamoRuntimeConfig(parsed);
    }
  } catch {}
}

export function getDynamoTableName(): string {
  loadDiskConfig();
  if (runtimeConfig?.tableName) return runtimeConfig.tableName;
  return getEnvValue(
    ['DYNAMODB_TABLE_NAME', 'TMU_DYNAMODB_TABLE_NAME', 'DYNAMO_TABLE_NAME'],
    'tmu_blogs'
  );
}

export function getDynamoRegion(): string {
  loadDiskConfig();
  if (runtimeConfig?.region) return runtimeConfig.region;
  return getEnvValue(
    [
      'APP_AWS_REGION',
      'MY_AWS_REGION',
      'DYNAMO_REGION',
      'AWS_REGION',
      'AWS_DEFAULT_REGION',
    ],
    'ap-south-1'
  );
}

export function getDynamoAccessKeyId(): string {
  loadDiskConfig();
  if (runtimeConfig?.accessKeyId) return runtimeConfig.accessKeyId;
  return getEnvValue([
    'APP_AWS_ACCESS_KEY_ID',
    'DYNAMODB_ACCESS_KEY_ID',
    'DYNAMO_ACCESS_KEY_ID',
    'TMU_AWS_ACCESS_KEY_ID',
    'TMU_DYNAMO_ACCESS_KEY_ID',
    'MY_AWS_ACCESS_KEY_ID',
    'AWS_ACCESS_KEY_ID',
  ]);
}

export function getDynamoSecretAccessKey(): string {
  loadDiskConfig();
  if (runtimeConfig?.secretAccessKey) return runtimeConfig.secretAccessKey;
  return getEnvValue([
    'APP_AWS_SECRET_ACCESS_KEY',
    'DYNAMODB_SECRET_ACCESS_KEY',
    'DYNAMO_SECRET_ACCESS_KEY',
    'TMU_AWS_SECRET_ACCESS_KEY',
    'TMU_DYNAMO_SECRET_ACCESS_KEY',
    'MY_AWS_SECRET_ACCESS_KEY',
    'AWS_SECRET_ACCESS_KEY',
  ]);
}

let docClientInstance: DynamoDBDocumentClient | null = null;

export function isDynamoDBConfigured(): boolean {
  loadDiskConfig();
  const hasTable = Boolean(getDynamoTableName());
  const hasExplicitCreds = Boolean(
    getDynamoAccessKeyId() && getDynamoSecretAccessKey()
  );

  return hasTable && hasExplicitCreds;
}

export function getDynamoDBClient(): DynamoDBDocumentClient {
  if (docClientInstance) return docClientInstance;

  const clientConfig: any = {
    region: getDynamoRegion(),
  };

  const accessKeyId = getDynamoAccessKeyId();
  const secretAccessKey = getDynamoSecretAccessKey();

  if (accessKeyId && secretAccessKey) {
    clientConfig.credentials = {
      accessKeyId,
      secretAccessKey,
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
 * Fetch all blogs from AWS DynamoDB (returns null on connection error so caller falls back gracefully).
 */
export async function getAllBlogsFromDynamoDB(): Promise<BlogPost[] | null> {
  if (!isDynamoDBConfigured()) return null;

  try {
    const client = getDynamoDBClient();
    const command = new ScanCommand({
      TableName: getDynamoTableName(),
    });
    const response = await client.send(command);

    if (!response.Items) {
      return [];
    }

    return response.Items as BlogPost[];
  } catch (error) {
    console.warn('DynamoDB Scan Notice (will use local fallback):', error);
    return null;
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

    // 1. Direct Primary Key GetItem (fastest, O(1), 0.5 RCU)
    const getCommand = new GetCommand({
      TableName: getDynamoTableName(),
      Key: { id: idOrSlug },
    });
    const getRes = await client.send(getCommand);
    if (getRes.Item) {
      return getRes.Item as BlogPost;
    }

    // 2. Scan by slug or alias if not matching ID
    const scanCommand = new ScanCommand({
      TableName: getDynamoTableName(),
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
      TableName: getDynamoTableName(),
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
      TableName: getDynamoTableName(),
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
 * Put each blog individually into AWS DynamoDB with detailed error diagnostics.
 */
export async function saveBlogsToDynamoDBDetailed(
  blogs: BlogPost[],
  overrideConfig?: {
    tableName?: string;
    region?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
  }
): Promise<{ success: boolean; error?: string; savedCount?: number }> {
  if (overrideConfig?.accessKeyId && overrideConfig?.secretAccessKey) {
    setDynamoRuntimeConfig(overrideConfig);
  }
  if (!isDynamoDBConfigured()) {
    return {
      success: false,
      error: 'DynamoDB environment variables not detected (missing APP_AWS_ACCESS_KEY_ID or APP_AWS_SECRET_ACCESS_KEY).',
    };
  }
  if (!blogs || blogs.length === 0) {
    return { success: false, error: 'No articles provided to save.' };
  }

  try {
    const client = getDynamoDBClient();
    const tableName = getDynamoTableName();

    let savedCount = 0;
    for (const blog of blogs) {
      if (!blog || !blog.id) continue;
      const cleanItem: any = {
        ...blog,
        id: String(blog.id),
        slug: String(blog.slug || `post-${blog.id}`),
        updatedAt: new Date().toISOString(),
      };

      await client.send(
        new PutCommand({
          TableName: tableName,
          Item: cleanItem,
        })
      );
      savedCount++;
    }

    return { success: true, savedCount };
  } catch (error: any) {
    console.error('DynamoDB Detailed Put Error:', error);
    const errorMsg = error?.message || error?.name || String(error);
    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Save multiple blogs to AWS DynamoDB.
 */
export async function saveBlogsBatchToDynamoDB(blogs: BlogPost[]): Promise<boolean> {
  const result = await saveBlogsToDynamoDBDetailed(blogs);
  return result.success;
}

/**
 * If the DynamoDB table is empty, seed it with the initial blogs.
 */
export async function seedDynamoDBIfEmpty(seedBlogs: BlogPost[]): Promise<boolean> {
  if (!isDynamoDBConfigured() || !seedBlogs || seedBlogs.length === 0) return false;

  try {
    const existing = await getAllBlogsFromDynamoDB();
    if (existing !== null && existing.length === 0) {
      console.log(`DynamoDB table ${getDynamoTableName()} is empty. Seeding ${seedBlogs.length} initial blogs...`);
      return await saveBlogsBatchToDynamoDB(seedBlogs);
    }
    return Boolean(existing && existing.length > 0);
  } catch (error) {
    console.warn('DynamoDB seed notice:', error);
    return false;
  }
}
