import Link from 'next/link';

const NAV = [
  { href: '/admin/ai', label: 'Overview' },
  { href: '/admin/ai/prompts', label: 'Prompts' },
  { href: '/admin/ai/models', label: 'Models' },
  { href: '/admin/ai/agents', label: 'Agents' },
  { href: '/admin/ai/usage', label: 'Usage' },
];

export default function AIAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">AI Management</h1>
        <nav className="flex items-center gap-2">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[0.82rem] font-bold border border-border rounded-full px-3 py-1.5 hover:bg-ink hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <div>{children}</div>
    </div>
  );
}
