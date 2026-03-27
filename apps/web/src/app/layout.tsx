import type { Metadata, Viewport } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { ServiceWorkerRegister } from '@/components/shared/sw-register';
import { OfflineBanner } from '@/components/shared/offline-banner';
import './globals.css';

export const metadata: Metadata = {
  title: 'FinVerse',
  description: 'Smart personal finance tracking with AI-powered insights',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' },
    ],
    apple: '/icons/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FinVerse',
  },
};

export const viewport: Viewport = {
  themeColor: '#6366f1',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" data-theme="fintrack">
        <body className="min-h-screen bg-base-200 font-sans text-base-content antialiased">
          {children}
          <OfflineBanner />
          <ServiceWorkerRegister />
        </body>
      </html>
    </ClerkProvider>
  );
}
