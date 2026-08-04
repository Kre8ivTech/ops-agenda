import type { Metadata } from 'next';
import { Geist, Geist_Mono, Poppins } from 'next/font/google';

import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });
const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: '800',
});

export const metadata: Metadata = {
  title: {
    default: "Ops Agenda — It watches the things you'd only notice too late.",
    template: '%s — Ops Agenda',
  },
  description:
    'Ops Agenda reads the systems you already use, ranks your entire day by what is genuinely at risk, and hands you one agenda at 6:00 each morning. Read-only by design: it can see and flag, never move or file.',
  metadataBase: new URL('https://opsagenda.com'),
  icons: {
    icon: '/brand/favicon.svg',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} min-h-dvh antialiased`}
    >
      <body className="text-ink flex min-h-dvh flex-col font-sans">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
