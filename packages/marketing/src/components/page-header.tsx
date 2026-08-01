import type { ReactNode } from 'react';

export interface PageHeaderProps {
  eyebrow: string;
  title: ReactNode;
  lede: ReactNode;
  /** Headline measure — the mockup varies this per page. */
  titleMaxCh?: string;
  ledeMaxCh?: string;
  children?: ReactNode;
}

export function PageHeader({
  eyebrow,
  title,
  lede,
  titleMaxCh = '22ch',
  ledeMaxCh = '60ch',
  children,
}: PageHeaderProps) {
  return (
    <section className="mx-auto max-w-[1400px] px-[clamp(20px,4vw,44px)] pt-[84px] pb-[60px]">
      {children}
      <p className="text-signal font-mono m-0 mb-[18px] text-[0.74rem] leading-none font-bold tracking-[0.12em] uppercase">
        {eyebrow}
      </p>
      <h1
        className="m-0 mb-5 text-[clamp(2.15rem,6.4vw,3.3rem)] leading-[1.03] tracking-[-0.032em] text-balance"
        style={{ maxWidth: titleMaxCh }}
      >
        {title}
      </h1>
      <p
        className="text-text-secondary m-0 text-[clamp(1rem,2.1vw,1.15rem)] leading-[1.5]"
        style={{ maxWidth: ledeMaxCh }}
      >
        {lede}
      </p>
    </section>
  );
}
