import type { Metadata } from 'next';
import { Geist, Geist_Mono, Poppins } from 'next/font/google';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });
const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: '800',
});

export const metadata: Metadata = {
  title: 'Ops Agenda — One loop, closed every morning.',
  description:
    'Ops Agenda turns your email and calendar into a single ranked morning brief. AI proposes the priorities; you approve every action. Read-mostly access — nothing is sent, filed, or paid without you.',
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
      <body className="text-ink flex min-h-dvh flex-col font-sans">{children}</body>
    </html>
  );
}
