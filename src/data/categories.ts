import { CategoryInfo } from '@/types/blog';

export const CATEGORIES: CategoryInfo[] = [
  {
    name: 'Personal Finance',
    slug: 'personal-finance',
    description: 'Master wealth building, budgeting, smart investing, debt management, and financial freedom.',
    iconName: 'TrendingUp',
    gradient: 'from-amber-500 to-orange-600',
    color: '#F59E0B',
  },
  {
    name: 'Banking',
    slug: 'banking',
    description: 'Navigate modern retail & digital banking, credit cards, interest rates, and central bank policies.',
    iconName: 'Building2',
    gradient: 'from-cyan-500 to-blue-600',
    color: '#06B6D4',
  },
  {
    name: 'Insurance',
    slug: 'insurance',
    description: 'Understand term life, health, auto, and property insurance to protect your family & assets.',
    iconName: 'ShieldCheck',
    gradient: 'from-emerald-500 to-teal-600',
    color: '#10B981',
  },
  {
    name: 'Day to Day Insights',
    slug: 'day-to-day-insights',
    description: 'Practical daily wisdom, smart consumer hacks, lifestyle optimization, and cognitive productivity.',
    iconName: 'Zap',
    gradient: 'from-indigo-500 to-violet-600',
    color: '#6366F1',
  },
  {
    name: 'Case Studies',
    slug: 'case-studies',
    description: 'Deep-dive analytical breakdowns of business models, market successes, and financial turnarounds.',
    iconName: 'FileText',
    gradient: 'from-purple-500 to-pink-600',
    color: '#A855F7',
  },
];
