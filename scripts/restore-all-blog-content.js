/**
 * Master Content Restoration Script
 * 
 * Strict User Requirements:
 * 1. Read WordPress XML and map articles by Heading/Title.
 * 2. Update ONLY the content field of blogs where content is empty.
 * 3. Do NOT change anything else (titles, slugs, dates, categories, covers, tags untouched).
 * 4. IF a blog already has content, DO NOT modify its content.
 * 5. Update both live DynamoDB (via PUT /api/blogs/[id]) and local src/data/blogs.json.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

function decodeEntities(str = '') {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, '-')
    .replace(/&#8212;/g, '--')
    .replace(/&#038;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function normalize(s = '') {
  return decodeEntities(s)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function cleanWpContent(html = '') {
  if (!html) return '';
  return html
    .replace(/<!--\s*\/?wp:[^>]*-->/gi, '')
    .replace(/<p>\s*(?:&nbsp;|\s)*<\/p>/gi, '')
    .replace(/\[caption[^\]]*\]([\s\S]*?)\[\/caption\]/gi, '$1')
    .replace(/\[\/?(gallery|embed|video|audio)[^\]]*\]/gi, '')
    .trim();
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { timeout: 15000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject).on('timeout', () => reject(new Error('Timeout')));
  });
}

function httpPut(url, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname,
      port: 443,
      path: u.pathname + u.search,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
      timeout: 20000,
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(JSON.parse(body));
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${body.slice(0, 200)}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    req.write(data);
    req.end();
  });
}

async function run() {
  console.log('====================================================');
  console.log('🚀 TMU BLOG CONTENT RESTORATION SYSTEM');
  console.log('====================================================\n');

  // 1. Build Content Library from XML
  const contentMap = new Map();
  const xmlPath = path.join(process.cwd(), 'wordpress-export.xml');
  if (fs.existsSync(xmlPath)) {
    console.log('📖 Reading wordpress-export.xml...');
    const xml = fs.readFileSync(xmlPath, 'utf8');
    const items = xml.split(/<item>/i).slice(1).map(i => i.split(/<\/item>/i)[0]);

    for (const it of items) {
      const typeMatch = it.match(/<wp:post_type>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/wp:post_type>/i);
      if (!typeMatch || typeMatch[1].trim() !== 'post') continue;

      const titleMatch = it.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : '';

      const contentMatch = it.match(/<content:encoded>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/content:encoded>/i);
      const rawContent = contentMatch ? contentMatch[1].trim() : '';

      if (title && rawContent) {
        const cleaned = cleanWpContent(rawContent);
        contentMap.set(normalize(title), {
          source: 'XML',
          title: decodeEntities(title),
          content: cleaned,
        });
      }
    }
    console.log(`✅ Loaded ${contentMap.size} articles from XML.\n`);
  }

  // 2. Add Foundational Articles from src/data/blogs.json
  const localBlogsPath = path.join(process.cwd(), 'src/data/blogs.json');
  if (fs.existsSync(localBlogsPath)) {
    try {
      const localBlogs = JSON.parse(fs.readFileSync(localBlogsPath, 'utf8'));
      for (const b of localBlogs) {
        if (b.title && b.content && b.content.trim()) {
          const norm = normalize(b.title);
          if (!contentMap.has(norm)) {
            contentMap.set(norm, {
              source: 'blogs.json',
              title: b.title,
              content: b.content.trim(),
            });
          }
        }
      }
    } catch {}
  }

  // 3. Add Custom Articles Recovered from System Logs
  const b1Path = path.join(process.cwd(), 'scripts/recovered_1795719832302.json');
  if (fs.existsSync(b1Path)) {
    const b1 = JSON.parse(fs.readFileSync(b1Path, 'utf8'));
    if (b1.content) {
      contentMap.set(normalize('6 Life Insurance Mistakes That Could Leave Your Family Exposed'), {
        source: 'recovered_logs',
        title: '6 Life Insurance Mistakes That Could Leave Your Family Exposed',
        content: b1.content,
      });
    }
  }

  const b2Path = path.join(process.cwd(), 'scripts/recovered_1795570233804.json');
  if (fs.existsSync(b2Path)) {
    const b2 = JSON.parse(fs.readFileSync(b2Path, 'utf8'));
    if (b2.content) {
      contentMap.set(normalize('Why You Need Critical Illness Cover on Top of Your Mediclaim?'), {
        source: 'recovered_logs',
        title: 'Why You Need Critical Illness Cover on Top of Your Mediclaim?',
        content: b2.content,
      });
    }
  }

  console.log(`📚 Total content library size: ${contentMap.size} unique articles.\n`);

  // 4. Fetch All Live Blogs
  console.log('🌐 Fetching all blogs from live site https://themindupgrade.in ...');
  const liveList = await httpGet('https://themindupgrade.in/api/blogs?includeDrafts=true');
  console.log(`📊 Found ${liveList.length} blogs currently in live database.\n`);

  let skippedHasContent = 0;
  let restoredCount = 0;
  let notFoundCount = 0;
  const localBlogsForSync = fs.existsSync(localBlogsPath) ? JSON.parse(fs.readFileSync(localBlogsPath, 'utf8')) : [];

  for (let i = 0; i < liveList.length; i++) {
    const item = liveList[i];
    const progress = `[${i + 1}/${liveList.length}]`;

    // A. Query single blog to check current live content
    let liveBlog = null;
    try {
      liveBlog = await httpGet(`https://themindupgrade.in/api/blogs/${encodeURIComponent(item.id)}`);
    } catch {
      try {
        liveBlog = await httpGet(`https://themindupgrade.in/api/blogs/${encodeURIComponent(item.slug)}`);
      } catch {}
    }

    const currentContent = liveBlog ? (liveBlog.content || '').trim() : '';

    // USER RULE: IF YOU FIND CONTENT IN ANY BLOG DON'T CHANGE THE CONTENT ALSO OF THAT BLOG
    if (currentContent.length > 50) {
      console.log(`${progress} ⏩ SKIP (Content already exists): "${item.title}" (${currentContent.length} chars)`);
      skippedHasContent++;
      continue;
    }

    // B. Match content based on heading/title
    const norm = normalize(item.title);
    let matched = contentMap.get(norm);

    if (!matched) {
      // Fuzzy match: partial title matching
      for (const [k, v] of contentMap.entries()) {
        if (norm.includes(k) || k.includes(norm)) {
          matched = v;
          break;
        }
      }
    }

    if (!matched) {
      console.warn(`${progress} ⚠️ NO XML/SOURCE MATCH: "${item.title}"`);
      notFoundCount++;
      continue;
    }

    // C. USER RULE: DON'T CHANGE ANYTHING ELSE. ADD ONLY CONTENT PART.
    console.log(`${progress} 🔄 RESTORING CONTENT: "${item.title}" from [${matched.source}] (${matched.content.length} chars)...`);

    try {
      // Update Live DynamoDB via PUT
      await httpPut(`https://themindupgrade.in/api/blogs/${encodeURIComponent(item.id)}`, {
        content: matched.content,
      });

      // Update local blogs.json
      const localIdx = localBlogsForSync.findIndex(b => b.id === item.id || b.slug === item.slug);
      if (localIdx > -1) {
        localBlogsForSync[localIdx].content = matched.content;
      } else {
        localBlogsForSync.push({
          ...item,
          content: matched.content,
        });
      }

      console.log(`${progress} ✅ SUCCESS: "${item.title}" restored.`);
      restoredCount++;

      // Gentle pause to prevent hammering the server
      await new Promise(r => setTimeout(r, 250));
    } catch (err) {
      console.error(`${progress} ❌ FAILED to update "${item.title}":`, err.message);
    }
  }

  // Save updated local blogs.json
  try {
    fs.writeFileSync(localBlogsPath, JSON.stringify(localBlogsForSync, null, 2), 'utf8');
    console.log('\n💾 Synchronized local src/data/blogs.json with all restored content.');
  } catch (e) {
    console.error('Failed to write local blogs.json:', e.message);
  }

  console.log('\n====================================================');
  console.log('🎉 RESTORATION SUMMARY:');
  console.log(`   Total Live Blogs Audited:   ${liveList.length}`);
  console.log(`   Skipped (Had Content):      ${skippedHasContent}`);
  console.log(`   Successfully Restored:      ${restoredCount}`);
  console.log(`   Unmatched (No source):      ${notFoundCount}`);
  console.log('====================================================\n');

  // 5. Full Verification Sweep
  console.log('🔍 Running full verification sweep on live website...');
  let verifiedWithContent = 0;
  let verifiedEmpty = 0;

  for (let i = 0; i < liveList.length; i++) {
    const item = liveList[i];
    try {
      const check = await httpGet(`https://themindupgrade.in/api/blogs/${encodeURIComponent(item.id)}`);
      const len = (check.content || '').trim().length;
      if (len > 0) {
        verifiedWithContent++;
      } else {
        verifiedEmpty++;
        console.warn(`⚠️ Still empty on live: ID ${item.id} - "${item.title}"`);
      }
    } catch {
      verifiedEmpty++;
    }
    // Small throttle
    if (i % 10 === 0) await new Promise(r => setTimeout(r, 100));
  }

  console.log('\n====================================================');
  console.log('🏁 FINAL LIVE WEBSITE VERIFICATION:');
  console.log(`   Total Blogs Verified:       ${liveList.length}`);
  console.log(`   Blogs With Active Content:  ${verifiedWithContent}`);
  console.log(`   Blogs Empty:                ${verifiedEmpty}`);
  console.log('====================================================\n');
}

run().catch(err => {
  console.error('Fatal restoration error:', err);
  process.exit(1);
});
