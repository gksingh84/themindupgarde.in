export interface SubcategoryInfo {
  name: string;
  slug: string;
  description: string;
}

export interface CategoryInfo {
  name: string;
  slug: string;
  description: string;
  iconName: string;
  subcategories: SubcategoryInfo[];
  gradient: string;
  color: string;
  badgeBg: string;
  badgeText: string;
}

export const CATEGORIES: CategoryInfo[] = [
  {
    name: 'Personal Finance',
    slug: 'personal-finance',
    description: 'Master wealth building, budgeting, banking, loans, income tax, and long-term retirement strategies.',
    iconName: 'Coins',
    gradient: 'from-amber-600 to-amber-800',
    color: '#E5A64B',
    badgeBg: 'bg-amber-100 dark:bg-amber-950/60',
    badgeText: 'text-amber-800 dark:text-amber-300',
    subcategories: [
      { name: 'Saving and Investing', slug: 'saving-and-investing', description: 'Smart wealth building through equities, index funds, and systematic discipline.' },
      { name: 'Banking', slug: 'banking', description: 'Navigate high-yield savings, fixed deposits, digital banking, and safety.' },
      { name: 'Loans and Credit', slug: 'loans-and-credit', description: 'Master credit scores, home loans, debt payoff strategies, and leverage.' },
      { name: 'Income Tax', slug: 'income-tax', description: 'Tax regime comparisons, deductions, exemptions, and compliance.' },
      { name: 'Financial Planning', slug: 'financial-planning', description: 'Comprehensive goal-based roadmap for family security and milestones.' },
      { name: 'Retirement Planning', slug: 'retirement-planning', description: 'Building inflation-beating corpus and sustainable withdrawal rates.' },
      { name: 'Behavioural Finance', slug: 'behavioural-finance', description: 'Overcoming psychological biases, FOMO, and emotional investing.' },
    ],
  },
  {
    name: 'Insurance',
    slug: 'insurance',
    description: 'Protect family health and assets with clear comparisons of term, health, and motor coverage.',
    iconName: 'ShieldCheck',
    gradient: 'from-slate-700 to-navy-800',
    color: '#405B78',
    badgeBg: 'bg-slate-100 dark:bg-slate-800/80',
    badgeText: 'text-slate-800 dark:text-slate-200',
    subcategories: [
      { name: 'Health Insurance', slug: 'health-insurance', description: 'In-depth guide to base policies, super top-ups, restoration, and room rent limits.' },
      { name: 'Life Insurance', slug: 'life-insurance', description: 'Pure term life insurance, sum assured calculations, and riders.' },
      { name: 'Motor Insurance', slug: 'motor-insurance', description: 'Zero depreciation, third-party liability, and bumper-to-bumper protection.' },
      { name: 'Insurance Awareness', slug: 'insurance-awareness', description: 'Exclusions, waiting periods, pre-existing conditions, and fine print.' },
      { name: 'Claim Settlement', slug: 'claim-settlement', description: 'Step-by-step claims process, cashless hospital network, and ombudsman.' },
      { name: 'Policy Comparisons', slug: 'policy-comparisons', description: 'Unbiased head-to-head comparison of top insurance providers.' },
    ],
  },
  {
    name: 'Psychology and Self-Improvement',
    slug: 'psychology-and-self-improvement',
    description: 'Deconstruct cognitive biases, decision making, habit loops, and mental frameworks for high performance.',
    iconName: 'Brain',
    gradient: 'from-navy-800 to-indigo-950',
    color: '#14243A',
    badgeBg: 'bg-navy-100 dark:bg-navy-900',
    badgeText: 'text-navy-900 dark:text-navy-200',
    subcategories: [
      { name: 'Human Psychology', slug: 'human-psychology', description: 'Core principles of human cognition, evolutionary behavior, and perception.' },
      { name: 'Behavioural Psychology', slug: 'behavioural-psychology', description: 'How environmental triggers shape choices and routines.' },
      { name: 'Decision Making', slug: 'decision-making', description: 'Mental models, first principles thinking, and second-order consequences.' },
      { name: 'Habits and Productivity', slug: 'habits-and-productivity', description: 'Dopamine management, atomic habits, and deep focus rituals.' },
      { name: 'Happiness and Well-being', slug: 'happiness-and-well-being', description: 'Science of hedonic adaptation, stoicism, and emotional equilibrium.' },
      { name: 'Personal Growth', slug: 'personal-growth', description: 'Continuous self-upgrade, learning to learn, and career sovereignty.' },
    ],
  },
  {
    name: 'Economy and Current Affairs',
    slug: 'economy-and-current-affairs',
    description: 'Demystify macroeconomic trends, RBI monetary policy, trade agreements, and global market dynamics.',
    iconName: 'TrendingUp',
    gradient: 'from-emerald-700 to-teal-900',
    color: '#10B981',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-950/60',
    badgeText: 'text-emerald-800 dark:text-emerald-300',
    subcategories: [
      { name: 'Indian Economy', slug: 'indian-economy', description: 'GDP trends, infrastructure, demographics, and manufacturing shifts.' },
      { name: 'Global Economy', slug: 'global-economy', description: 'Interest rate cycles, currency valuations, and geopolitics.' },
      { name: 'RBI and Banking Policies', slug: 'rbi-and-banking-policies', description: 'Repo rate, inflation targeting, liquidity, and banking regulation.' },
      { name: 'Government Policies', slug: 'government-policies', description: 'Union budget, tax reforms, industrial incentives, and welfare.' },
      { name: 'International Trade', slug: 'international-trade', description: 'Supply chains, trade balances, tariffs, and crude oil economics.' },
      { name: 'Business and Economic Developments', slug: 'business-and-economic-developments', description: 'Corporate transformations, unicorn economics, and market shifts.' },
    ],
  },
  {
    name: 'Daily Insights',
    slug: 'daily-insights',
    description: 'Practical daily knowledge, consumer rights, science curiosities, social observations, and life lessons.',
    iconName: 'Lightbulb',
    gradient: 'from-amber-500 to-red-600',
    color: '#F59E0B',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/40',
    badgeText: 'text-amber-900 dark:text-amber-200',
    subcategories: [
      { name: 'Everyday Knowledge', slug: 'everyday-knowledge', description: 'Crucial everyday systems that make modern society function.' },
      { name: 'Interesting Facts', slug: 'interesting-facts', description: 'Counter-intuitive truths backed by science and history.' },
      { name: 'Consumer Awareness', slug: 'consumer-awareness', description: 'Consumer rights, warranty laws, hidden fees, and dark patterns.' },
      { name: 'Social Observations', slug: 'social-observations', description: 'Cultural phenomena, relationship dynamics, and modern urban living.' },
      { name: 'Science and Technology', slug: 'science-and-technology', description: 'Everyday gadgets, AI tools, cybersecurity, and technological shifts.' },
      { name: 'Practical Life Lessons', slug: 'practical-life-lessons', description: 'Actionable wisdom on negotiating, problem solving, and resilience.' },
    ],
  },
];
