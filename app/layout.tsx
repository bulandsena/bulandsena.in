import type { Metadata } from 'next';
import {
  Playfair_Display,
  Plus_Jakarta_Sans,
  Noto_Sans_Devanagari,
  IBM_Plex_Mono,
} from 'next/font/google';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const devanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-marathi',
  display: 'swap',
});

const ibmMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Bulandsena.in — Independent Marathi & Local Journalism',
  description:
    'Independent Marathi and English local journalism platform with live updates, video reports, trending news, and an editorial CMS.',
  openGraph: {
    title: 'Bulandsena.in — Independent Marathi & Local Journalism',
    description:
      'Independent Marathi and English local journalism platform with live updates, video reports, trending news, and an editorial CMS.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bulandsena.in — Independent Marathi & Local Journalism',
    description:
      'Independent Marathi and English local journalism platform with live updates, video reports, trending news, and an editorial CMS.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="mr"
      className={`${playfair.variable} ${jakarta.variable} ${devanagari.variable} ${ibmMono.variable}`}
    >
      <body
        suppressHydrationWarning
        className="bg-[#FBF9F5] text-[#1C1917] antialiased selection:bg-[#9A3412]/15 selection:text-[#9A3412]"
      >
        {children}
      </body>
    </html>
  );
}
