import fs from 'fs';
import path from 'path';
import { WebsiteSettings } from '@/types/blog';
import defaultSettings from '@/data/settings.json';

const SETTINGS_FILE = path.join(process.cwd(), 'src/data/settings.json');

export function getWebsiteSettings(): WebsiteSettings {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading settings.json:', err);
  }
  return defaultSettings as WebsiteSettings;
}

export function saveWebsiteSettings(settings: Partial<WebsiteSettings>): WebsiteSettings {
  const current = getWebsiteSettings();
  const updated: WebsiteSettings = {
    ...current,
    ...settings,
    announcementBar: {
      ...current.announcementBar,
      ...(settings.announcementBar || {}),
    },
    socialLinks: {
      ...current.socialLinks,
      ...(settings.socialLinks || {}),
    },
    articleFooterCta: {
      enabled: true,
      text: "If you found this article valuable, please don't forget to Like and Subscribe to my blog for more expert insights and updates.",
      imageUrl: '/images/like-subscribe-banner.png',
      ...(current.articleFooterCta || {}),
      ...(settings.articleFooterCta || {}),
    },
    seo: {
      ...current.seo,
      ...(settings.seo || {}),
    },
  };

  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving settings.json:', err);
  }

  return updated;
}
