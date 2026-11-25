import fs from 'fs';
import path from 'path';
import os from 'os';
import { Subscriber } from '@/types/blog';
import {
  isDynamoDBConfigured,
  getAllSubscribersFromDynamoDB,
  saveSubscriberToDynamoDB,
  deleteSubscriberFromDynamoDB,
  purgeSampleSubscribersFromDynamoDB,
} from '@/lib/dynamodb';

export type { Subscriber };

const subscribersFilePath = path.join(process.cwd(), 'src', 'data', 'subscribers.json');
const TMP_SUBSCRIBERS_FILE = path.join(os.tmpdir(), 'tmu_subscribers.json');

function isSampleSubscriber(sub: Subscriber): boolean {
  if (!sub || !sub.email) return true;
  const email = sub.email.toLowerCase().trim();
  return (
    email.endsWith('@example.com') ||
    email.includes('example.com') ||
    sub.id.startsWith('sub_1') ||
    sub.id.startsWith('sub_2') ||
    sub.id.startsWith('sub_3') ||
    sub.id.startsWith('sub_4') ||
    sub.id.startsWith('sub_5') ||
    sub.id.startsWith('sub_6') ||
    sub.id.startsWith('sub_7') ||
    sub.id.startsWith('sub_8') ||
    sub.id.startsWith('sub_9')
  );
}

export async function getSubscribersServerAsync(): Promise<Subscriber[]> {
  if (isDynamoDBConfigured()) {
    try {
      await purgeSampleSubscribersFromDynamoDB();
      const dynamoSubs = await getAllSubscribersFromDynamoDB();
      if (dynamoSubs) {
        const actualSubs = dynamoSubs.filter((s) => !isSampleSubscriber(s));
        return actualSubs;
      }
    } catch (e) {
      console.warn('DynamoDB subscribers fetch notice:', e);
    }
  }

  return getSubscribersServer();
}

export function getSubscribersServer(): Subscriber[] {
  let subscribers: Subscriber[] = [];

  // 1. Check TMP_SUBSCRIBERS_FILE (writable on AWS Lambda)
  try {
    if (fs.existsSync(TMP_SUBSCRIBERS_FILE)) {
      const content = fs.readFileSync(TMP_SUBSCRIBERS_FILE, 'utf-8');
      subscribers = JSON.parse(content);
    }
  } catch {}

  // 2. Check repository subscribersFilePath
  if (subscribers.length === 0) {
    try {
      if (fs.existsSync(subscribersFilePath)) {
        const content = fs.readFileSync(subscribersFilePath, 'utf-8');
        subscribers = JSON.parse(content);
      }
    } catch {}
  }

  // Strip any sample / example subscribers permanently
  const actualSubscribers = subscribers.filter((s) => !isSampleSubscriber(s));

  if (actualSubscribers.length !== subscribers.length) {
    saveSubscribersServer(actualSubscribers);
  }

  return actualSubscribers;
}

export function saveSubscribersServer(subscribers: Subscriber[]): void {
  const actualSubscribers = subscribers.filter((s) => !isSampleSubscriber(s));

  // 1. Write to TMP_SUBSCRIBERS_FILE (writable on serverless Lambda)
  try {
    fs.writeFileSync(TMP_SUBSCRIBERS_FILE, JSON.stringify(actualSubscribers, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing tmp subscribers:', err);
  }

  // 2. Write to project file
  try {
    const dir = path.dirname(subscribersFilePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(subscribersFilePath, JSON.stringify(actualSubscribers, null, 2), 'utf-8');
  } catch (err) {
    // Expected EROFS on read-only serverless Lambda
  }

  // 3. Sync to DynamoDB if configured
  if (isDynamoDBConfigured()) {
    Promise.all(actualSubscribers.map(saveSubscriberToDynamoDB)).catch(() => {});
  }
}

export async function addSubscriberServerAsync(sub: Subscriber): Promise<boolean> {
  if (isSampleSubscriber(sub)) return false;

  if (isDynamoDBConfigured()) {
    try {
      await saveSubscriberToDynamoDB(sub);
    } catch (e) {
      console.warn('DynamoDB add subscriber warning:', e);
    }
  }

  const current = getSubscribersServer();
  const existing = current.find((s) => s.email.toLowerCase() === sub.email.toLowerCase());
  if (!existing) {
    current.unshift(sub);
    saveSubscribersServer(current);
  }
  return true;
}

export async function deleteSubscriberServerAsync(idOrEmail: string): Promise<boolean> {
  if (isDynamoDBConfigured()) {
    try {
      await deleteSubscriberFromDynamoDB(idOrEmail);
    } catch (e) {
      console.warn('DynamoDB delete subscriber warning:', e);
    }
  }

  let subscribers = getSubscribersServer();
  subscribers = subscribers.filter(
    (s) => s.id !== idOrEmail && s.email.toLowerCase() !== idOrEmail.toLowerCase()
  );
  saveSubscribersServer(subscribers);
  return true;
}
