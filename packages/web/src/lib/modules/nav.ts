export type NavCountKey = 'tasks';

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
};

export type AppNavCounts = {
  tasks?: number;
};

/** Phase 1 tree: always-on chrome + Productivity → Tasks. Other modules absent. */
export function resolveAppNav(counts: AppNavCounts = {}): NavGroup[] {
  return [
    { id: 'dashboard', label: 'Dashboard', href: '/dashboard' },
    { id: 'ask', label: 'Ask', href: '/ask' },
    {
      id: 'productivity',
      label: 'Productivity',
      items: [
        {
          id: 'email',
          label: 'Email',
          href: '/productivity/email',
          nested: true,
        },
        {
          id: 'calendar',
          label: 'Calendar',
          href: '/productivity/calendar',
          nested: true,
        },
        {
          id: 'tasks',
          label: 'Tasks',
          href: '/productivity/tasks',
          countKey: 'tasks',
          nested: true,
          countLabel:
            typeof counts.tasks === 'number' && counts.tasks > 0 ? String(counts.tasks) : undefined,
        },
      ],
    },
    { id: 'alerts', label: 'Alerts', href: '/alerts' },
    { id: 'settings', label: 'Settings', href: '/settings' },
    {
      id: 'connections',
      label: 'Connections',
      items: [
        {
          id: 'connections-manage',
          label: 'Email & Calendar',
          href: '/settings/connections',
          nested: true,
        },
      ],
    },
  ];
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
