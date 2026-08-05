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

const DEFAULT_TITLE = "Ops Agenda — It watches the things you'd only notice too late.";
const DEFAULT_DESCRIPTION =
  'Ops Agenda reads the systems you already use, ranks your entire day by what is genuinely at risk, and hands you one agenda at 6:00 each morning. Read-only by design: it can see and flag, never move or file.';

export const metadata: Metadata = {
  title: {
    default: DEFAULT_TITLE,
    template: '%s — Ops Agenda',
  },
  description: DEFAULT_DESCRIPTION,
  metadataBase: new URL('https://opsagenda.com'),
  alternates: { canonical: '/' },
  icons: {
    // `icon.tsx` and `apple-icon.tsx` (app-directory file convention) add
    // their own generated PNG icons automatically — this SVG is an
    // additional entry, not a replacement.
    icon: '/brand/favicon.svg',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: '/',
    siteName: 'Ops Agenda',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
};

const ORGANIZATION_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Ops Agenda',
  url: 'https://opsagenda.com',
  logo: 'https://opsagenda.com/brand/ops-agenda-mark-ink.svg',
  description: DEFAULT_DESCRIPTION,
};

const SOFTWARE_APPLICATION_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Ops Agenda',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description: DEFAULT_DESCRIPTION,
  offers: {
    '@type': 'AggregateOffer',
    priceCurrency: 'USD',
    lowPrice: '19',
    highPrice: '79',
    offerCount: '3',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} min-h-dvh antialiased`}
    >
      <body className="text-ink flex min-h-dvh flex-col font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSON_LD) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(SOFTWARE_APPLICATION_JSON_LD) }}
        />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
