import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Comment } from '@/types/blog';
import { sendAdminNotification } from '@/lib/notification-service';

const COMMENTS_FILE = path.join(process.cwd(), 'src/data/comments.json');

const initialComments: Comment[] = [
  {
    id: 'c1',
    postSlug: 'science-of-deep-work-master-focus',
    authorName: 'David Chen',
    authorEmail: 'david@example.com',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
    content: 'The section on attention residue changed how I structure my mornings. Tremendous article!',
    createdAt: '2026-09-29',
    likes: 12
  },
  {
    id: 'c2',
    postSlug: 'science-of-deep-work-master-focus',
    authorName: 'Sophia Martinez',
    authorEmail: 'sophia@example.com',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia',
    content: 'I implement the 90-minute block ritual daily now. Absolute game changer for code quality.',
    createdAt: '2026-09-30',
    likes: 8
  }
];

function getCommentsServer(): Comment[] {
  try {
    if (fs.existsSync(COMMENTS_FILE)) {
      return JSON.parse(fs.readFileSync(COMMENTS_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('Error reading comments.json:', e);
  }
  return initialComments;
}

function saveCommentsServer(comments: Comment[]): void {
  try {
    const dir = path.dirname(COMMENTS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(COMMENTS_FILE, JSON.stringify(comments, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing comments.json:', e);
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const postSlug = searchParams.get('postSlug');
  let comments = getCommentsServer();

  if (postSlug) {
    comments = comments.filter((c) => c.postSlug === postSlug);
  }

  return NextResponse.json(comments);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const comments = getCommentsServer();

    const newComment: Comment = {
      id: `c_${Date.now()}`,
      postSlug: body.postSlug,
      authorName: body.authorName || 'Anonymous Thinker',
      authorEmail: body.authorEmail || '',
      authorAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(body.authorName || 'User')}`,
      content: body.content,
      createdAt: new Date().toISOString().split('T')[0],
      likes: 0,
    };

    comments.unshift(newComment);
    saveCommentsServer(comments);

    // Trigger admin email notification asynchronously
    sendAdminNotification({
      type: 'comment',
      title: `New Comment on "${body.postSlug}"`,
      message: `${newComment.authorName} commented: "${newComment.content}"`,
      details: {
        authorName: newComment.authorName,
        authorEmail: newComment.authorEmail,
        postSlug: newComment.postSlug,
        content: newComment.content,
      },
    }).catch((err) => console.error('Notification dispatch error:', err));

    return NextResponse.json(newComment, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to post comment', details: String(err) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, content } = await request.json();
    if (!id || !content) {
      return NextResponse.json({ error: 'Comment ID and content are required' }, { status: 400 });
    }

    const comments = getCommentsServer();
    const index = comments.findIndex((c) => c.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    comments[index] = {
      ...comments[index],
      content: content.trim(),
    };

    saveCommentsServer(comments);
    return NextResponse.json(comments[index]);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update comment', details: String(err) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }

    let comments = getCommentsServer();
    const initialLength = comments.length;
    comments = comments.filter((c) => c.id !== id);

    if (comments.length === initialLength) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    saveCommentsServer(comments);
    return NextResponse.json({ success: true, id });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete comment', details: String(err) }, { status: 500 });
  }
}
