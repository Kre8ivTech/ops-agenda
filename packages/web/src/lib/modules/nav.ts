export type NavCountKey = 'email' | 'calendar' | 'tasks' | 'alerts';

export type NavItem = {
  id: string;
  label: string;
  href: string;
  countKey?: NavCountKey;
  nested?: boolean;
  countLabel?: string;
};

export type NavGroup = {
  id: string;
  label: string;
  href?: string;
  items?: NavItem[];
  /** Collapse indicator: '+' means expandable but not active yet */
  collapsed?: boolean;
};

export type AppNavCounts = {
  email?: number;
  calendar?: number;
  tasks?: number;
  alerts?: number;
};

/**
 * Full portal navigation matching the design spec.
 * Module groups use the collapsed '+' indicator for future phases.
 */
export function resolveAppNav(counts: AppNavCounts = {}): NavGroup[] {
  return [
    { id: 'dashboard', label: 'Dashboard', href: '/dashboard' },
    { id: 'ask', label: 'Ask', href: '/ask' },
    {
      id: 'plan',
      label: 'Plan',
      collapsed: true,
    },
    {
      id: 'productivity',
      label: 'Productivity',
      items: [
        { id: 'briefs', label: 'Briefs', href: '/productivity/briefs', nested: true },
        {
          id: 'email',
          label: 'Email',
          href: '/productivity/email',
          countKey: 'email',
          nested: true,
          countLabel: fmtCount(counts.email),
        },
        {
          id: 'calendar',
          label: 'Calendar',
          href: '/productivity/calendar',
          countKey: 'calendar',
          nested: true,
          countLabel: fmtCount(counts.calendar),
        },
        {
          id: 'tasks',
          label: 'Tasks',
          href: '/productivity/tasks',
          countKey: 'tasks',
          nested: true,
          countLabel: fmtCount(counts.tasks),
        },
        { id: 'capacity', label: 'Capacity', href: '/productivity/capacity', nested: true },
        { id: 'time', label: 'Time', href: '/productivity/time', nested: true },
        { id: 'contacts', label: 'Contacts', href: '/productivity/contacts', nested: true },
      ],
    },
    {
      id: 'finances',
      label: 'Finances',
      items: [
        { id: 'finances-overview', label: 'Overview', href: '/finances/overview', nested: true },
        { id: 'finances-personal', label: 'Personal', href: '/finances/personal', nested: true },
        { id: 'finances-business', label: 'Business', href: '/finances/business', nested: true },
        { id: 'finances-subscriptions', label: 'Subscriptions', href: '/finances/subscriptions', nested: true, countLabel: '3' },
        { id: 'finances-budgets', label: 'Budgets', href: '/finances/budgets', nested: true },
        { id: 'finances-taxes', label: 'Taxes', href: '/finances/taxes', nested: true },
        { id: 'finances-forecast', label: 'Forecast', href: '/finances/forecast', nested: true },
        { id: 'finances-investments', label: 'Investments', href: '/finances/investments', nested: true },
      ],
    },
    {
      id: 'business',
      label: 'Business',
      collapsed: true,
    },
    {
      id: 'health',
      label: 'Health',
      collapsed: true,
    },
    {
      id: 'life',
      label: 'Life',
      collapsed: true,
    },
    {
      id: 'research',
      label: 'Research',
      collapsed: true,
    },
    {
      id: 'social',
      label: 'Social',
      collapsed: true,
    },
    {
      id: 'alerts',
      label: 'Alerts',
      href: '/alerts',
    },
    {
      id: 'settings',
      label: 'Settings',
      collapsed: true,
    },
  ];
}

function fmtCount(n?: number): string | undefined {
  return typeof n === 'number' && n > 0 ? String(n) : undefined;
}

export function isNavActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') {
    return pathname === '/dashboard' || pathname === '/';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function userInitials(nameOrEmail?: string): string {
  if (!nameOrEmail) return '?';
  const base = nameOrEmail.includes('@') ? nameOrEmail.split('@')[0]! : nameOrEmail;
  const parts = base
    .trim()
    .split(/[\s._-]+/)
    .filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
}
