/**
 * The Mind Upgrade - WordPress XML Migration Engine
 * 
 * Reads WordPress WXR (XML export) files, parses posts, maps to TMU's BlogPost data model,
 * checks for existing blogs (skipping duplicates by title, slug, or ID), and inserts new articles
 * into DynamoDB and the application's local database.
 * 
 * Usage:
 *   node scripts/migrate-wordpress-xml.js [path-to-export.xml] [options]
 * 
 * Options:
 *   --dry-run               Parse and simulate migration without writing to database
 *   --api=<url>             Import via REST API (e.g. --api=https://themindupgrade.in/api/blogs)
 *   --api-key=<pwd>         Admin password/credentials header for API mode
 *   --include-drafts        Include drafts from WordPress (default: only published)
 *   --force                 Overwrite existing articles instead of skipping
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

// 1. Load environment variables from .env.production, .env, or .env.local
function loadEnvironment() {
  const envFiles = ['.env.production', '.env.local', '.env'];
  for (const file of envFiles) {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        for (const line of content.split('\n')) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
            const idx = trimmed.indexOf('=');
            const k = trimmed.slice(0, idx).trim();
            const v = trimmed.slice(idx + 1).trim();
            if (k && !process.env[k]) {
              process.env[k] = v;
            }
          }
        }
      } catch {}
    }
  }
}
loadEnvironment();

// Category Mapping Dictionary
const TMU_CATEGORIES = [
  'Personal Finance',
  'Insurance',
  'Psychology and Self-Improvement',
  'Economy and Current Affairs',
  'Daily Insights',
];

const CATEGORY_MAP = {
  'personal finance': 'Personal Finance',
  'finance': 'Personal Finance',
  'banking': 'Personal Finance',
  'money': 'Personal Finance',
  'investing': 'Personal Finance',
  'wealth': 'Personal Finance',
  'loans': 'Personal Finance',
  'credit': 'Personal Finance',
  'taxes': 'Personal Finance',
  'income tax': 'Personal Finance',
  'taxation': 'Personal Finance',

  'insurance': 'Insurance',
  'life insurance': 'Insurance',
  'health insurance': 'Insurance',
  'motor insurance': 'Insurance',
  'term insurance': 'Insurance',
  'mediclaim': 'Insurance',

  'psychology': 'Psychology and Self-Improvement',
  'self-improvement': 'Psychology and Self-Improvement',
  'self improvement': 'Psychology and Self-Improvement',
  'mental models': 'Psychology and Self-Improvement',
  'mindset': 'Psychology and Self-Improvement',
  'productivity': 'Psychology and Self-Improvement',
  'habits': 'Psychology and Self-Improvement',
  'thinking': 'Psychology and Self-Improvement',

  'economy': 'Economy and Current Affairs',
  'current affairs': 'Economy and Current Affairs',
  'rbi': 'Economy and Current Affairs',
  'macroeconomics': 'Economy and Current Affairs',
  'economics': 'Economy and Current Affairs',
  'monetary policy': 'Economy and Current Affairs',
  'inflation': 'Economy and Current Affairs',

  'daily insights': 'Daily Insights',
  'insights': 'Daily Insights',
  'facts': 'Daily Insights',
  'awareness': 'Daily Insights',
  'case study': 'Daily Insights',
};

// Fallback illustrations by category
const DEFAULT_COVERS = {
  'Personal Finance': '/images/financial-independence.svg',
  'Insurance': '/images/insurance.svg',
  'Psychology and Self-Improvement': '/images/mental-models.svg',
  'Economy and Current Affairs': '/images/deep-work.svg',
  'Daily Insights': '/images/banking.svg',
};

// Decode common HTML entities
function decodeHtmlEntities(str = '') {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8230;/g, '…')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#038;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// Clean WordPress Gutenberg block comments & shortcodes
function cleanWordPressContent(html = '') {
  if (!html) return '';

  let cleaned = html
    .replace(/<!--\s*\/?wp:[^>]*-->/gi, '')
    .replace(/<p>\s*(?:&nbsp;|\s)*<\/p>/gi, '')
    .replace(/\[caption[^\]]*\]([\s\S]*?)\[\/caption\]/gi, '$1')
    .replace(/\[\/?(gallery|embed|video|audio)[^\]]*\]/gi, '')
    .trim();

  if (!cleaned.includes('<p>') && !cleaned.includes('<div>')) {
    cleaned = cleaned
      .split(/\n\s*\n/)
      .map((p) => `<p>${p.trim()}</p>`)
      .join('\n');
  }

  return cleaned;
}

// Format WordPress date (YYYY-MM-DD HH:MM:SS) to TMU format (DD/MM/YYYY)
function formatWpDate(dateStr) {
  if (!dateStr) {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${d.getFullYear()}`;
  }

  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      return `${day}/${month}/${d.getFullYear()}`;
    }
  } catch {}

  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`;
  }

  return dateStr;
}

// Normalize string for fuzzy title matching
function normalizeString(str = '') {
  return decodeHtmlEntities(str)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

// Extract XML tag value handling both CDATA and plain text
function extractTagValue(xmlBlock, tagName) {
  const cdataRegex = new RegExp(`<${tagName}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tagName}>`, 'i');
  const cdataMatch = xmlBlock.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1].trim();

  const plainRegex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const plainMatch = xmlBlock.match(plainRegex);
  if (plainMatch) return plainMatch[1].trim();

  return '';
}

// Extract all matching tag values (e.g. for multiple categories/tags)
function extractMultipleTags(xmlBlock, tagName) {
  const results = [];
  const regex = new RegExp(`<${tagName}([^>]*)>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))<\\/${tagName}>`, 'gi');
  let match;
  while ((match = regex.exec(xmlBlock)) !== null) {
    const attrs = match[1] || '';
    const val = (match[2] !== undefined ? match[2] : match[3] || '').trim();
    if (val) {
      results.push({ attrs, val });
    }
  }
  return results;
}

// Parse WordPress XML / WXR file
function parseWordPressXml(xmlContent) {
  console.log('🔍 Parsing WordPress XML structure...');

  const itemBlocks = xmlContent.split(/<item>/i).slice(1).map((b) => b.split(/<\/item>/i)[0]);
  console.log(`📦 Found ${itemBlocks.length} total raw items in export.`);

  // 1. Build attachment mapping for featured images
  const attachmentMap = new Map();
  for (const block of itemBlocks) {
    const postType = extractTagValue(block, 'wp:post_type');
    if (postType === 'attachment') {
      const postId = extractTagValue(block, 'wp:post_id');
      const attachmentUrl = extractTagValue(block, 'wp:attachment_url') || extractTagValue(block, 'guid');
      if (postId && attachmentUrl) {
        attachmentMap.set(postId, attachmentUrl);
      }
    }
  }
  console.log(`🖼️  Mapped ${attachmentMap.size} media attachments for featured cover images.`);

  // 2. Extract valid blog articles
  const articles = [];
  for (const block of itemBlocks) {
    const postType = extractTagValue(block, 'wp:post_type');
    if (postType !== 'post') {
      continue; // Skip pages, revisions, attachments, nav menus
    }

    const wpStatus = extractTagValue(block, 'wp:status') || 'publish';
    if (wpStatus === 'trash' || wpStatus === 'auto-draft' || wpStatus === 'inherit') {
      continue; // Skip trash and auto-drafts
    }

    const rawTitle = extractTagValue(block, 'title');
    const title = decodeHtmlEntities(rawTitle || 'Untitled Post');

    let slug = extractTagValue(block, 'wp:post_name');
    if (!slug) {
      slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
    slug = decodeURIComponent(slug).toLowerCase().trim();

    const postId = extractTagValue(block, 'wp:post_id') || `wp-${Date.now()}-${articles.length}`;
    const postDate = extractTagValue(block, 'wp:post_date') || extractTagValue(block, 'pubDate');
    const publishedAt = formatWpDate(postDate);

    const author = extractTagValue(block, 'dc:creator') || 'Gaurav Kumar Singh';
    const content = cleanWordPressContent(extractTagValue(block, 'content:encoded'));
    
    let rawExcerpt = extractTagValue(block, 'excerpt:encoded');
    if (!rawExcerpt) {
      const textOnly = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      const firstSentence = textOnly.split(/[.?!]\s/)[0];
      rawExcerpt = firstSentence ? `${firstSentence.slice(0, 180)}...` : '';
    }
    const excerpt = decodeHtmlEntities(rawExcerpt);

    // Categories & Tags
    const catTags = extractMultipleTags(block, 'category');
    let category = 'Personal Finance';
    let subcategory = '';
    const tags = [];

    for (const item of catTags) {
      const isTag = item.attrs.includes('domain="post_tag"');
      const isCat = item.attrs.includes('domain="category"');
      const val = decodeHtmlEntities(item.val);

      if (isTag) {
        if (!tags.includes(val)) tags.push(val);
      } else if (isCat) {
        const lower = val.toLowerCase();
        if (CATEGORY_MAP[lower]) {
          category = CATEGORY_MAP[lower];
        } else if (TMU_CATEGORIES.includes(val)) {
          category = val;
        } else if (!subcategory) {
          subcategory = val;
        }
      }
    }

    // Featured Image
    let coverImage = '';
    const metaBlocks = block.split(/<wp:postmeta>/i).slice(1);
    for (const meta of metaBlocks) {
      const key = extractTagValue(meta, 'wp:meta_key');
      const val = extractTagValue(meta, 'wp:meta_value');
      if (key === '_thumbnail_id' && attachmentMap.has(val)) {
        coverImage = attachmentMap.get(val);
        break;
      }
    }

    // Fallback image: first <img> in body, or default category SVG
    if (!coverImage) {
      const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (imgMatch && imgMatch[1]) {
        coverImage = imgMatch[1];
      } else {
        coverImage = DEFAULT_COVERS[category] || '/images/financial-independence.svg';
      }
    }

    // Word count & read time
    const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
    const estMinutes = Math.max(1, Math.ceil(wordCount / 200));
    const readTime = `${estMinutes} min read`;

    const article = {
      id: postId,
      slug,
      title,
      subtitle: excerpt.slice(0, 160) || undefined,
      excerpt,
      content,
      category,
      subcategory: subcategory || undefined,
      tags: tags.length > 0 ? tags : [category],
      coverImage,
      publishedAt,
      readTime,
      status: wpStatus === 'publish' ? 'published' : 'draft',
      featured: false,
      editorsPick: false,
      views: 0,
      likes: 0,
      author: {
        name: author === 'gaurav' || author === 'admin' ? 'Gaurav Kumar Singh' : author,
        avatar: '/images/gaurav-kumar-singh.jpg',
        role: 'Author',
        showPhoto: true,
      },
      seo: {
        metaTitle: title,
        metaDescription: excerpt,
        canonicalUrl: `https://themindupgrade.in/blog/${slug}`,
      },
    };

    articles.push(article);
  }

  return articles;
}

// Fetch live blogs directly from the website over HTTPS
function fetchLiveWebsiteBlogs(baseUrl = 'https://themindupgrade.in') {
  return new Promise((resolve) => {
    try {
      const url = `${baseUrl.replace(/\/+$/, '')}/api/blogs?includeDrafts=true`;
      const isHttps = url.startsWith('https:');
      const lib = isHttps ? https : http;

      const req = lib.get(url, { timeout: 8000 }, (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          try {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              const list = JSON.parse(body);
              if (Array.isArray(list)) {
                return resolve(list);
              }
            }
          } catch {}
          resolve([]);
        });
      });

      req.on('error', () => resolve([]));
      req.on('timeout', () => {
        req.destroy();
        resolve([]);
      });
    } catch {
      resolve([]);
    }
  });
}

// Load existing blogs from local JSON file
function loadLocalBlogs() {
  const localPath = path.join(process.cwd(), 'src/data/blogs.json');
  if (fs.existsSync(localPath)) {
    try {
      const raw = fs.readFileSync(localPath, 'utf-8');
      return JSON.parse(raw);
    } catch {}
  }
  return [];
}

// Load existing blogs from DynamoDB
async function loadDynamoDbBlogs() {
  const tableName = process.env.DYNAMODB_TABLE_NAME || process.env.TMU_DYNAMODB_TABLE_NAME || 'TheMindUpgradeBlogs';
  const region = process.env.APP_AWS_REGION || process.env.AWS_REGION || 'ap-south-1';
  const accessKeyId = process.env.APP_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.APP_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    return [];
  }

  try {
    const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
    const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

    const client = new DynamoDBClient({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });
    const docClient = DynamoDBDocumentClient.from(client);

    const scanRes = await docClient.send(new ScanCommand({ TableName: tableName }));
    return scanRes.Items || [];
  } catch (err) {
    return [];
  }
}

// Find if an article already exists in the database (Title, Slug, ID)
function findExistingMatch(article, existingBlogs) {
  const normTitle = normalizeString(article.title);
  const wpSlug = (article.slug || '').toLowerCase().trim();
  const wpId = String(article.id || '').trim();

  // 1. Exact normalized Title match (Highest priority)
  for (const ex of existingBlogs) {
    const exNormTitle = normalizeString(ex.title);
    if (normTitle && exNormTitle && normTitle === exNormTitle) {
      return { matchedBy: 'Title (Exact match)', existingTitle: ex.title, existingSlug: ex.slug };
    }
  }

  // 2. Fuzzy Title match (handles punctuation, substrings, or slight phrasing differences)
  for (const ex of existingBlogs) {
    const exNormTitle = normalizeString(ex.title);
    if (normTitle.length > 15 && exNormTitle.length > 15) {
      if (normTitle.includes(exNormTitle) || exNormTitle.includes(normTitle)) {
        return { matchedBy: 'Title (Substring match)', existingTitle: ex.title, existingSlug: ex.slug };
      }
      // Word-overlap similarity
      const wordsA = new Set(article.title.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2));
      const wordsB = new Set(ex.title.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2));
      if (wordsA.size > 0 && wordsB.size > 0) {
        let common = 0;
        for (const w of wordsA) {
          if (wordsB.has(w)) common++;
        }
        const sim = common / Math.max(wordsA.size, wordsB.size);
        if (sim >= 0.7) {
          return { matchedBy: `Title (Similarity ${Math.round(sim * 100)}%)`, existingTitle: ex.title, existingSlug: ex.slug };
        }
      }
    }
  }

  // 3. Slug match
  if (wpSlug) {
    for (const ex of existingBlogs) {
      const exSlug = (ex.slug || '').toLowerCase().trim();
      if (exSlug === wpSlug) {
        return { matchedBy: 'Slug match', existingTitle: ex.title, existingSlug: ex.slug };
      }
    }
  }

  // 4. ID match
  if (wpId) {
    for (const ex of existingBlogs) {
      if (String(ex.id).trim() === wpId) {
        return { matchedBy: 'ID match', existingTitle: ex.title, existingSlug: ex.slug };
      }
    }
  }

  return null;
}

// Save blog to DynamoDB
async function saveBlogToDynamoDb(blog) {
  const tableName = process.env.DYNAMODB_TABLE_NAME || process.env.TMU_DYNAMODB_TABLE_NAME || 'TheMindUpgradeBlogs';
  const region = process.env.APP_AWS_REGION || process.env.AWS_REGION || 'ap-south-1';
  const accessKeyId = process.env.APP_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.APP_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    return false;
  }

  const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
  const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

  const client = new DynamoDBClient({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });
  const docClient = DynamoDBDocumentClient.from(client);

  await docClient.send(new PutCommand({
    TableName: tableName,
    Item: blog,
  }));
  return true;
}

// Save blog via REST API POST request
function saveBlogViaApi(apiUrl, blog, apiKey) {
  return new Promise((resolve, reject) => {
    const targetUrl = new URL(apiUrl);
    const isHttps = targetUrl.protocol === 'https:';
    const lib = isHttps ? https : http;

    const data = JSON.stringify(blog);

    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
      'x-skip-notification': 'true',
    };

    if (apiKey) {
      headers['x-admin-password'] = apiKey;
    }

    const req = lib.request(
      targetUrl,
      {
        method: 'POST',
        headers,
        timeout: 15000,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ ok: true, data: body });
          } else {
            reject(new Error(`API responded with HTTP ${res.statusCode}: ${body.slice(0, 150)}`));
          }
        });
      }
    );

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('API request timed out (15s)'));
    });
    req.write(data);
    req.end();
  });
}

// Main Migration Runner
async function runMigration() {
  console.log(`
================================================================
   THE MIND UPGRADE — WORDPRESS XML MIGRATION ENGINE
================================================================
`);

  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const isForce = args.includes('--force');
  const includeDrafts = args.includes('--include-drafts');

  let apiTarget = 'https://themindupgrade.in/api/blogs';
  const apiArg = args.find((a) => a.startsWith('--api='));
  if (apiArg) {
    apiTarget = apiArg.split('=')[1].trim();
  } else if (args.includes('--local-only')) {
    apiTarget = '';
  }

  let apiKey = process.env.ADMIN_PASSWORD || process.env.APP_ADMIN_PASSWORD || '';
  const keyArg = args.find((a) => a.startsWith('--api-key='));
  if (keyArg) {
    apiKey = keyArg.split('=')[1].trim();
  }

  // Find XML file argument
  const fileArg = args.find((a) => !a.startsWith('--') && a.endsWith('.xml')) ||
    args.find((a) => !a.startsWith('--'));

  let xmlFilePath = fileArg;
  if (!xmlFilePath) {
    const candidates = [
      path.join(process.cwd(), 'wordpress-export.xml'),
      path.join(process.cwd(), 'export.xml'),
      path.join(process.cwd(), 'themindupgrade.xml'),
      path.join(process.cwd(), 'wp-export.xml'),
    ];
    xmlFilePath = candidates.find((c) => fs.existsSync(c));
  }

  if (!xmlFilePath || !fs.existsSync(xmlFilePath)) {
    console.error(`❌ No valid WordPress XML file specified or found!`);
    console.log(`\nUsage:\n  node scripts/migrate-wordpress-xml.js <path-to-file.xml> [options]\n`);
    console.log(`Options:\n  --dry-run          Preview articles without inserting into database`);
    console.log(`  --api=<url>        Insert via REST API (e.g. https://themindupgrade.in/api/blogs)`);
    console.log(`  --include-drafts   Also migrate unpublished drafts`);
    console.log(`  --force            Overwrite existing articles rather than skipping\n`);
    console.log(`Example:`);
    console.log(`  node scripts/migrate-wordpress-xml.js ./wordpress-export.xml --dry-run`);
    console.log(`  node scripts/migrate-wordpress-xml.js ./wordpress-export.xml\n`);
    process.exit(1);
  }

  console.log(`📖 Loading XML export from: ${path.resolve(xmlFilePath)}`);
  const xmlContent = fs.readFileSync(xmlFilePath, 'utf-8');

  // Parse articles from XML
  const parsedArticles = parseWordPressXml(xmlContent);
  const targetArticles = includeDrafts
    ? parsedArticles
    : parsedArticles.filter((a) => a.status === 'published');

  console.log(`📋 Total valid WordPress articles ready for evaluation: ${targetArticles.length}`);

  // Query existing articles from: 1) Live website API, 2) DynamoDB, 3) Local JSON
  console.log(`🔍 Querying existing articles in database to check duplicates by title...`);
  
  const liveBlogs = await fetchLiveWebsiteBlogs('https://themindupgrade.in');
  const localBlogs = loadLocalBlogs();
  let dbBlogs = [];
  try {
    dbBlogs = await loadDynamoDbBlogs();
  } catch {}

  // When targeting live API, use liveBlogs as the single source of truth for duplicates.
  // Otherwise, fallback to combining liveBlogs, DynamoDB scan, and local JSON.
  const allExisting = apiTarget ? [...liveBlogs] : [...liveBlogs];
  if (!apiTarget) {
    for (const b of [...dbBlogs, ...localBlogs]) {
      if (!allExisting.some((ex) => ex.id === b.id || ex.slug === b.slug)) {
        allExisting.push(b);
      }
    }
  }

  console.log(`📊 Found ${allExisting.length} existing articles in current system (${liveBlogs.length} from live website).`);

  let skippedCount = 0;
  let insertedCount = 0;
  let errorCount = 0;

  const toInsert = [];

  for (const article of targetArticles) {
    const match = !isForce ? findExistingMatch(article, allExisting) : null;

    if (match) {
      console.log(`⏭️  [SKIPPED - ALREADY EXISTS] "${article.title}"`);
      console.log(`    ↳ Matched by ${match.matchedBy}: "${match.existingTitle}"`);
      skippedCount++;
    } else {
      console.log(`✨ [NEW ARTICLE READY] "${article.title}" (slug: /${article.slug}, date: ${article.publishedAt}, cat: ${article.category})`);
      toInsert.push(article);
    }
  }

  console.log(`\n----------------------------------------------------------------`);
  console.log(`📈 EVALUATION SUMMARY:`);
  console.log(`   • Total parsed articles:  ${targetArticles.length}`);
  console.log(`   • Already in database:    ${skippedCount} (Ignored by Title / Slug)`);
  console.log(`   • New articles to insert: ${toInsert.length}`);
  console.log(`----------------------------------------------------------------\n`);

  if (isDryRun) {
    console.log(`🧪 DRY RUN COMPLETE: No changes were written to your database.`);
    console.log(`👉 To perform actual migration, run without --dry-run:`);
    console.log(`   node scripts/migrate-wordpress-xml.js "${xmlFilePath}"\n`);
    return;
  }

  if (toInsert.length === 0) {
    console.log(`🎉 All articles from your XML file are already present in your database! Nothing to insert.`);
    return;
  }

  console.log(`🚀 Starting database insertion for ${toInsert.length} new articles...\n`);

  for (let i = 0; i < toInsert.length; i++) {
    const post = toInsert[i];
    console.log(`[${i + 1}/${toInsert.length}] Inserting: "${post.title}"...`);

    try {
      if (apiTarget) {
        // Mode A: REST API directly into live database
        let success = false;
        let lastErr = null;
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            await saveBlogViaApi(apiTarget, post, apiKey);
            success = true;
            break;
          } catch (e) {
            lastErr = e;
            await new Promise((r) => setTimeout(r, 500));
          }
        }

        if (!success) {
          throw lastErr || new Error('Failed after retries');
        }

        console.log(`   ✅ Inserted into Live Database (${apiTarget})`);
      } else {
        // Mode B: Direct DynamoDB (if credentials configured locally)
        let dynamoOk = false;
        try {
          dynamoOk = await saveBlogToDynamoDb(post);
        } catch (e) {
          console.warn(`   ⚠️ DynamoDB Put notice: ${e.message}`);
        }

        if (dynamoOk) {
          console.log(`   ✅ Saved to DynamoDB`);
        }
      }

      // Always update local blogs.json so local repository stays synchronized
      try {
        const localPath = path.join(process.cwd(), 'src/data/blogs.json');
        const currentBlogs = loadLocalBlogs();
        const existingIdx = currentBlogs.findIndex((b) => b.id === post.id || b.slug === post.slug);
        if (existingIdx > -1) {
          currentBlogs[existingIdx] = post;
        } else {
          currentBlogs.unshift(post);
        }
        fs.writeFileSync(localPath, JSON.stringify(currentBlogs, null, 2), 'utf-8');
      } catch {}

      // Add to running existing set to prevent duplicates within the same run
      allExisting.push(post);
      insertedCount++;

      // Small throttle to avoid rate-limiting
      if (apiTarget) {
        await new Promise((r) => setTimeout(r, 200));
      }
    } catch (err) {
      console.error(`   ❌ Failed to insert "${post.title}":`, err.message);
      errorCount++;
    }
  }

  console.log(`
================================================================
   MIGRATION COMPLETED SUCCESSFULLY!
================================================================
   • Newly Added:  ${insertedCount} articles
   • Skipped:       ${skippedCount} existing articles
   • Errors:        ${errorCount}
================================================================
`);
}

// Execute
runMigration().catch((err) => {
  console.error('Fatal Migration Error:', err);
  process.exit(1);
});
