import type { Metadata } from 'next';
import Providers from '@/components/Providers';
import AppHeader from '@/components/AppHeader';
import './globals.css';

export const metadata: Metadata = {
  title: 'Atlas - Makerspace Inventory',
  description: 'Find tools, equipment, materials, and supplies across the makerspace',
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AppHeader />
          {children}
        </Providers>
      </body>
    </html>
  );
}
