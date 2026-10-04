import fs from 'fs';
import path from 'path';

export interface Subscriber {
  id: string;
  email: string;
  name?: string;
  subscribedAt: string;
  status: 'active' | 'unsubscribed';
}

const subscribersFilePath = path.join(process.cwd(), 'src', 'data', 'subscribers.json');

export function getSubscribersServer(): Subscriber[] {
  try {
    if (!fs.existsSync(subscribersFilePath)) {
      return [];
    }
    const content = fs.readFileSync(subscribersFilePath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error reading subscribers.json:', err);
    return [];
  }
}

export function saveSubscribersServer(subscribers: Subscriber[]): void {
  try {
    fs.writeFileSync(subscribersFilePath, JSON.stringify(subscribers, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing subscribers.json:', err);
  }
}
