import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  BatchWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { BlogPost, Subscriber } from '@/types/blog';
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
    let raw = headerValue;
    if (typeof raw === 'string' && (raw.startsWith('%') || raw.includes('%22') || raw.includes('%7B'))) {
      try {
        raw = decodeURIComponent(raw);
      } catch {}
    }
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
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
 * Helper to determine if an item is a valid blog article and not a system record, subscriber, comment, or ghost item.
 */
export function isBlogItem(b: any): boolean {
  if (!b || !b.id) return false;
  const idStr = String(b.id);
  // System items, subscribers, comments, settings, logs, markers
  if (
    idStr.startsWith('__') ||
    idStr.startsWith('subscriber#') ||
    idStr.startsWith('comment#') ||
    idStr.startsWith('setting#')
  ) {
    return false;
  }
  const typeStr = String(b.type || '').toLowerCase();
  if (
    [
      'subscriber',
      'comment',
      'notification_settings',
      'notification_logs',
      'stats_reset_marker',
    ].includes(typeStr)
  ) {
    return false;
  }
  // Must have a real title or slug or content.
  // A ghost item with no content and no slug, or with default "Untitled Article", is not a blog.
  const title = String(b.title || '').trim();
  const slug = String(b.slug || '').trim();
  const content = String(b.content || '').trim();
  if (!content && !slug && (!title || title.toLowerCase() === 'untitled article' || title.toLowerCase() === 'untitled post')) {
    return false;
  }
  return true;
}

/**
 * Fetch all blogs from AWS DynamoDB (returns null on connection error so caller falls back gracefully).
 */
export async function getAllBlogsFromDynamoDB(): Promise<BlogPost[] | null> {
  if (!isDynamoDBConfigured()) return null;

  try {
    const client = getDynamoDBClient();
    const allItems: any[] = [];
    let lastEvaluatedKey: Record<string, any> | undefined = undefined;

    do {
      const command: ScanCommand = new ScanCommand({
        TableName: getDynamoTableName(),
        ExclusiveStartKey: lastEvaluatedKey,
      });
      const response = await client.send(command);

      if (response.Items) {
        allItems.push(...response.Items);
      }
      lastEvaluatedKey = response.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    // Auto-purge any corrupted ghost records from DynamoDB (e.g. empty drafts without content/slug/title)
    for (const item of allItems) {
      if (item && item.id) {
        const idStr = String(item.id);
        const typeStr = String(item.type || '').toLowerCase();
        const title = String(item.title || '').trim().toLowerCase();
        const content = String(item.content || '').trim();
        const slug = String(item.slug || '').trim();
        const email = String(item.email || '').trim();

        if (
          !idStr.startsWith('__') &&
          !idStr.startsWith('subscriber#') &&
          typeStr !== 'subscriber' &&
          !email &&
          !content &&
          !slug &&
          (!title || title === 'untitled article' || title === 'untitled post')
        ) {
          try {
            client.send(new DeleteCommand({ TableName: getDynamoTableName(), Key: { id: item.id } })).catch(() => {});
          } catch {}
        }
      }
    }

    return (allItems as BlogPost[])
      .filter((b) => isBlogItem(b))
      .map((b) => {
        // Strip heavy HTML and raw base64 data to keep bulk listing scans ultra-lightweight (<60KB total)
        const excerpt =
          b.excerpt ||
          b.subtitle ||
          (b.content ? b.content.replace(/<[^>]*>/g, '').trim().slice(0, 180) + '...' : '');

        let coverImage = b.coverImage;
        if (coverImage && coverImage.startsWith('data:image')) {
          // Serve through lightweight binary image endpoint to keep bulk payload ultra-lightweight (<60KB)
          coverImage = `/api/blogs/${encodeURIComponent(b.id)}/cover`;
        } else if (!coverImage) {
          const cat = (b.category || '').toLowerCase();
          if (cat.includes('insurance')) coverImage = '/images/insurance.svg';
          else if (cat.includes('bank') || cat.includes('finance') || cat.includes('money') || cat.includes('wealth')) coverImage = '/images/banking.svg';
          else if (cat.includes('psychology') || cat.includes('mind') || cat.includes('habit')) coverImage = '/images/mental-models.svg';
          else if (cat.includes('deep-work') || cat.includes('productivity')) coverImage = '/images/deep-work.svg';
          else coverImage = '/images/financial-independence.svg';
        }

        return {
          ...b,
          content: b.content || '',
          excerpt,
          coverImage,
          title: b.title || 'Untitled Article',
          slug: b.slug || `post-${b.id}`,
          category: b.category || 'General',
          subcategory: b.subcategory || '',
          tags: Array.isArray(b.tags) ? b.tags : [],
          author: b.author && typeof b.author === 'object' ? {
            name: b.author.name || 'Gaurav Kumar Singh',
            avatar: b.author.avatar || '',
            role: b.author.role || 'Editor'
          } : {
            name: 'Gaurav Kumar Singh',
            avatar: '',
            role: 'Editor'
          },
          views: typeof b.views === 'number' ? b.views : 0,
          likes: typeof b.likes === 'number' ? b.likes : 0,
          status: b.status || 'published',
        };
      });
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
    if (getRes.Item && isBlogItem(getRes.Item)) {
      return getRes.Item as BlogPost;
    }

    // 2. Scan by slug or alias if not matching ID (with pagination)
    let lastEvaluatedKey: Record<string, any> | undefined = undefined;
    do {
      const scanCommand: ScanCommand = new ScanCommand({
        TableName: getDynamoTableName(),
        FilterExpression: 'slug = :s OR id = :s',
        ExpressionAttributeValues: {
          ':s': idOrSlug,
        },
        ExclusiveStartKey: lastEvaluatedKey,
      });
      const scanRes = await client.send(scanCommand);
      if (scanRes.Items && scanRes.Items.length > 0) {
        const match = scanRes.Items.find(isBlogItem);
        if (match) return match as BlogPost;
      }
      lastEvaluatedKey = scanRes.LastEvaluatedKey;
    } while (lastEvaluatedKey);

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
    let coverImage = blog.coverImage;
    // Guard: Never overwrite a stored base64 or valid image with the /cover route proxy URL
    if (coverImage && coverImage.startsWith('/api/blogs/') && coverImage.endsWith('/cover')) {
      const existing = await getBlogByIdOrSlugFromDynamoDB(blog.id);
      if (existing && existing.coverImage && !existing.coverImage.startsWith('/api/blogs/')) {
        coverImage = existing.coverImage;
      }
    }

    const client = getDynamoDBClient();

    // Guard: Never wipe out existing content if incoming blog has empty content
    let finalContent = blog.content;
    if (!finalContent || !finalContent.trim()) {
      const existing = await getBlogByIdOrSlugFromDynamoDB(blog.id);
      if (existing && existing.content && existing.content.trim()) {
        finalContent = existing.content;
      }
    }

    const command = new PutCommand({
      TableName: getDynamoTableName(),
      Item: {
        ...blog,
        content: finalContent || '',
        coverImage: coverImage || '/images/financial-independence.svg',
        type: 'blog',
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
 * Ensure only one blog is featured in AWS DynamoDB: unfeatures all other blogs except the specified ID.
 */
export async function unfeatureOtherBlogsInDynamoDB(exceptId: string): Promise<number> {
  if (!isDynamoDBConfigured()) return 0;
  try {
    const client = getDynamoDBClient();
    const tableName = getDynamoTableName();
    const allBlogs = await getAllBlogsFromDynamoDB();
    if (!allBlogs || allBlogs.length === 0) return 0;

    let unfeaturedCount = 0;
    for (const b of allBlogs) {
      if (b.id !== exceptId && b.featured) {
        try {
          await client.send(
            new UpdateCommand({
              TableName: tableName,
              Key: { id: b.id },
              UpdateExpression: 'SET featured = :f, updatedAt = :now',
              ExpressionAttributeValues: {
                ':f': false,
                ':now': new Date().toISOString(),
              },
            })
          );
          unfeaturedCount++;
        } catch (err) {
          console.warn(`Failed to unfeature blog ${b.id} in DynamoDB:`, err);
        }
      }
    }
    return unfeaturedCount;
  } catch (err) {
    console.warn('Error in unfeatureOtherBlogsInDynamoDB:', err);
    return 0;
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
        type: 'blog',
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

/**
 * Atomically increment views for a blog in AWS DynamoDB.
 */
export async function incrementBlogViewsInDynamoDB(id: string): Promise<number | null> {
  if (!isDynamoDBConfigured() || !id) return null;
  try {
    const client = getDynamoDBClient();
    const command = new UpdateCommand({
      TableName: getDynamoTableName(),
      Key: { id },
      UpdateExpression: 'SET #views = if_not_exists(#views, :zero) + :inc, #updatedAt = :now',
      ExpressionAttributeNames: {
        '#views': 'views',
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: {
        ':zero': 0,
        ':inc': 1,
        ':now': new Date().toISOString(),
      },
      ReturnValues: 'UPDATED_NEW',
    });
    const res = await client.send(command);
    return typeof res.Attributes?.views === 'number' ? res.Attributes.views : null;
  } catch (error) {
    console.error(`DynamoDB view increment error for ${id}:`, error);
    return null;
  }
}

/**
 * Atomically increment likes for a blog in AWS DynamoDB.
 */
export async function incrementBlogLikesInDynamoDB(id: string): Promise<number | null> {
  if (!isDynamoDBConfigured() || !id) return null;
  try {
    const client = getDynamoDBClient();
    const command = new UpdateCommand({
      TableName: getDynamoTableName(),
      Key: { id },
      UpdateExpression: 'SET #likes = if_not_exists(#likes, :zero) + :inc, #updatedAt = :now',
      ExpressionAttributeNames: {
        '#likes': 'likes',
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: {
        ':zero': 0,
        ':inc': 1,
        ':now': new Date().toISOString(),
      },
      ReturnValues: 'UPDATED_NEW',
    });
    const res = await client.send(command);
    return typeof res.Attributes?.likes === 'number' ? res.Attributes.likes : null;
  } catch (error) {
    console.error(`DynamoDB like increment error for ${id}:`, error);
    return null;
  }
}

/**
 * Atomically decrement likes for a blog in AWS DynamoDB (never below 0).
 */
export async function decrementBlogLikesInDynamoDB(id: string): Promise<number | null> {
  if (!isDynamoDBConfigured() || !id) return null;
  try {
    const current = await getBlogByIdOrSlugFromDynamoDB(id);
    const newLikes = Math.max(0, (current?.likes || 0) - 1);
    const client = getDynamoDBClient();
    const command = new UpdateCommand({
      TableName: getDynamoTableName(),
      Key: { id },
      UpdateExpression: 'SET #likes = :val, #updatedAt = :now',
      ExpressionAttributeNames: {
        '#likes': 'likes',
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: {
        ':val': newLikes,
        ':now': new Date().toISOString(),
      },
      ReturnValues: 'UPDATED_NEW',
    });
    const res = await client.send(command);
    return typeof res.Attributes?.likes === 'number' ? res.Attributes.likes : newLikes;
  } catch (error) {
    console.error(`DynamoDB like decrement error for ${id}:`, error);
    return null;
  }
}

/**
 * Fetch all actual subscribers from AWS DynamoDB.
 */
export async function getAllSubscribersFromDynamoDB(): Promise<Subscriber[] | null> {
  if (!isDynamoDBConfigured()) return null;
  try {
    const client = getDynamoDBClient();
    const allItems: any[] = [];
    let lastEvaluatedKey: Record<string, any> | undefined = undefined;

    do {
      const command: ScanCommand = new ScanCommand({
        TableName: getDynamoTableName(),
        FilterExpression: '#type = :sub OR begins_with(#id, :prefix)',
        ExpressionAttributeNames: {
          '#type': 'type',
          '#id': 'id',
        },
        ExpressionAttributeValues: {
          ':sub': 'subscriber',
          ':prefix': 'subscriber#',
        },
        ExclusiveStartKey: lastEvaluatedKey,
      });
      const res = await client.send(command);
      if (res.Items) {
        allItems.push(...res.Items);
      }
      lastEvaluatedKey = res.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    return (allItems as any[])
      .filter((item) => item && item.email && !item.email.includes('example.com'))
      .map((item) => ({
        id: String(item.id),
        email: String(item.email),
        name: item.name ? String(item.name) : undefined,
        subscribedAt: String(item.subscribedAt || new Date().toISOString()),
        status: (item.status === 'unsubscribed' ? 'unsubscribed' : 'active') as 'active' | 'unsubscribed',
      }));
  } catch (error) {
    console.warn('DynamoDB Subscribers Scan Notice:', error);
    return null;
  }
}

/**
 * Save an actual subscriber to AWS DynamoDB.
 */
export async function saveSubscriberToDynamoDB(sub: Subscriber): Promise<boolean> {
  if (!isDynamoDBConfigured() || !sub || !sub.email) return false;
  try {
    const client = getDynamoDBClient();
    const cleanEmail = sub.email.toLowerCase().trim();
    const command = new PutCommand({
      TableName: getDynamoTableName(),
      Item: {
        id: `subscriber#${cleanEmail}`,
        type: 'subscriber',
        email: cleanEmail,
        name: sub.name || cleanEmail.split('@')[0],
        subscribedAt: sub.subscribedAt || new Date().toISOString(),
        status: sub.status || 'active',
        updatedAt: new Date().toISOString(),
      },
    });
    await client.send(command);
    return true;
  } catch (error) {
    console.error(`DynamoDB saveSubscriber Error for ${sub.email}:`, error);
    return false;
  }
}

/**
 * Delete a subscriber by ID or Email from AWS DynamoDB.
 */
export async function deleteSubscriberFromDynamoDB(idOrEmail: string): Promise<boolean> {
  if (!isDynamoDBConfigured() || !idOrEmail) return false;
  try {
    const client = getDynamoDBClient();
    const targetId = idOrEmail.startsWith('subscriber#')
      ? idOrEmail
      : `subscriber#${idOrEmail.toLowerCase().trim()}`;
    const command = new DeleteCommand({
      TableName: getDynamoTableName(),
      Key: { id: targetId },
    });
    await client.send(command);
    return true;
  } catch (error) {
    console.error(`DynamoDB deleteSubscriber Error for ${idOrEmail}:`, error);
    return false;
  }
}

/**
 * Purge any legacy sample subscribers from DynamoDB.
 */
export async function purgeSampleSubscribersFromDynamoDB(): Promise<void> {
  if (!isDynamoDBConfigured()) return;
  try {
    const client = getDynamoDBClient();
    const command = new ScanCommand({
      TableName: getDynamoTableName(),
      FilterExpression: '#type = :sub OR begins_with(#id, :prefix) OR contains(#email, :ex)',
      ExpressionAttributeNames: {
        '#type': 'type',
        '#id': 'id',
        '#email': 'email',
      },
      ExpressionAttributeValues: {
        ':sub': 'subscriber',
        ':prefix': 'subscriber#',
        ':ex': 'example.com',
      },
    });
    const res = await client.send(command);
    if (res.Items && res.Items.length > 0) {
      for (const item of res.Items) {
        if (item.email && item.email.includes('example.com')) {
          await client.send(
            new DeleteCommand({
              TableName: getDynamoTableName(),
              Key: { id: item.id },
            })
          );
        }
      }
    }
  } catch {}
}

/**
 * Save notification settings to AWS DynamoDB
 */
export async function saveNotificationSettingsToDynamoDB(settings: Record<string, unknown>): Promise<boolean> {
  if (!isDynamoDBConfigured()) return false;
  try {
    const client = getDynamoDBClient();
    const command = new PutCommand({
      TableName: getDynamoTableName(),
      Item: {
        id: '__tmu_notification_settings',
        type: 'notification_settings',
        ...settings,
        updatedAt: new Date().toISOString(),
      },
    });
    await client.send(command);
    return true;
  } catch (error) {
    console.warn('DynamoDB saveNotificationSettings Notice:', error);
    return false;
  }
}

/**
 * Fetch notification settings from AWS DynamoDB
 */
export async function getNotificationSettingsFromDynamoDB(): Promise<Record<string, unknown> | null> {
  if (!isDynamoDBConfigured()) return null;
  try {
    const client = getDynamoDBClient();
    const command = new GetCommand({
      TableName: getDynamoTableName(),
      Key: { id: '__tmu_notification_settings' },
    });
    const res = await client.send(command);
    if (res.Item) {
      return res.Item as Record<string, unknown>;
    }
  } catch (error) {
    console.warn('DynamoDB getNotificationSettings Notice:', error);
  }
  return null;
}

/**
 * Save notification logs to AWS DynamoDB
 */
export async function saveNotificationLogsToDynamoDB(logs: Record<string, unknown>[]): Promise<boolean> {
  if (!isDynamoDBConfigured()) return false;
  try {
    const client = getDynamoDBClient();
    const command = new PutCommand({
      TableName: getDynamoTableName(),
      Item: {
        id: '__tmu_notification_logs',
        type: 'notification_logs',
        logs: (logs || []).slice(0, 100),
        updatedAt: new Date().toISOString(),
      },
    });
    await client.send(command);
    return true;
  } catch (error) {
    console.warn('DynamoDB saveNotificationLogs Notice:', error);
    return false;
  }
}

/**
 * Fetch notification logs from AWS DynamoDB
 */
export async function getNotificationLogsFromDynamoDB(): Promise<Record<string, unknown>[] | null> {
  if (!isDynamoDBConfigured()) return null;
  try {
    const client = getDynamoDBClient();
    const command = new GetCommand({
      TableName: getDynamoTableName(),
      Key: { id: '__tmu_notification_logs' },
    });
    const res = await client.send(command);
    if (res.Item && Array.isArray(res.Item.logs)) {
      return res.Item.logs as Record<string, unknown>[];
    }
  } catch (error) {
    console.warn('DynamoDB getNotificationLogs Notice:', error);
  }
  return null;
}

/**
 * Reset all views and likes to 0 across all blogs in AWS DynamoDB
 */
export async function resetAllStatsInDynamoDB(force = false): Promise<boolean> {
  if (!isDynamoDBConfigured()) return false;
  try {
    const client = getDynamoDBClient();

    if (!force) {
      const marker = await client.send(
        new GetCommand({
          TableName: getDynamoTableName(),
          Key: { id: '__tmu_stats_reset_v2' },
        })
      );
      if (marker.Item) {
        return true;
      }
    }

    console.log('[DynamoDB] Performing reset of all views and likes to 0...');
    const allItems: any[] = [];
    let lastEvaluatedKey: Record<string, any> | undefined = undefined;
    do {
      const scanRes: any = await client.send(
        new ScanCommand({
          TableName: getDynamoTableName(),
          ExclusiveStartKey: lastEvaluatedKey,
        })
      );
      if (scanRes.Items) allItems.push(...scanRes.Items);
      lastEvaluatedKey = scanRes.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    if (allItems.length > 0) {
      const blogs = (allItems as BlogPost[]).filter((b) => isBlogItem(b));
      for (const b of blogs) {
        try {
          await client.send(
            new UpdateCommand({
              TableName: getDynamoTableName(),
              Key: { id: b.id },
              UpdateExpression: 'SET views = :zero, likes = :zero',
              ExpressionAttributeValues: {
                ':zero': 0,
              },
            })
          );
        } catch (updateErr) {
          console.warn(`Failed to reset stats for blog ${b.id}:`, updateErr);
        }
      }
    }

    // Set the reset marker item in DynamoDB so it runs only once
    await client.send(
      new PutCommand({
        TableName: getDynamoTableName(),
        Item: {
          id: '__tmu_stats_reset_v2',
          type: 'stats_reset_marker',
          resetAt: new Date().toISOString(),
        },
      })
    );

    return true;
  } catch (error) {
    console.error('DynamoDB resetAllStats Error:', error);
    return false;
  }
}
