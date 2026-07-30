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
  title: 'Ops Agenda',
  description:
    'Turns email and calendar data into a structured, actionable daily and weekly agenda.',
  icons: {
    icon: '/brand/favicon.svg',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans text-ink">{children}</body>
    </html>
  );
}
