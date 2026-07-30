'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { Lockup } from '@/components/chrome/lockup';
import { SignOutButton } from '@/components/sign-out-button';
import { isNavActive, userInitials, type NavGroup } from '@/lib/modules/nav';

export type AppSidebarProps = {
  nav: NavGroup[];
  user: { name?: string; email?: string; orgLabel?: string };
};

function NavLink({
  href,
  label,
  countLabel,
  nested,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  countLabel?: string;
  nested?: boolean;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2.5 rounded-[7px] px-2.5 py-[7px] text-[0.85rem] font-bold transition-colors hover:bg-white/[0.07] ${
        nested ? 'pl-[22px]' : ''
      } ${active ? 'bg-white/[0.08] font-extrabold text-white' : 'text-white/72'}`}
    >
      <span className="truncate">{label}</span>
      {countLabel ? (
        <span className="font-mono text-[0.7rem] font-bold text-white/55">{countLabel}</span>
      ) : null}
    </Link>
  );
}

function SidebarBody({ nav, user, onNavigate }: AppSidebarProps & { onNavigate?: () => void }) {
  const pathname = usePathname();
  const displayName = user.name?.trim() || user.email || 'Signed in';
  const initials = userInitials(user.name || user.email);

  return (
    <>
      <div className="px-2">
        <Lockup mark="paper" size={30} className="text-paper" />
      </div>

      <nav className="grid content-start gap-px">
        {nav.map((group) => (
          <div key={group.id} className="grid gap-px">
            {group.href ? (
              <NavLink
                href={group.href}
                label={group.label}
                active={isNavActive(pathname, group.href)}
                onNavigate={onNavigate}
              />
            ) : (
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2.5 rounded-[7px] px-2.5 py-[7px]">
                <span className="truncate text-[0.86rem] font-extrabold text-white/72">
                  {group.label}
                </span>
              </div>
            )}
            {group.items?.map((item) => (
              <NavLink
                key={item.id}
                href={item.href}
                label={item.label}
                countLabel={item.countLabel}
                nested={item.nested}
                active={isNavActive(pathname, item.href)}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        ))}
      </nav>

      <div className="mt-auto grid gap-2.5">
        <div className="grid gap-[7px] rounded-[8px] bg-white/[0.06] p-3">
          <span className="font-mono text-[0.68rem] font-extrabold uppercase text-signal-on-ink">
            Sync
          </span>
          <span className="text-[0.8rem] leading-[1.35] text-white/70">
            Connectors stubbed — mail and calendar sync in Phase 2.
          </span>
        </div>

        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2.5 rounded-[8px] px-2 py-2.5">
          <span className="grid size-[30px] place-items-center rounded-full bg-signal font-sans text-[0.76rem] font-extrabold text-white">
            {initials}
          </span>
          <span className="grid min-w-0 gap-px">
            <strong className="truncate text-[0.84rem] text-white">{displayName}</strong>
            <span className="truncate text-[0.74rem] text-white/50">
              {user.orgLabel ?? user.email ?? 'Local preview'}
            </span>
            <SignOutButton variant="ink" />
          </span>
        </div>
      </div>
    </>
  );
}

export function AppSidebar(props: AppSidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="fixed top-3 left-3 z-40 inline-flex h-10 items-center rounded-[8px] border border-border bg-white px-3 text-[0.83rem] font-extrabold text-ink shadow-[var(--shadow-panel)] lg:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
      >
        Menu
      </button>

      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-ink/40 lg:hidden"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-[246px] shrink-0 flex-col gap-5 overflow-y-auto bg-ink px-3.5 py-5 transition-transform lg:sticky lg:top-0 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <SidebarBody {...props} onNavigate={() => setOpen(false)} />
      </aside>
    </>
  );
}
