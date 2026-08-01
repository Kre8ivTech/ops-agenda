'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { Lockup } from '@/components/lockup';
import { CTA_LABEL_TEXT, NAV_ITEMS } from '@/lib/site-config';

function isActive(pathname: string, href: string) {
  return href === '/modules' ? pathname.startsWith('/modules') : pathname === href;
}

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="border-border sticky top-0 z-20 flex flex-wrap items-center justify-between gap-5 border-b bg-[rgba(247,247,242,0.94)] px-[clamp(20px,4vw,44px)] py-[15px] backdrop-blur-[10px]">
        <Link href="/" className="shrink-0" onClick={() => setMenuOpen(false)}>
          <Lockup size={33} />
        </Link>

        <nav className="hidden items-center justify-end gap-0.5 lg:flex">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`rounded-[7px] px-[11px] py-[7px] text-[0.86rem] whitespace-nowrap transition-colors ${
                  active
                    ? 'text-ink bg-wash font-extrabold'
                    : 'text-text-secondary hover:text-ink font-semibold'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/waitlist"
            className="bg-ink hover:bg-signal ml-2.5 inline-flex h-[38px] items-center rounded-[8px] px-4 text-[0.86rem] font-extrabold whitespace-nowrap text-[var(--paper)] transition-colors"
          >
            {CTA_LABEL_TEXT}
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="site-menu"
          className="border-border hover:border-ink flex h-[42px] shrink-0 items-center gap-[9px] rounded-[8px] border bg-white px-[14px] transition-colors lg:hidden"
        >
          <span className="grid w-[15px] gap-[3px]" aria-hidden="true">
            <span className="bg-ink h-[2px] rounded-[2px]" />
            <span className="bg-ink h-[2px] rounded-[2px]" />
            <span className="bg-ink h-[2px] rounded-[2px]" />
          </span>
          <span className="text-ink text-[0.85rem] font-extrabold">
            {menuOpen ? 'Close' : 'Menu'}
          </span>
        </button>
      </header>

      {menuOpen && (
        <div
          id="site-menu"
          className="border-border relative z-[19] grid gap-[3px] border-b bg-white px-[clamp(20px,4vw,44px)] pt-[14px] pb-5 lg:hidden"
        >
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                aria-current={active ? 'page' : undefined}
                className={`rounded-[8px] px-3 py-[13px] text-base ${
                  active ? 'text-ink bg-wash font-extrabold' : 'text-text-secondary font-semibold'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/waitlist"
            onClick={() => setMenuOpen(false)}
            className="bg-ink hover:bg-signal mt-[9px] inline-flex h-[50px] items-center justify-center rounded-[8px] font-extrabold text-[var(--paper)] transition-colors"
          >
            {CTA_LABEL_TEXT}
          </Link>
        </div>
      )}
    </>
  );
}
