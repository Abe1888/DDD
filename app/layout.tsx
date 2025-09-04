import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import ConnectionGuard from '@/components/ui/ConnectionGuard';
import MemoProvider from '@/components/providers/MemoProvider';

// Optimize font loading with display swap for better performance
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
});

export const metadata: Metadata = {
  title: 'Vehicle GPS Tracking Installation Management System',
  description: 'Professional dashboard for managing GPS tracking device installations across vehicle fleets',
  keywords: ['GPS tracking', 'vehicle management', 'installation', 'fleet management'],
  authors: [{ name: 'GPS Installation Team' }],
  robots: 'index, follow',
  openGraph: {
    title: 'Vehicle GPS Tracking Installation Management',
    description: 'Professional dashboard for managing GPS tracking device installations',
    type: 'website',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS prefetch for Supabase */}
        <link rel="dns-prefetch" href="https://supabase.com" />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        
        {/* Prevent FOUC */}
        <style dangerouslySetInnerHTML={{
          __html: `
            html { visibility: hidden; opacity: 0; }
            html.loaded { visibility: visible; opacity: 1; transition: opacity 0.3s; }
          `
        }} />
      </head>
      <body className={`${inter.className} antialiased`}>
        <script dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener('DOMContentLoaded', function() {
              document.documentElement.classList.add('loaded');
            });
          `
        }} />
        <ErrorBoundary>
          <ConnectionGuard>
            <MemoProvider>
            <div id="root" className="min-h-screen">
              {children}
            </div>
            </MemoProvider>
          </ConnectionGuard>
        </ErrorBoundary>
      </body>
    </html>
  );
}
