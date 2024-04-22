import '@/styles/globals.css';

import { ThemeModeScript } from 'flowbite-react';
import { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ReactNode } from 'react';

import { MainProvider } from '@/components/providers/MainProvider';
import { MainLayout } from '@/components/templates/MainLayout';

import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'], variable: '--font-primary' });

export const metadata: Metadata = {
  title: 'Digimon Partner Kit',
  description: 'Build your own Digimon-Partner Digivolution line.',
};

interface RootLayoutProps {
  children: ReactNode;
}

const RootLayout = ({ children }: RootLayoutProps) => {
  return (
    <html lang="en">
      <head>
        <ThemeModeScript />
      </head>
      <body className={cn(inter.variable, 'font-primary', 'h-screen')} suppressHydrationWarning>
        <MainProvider>
          <MainLayout>
            <main>{children}</main>
          </MainLayout>
        </MainProvider>
      </body>
    </html>
  );
};

export default RootLayout;
