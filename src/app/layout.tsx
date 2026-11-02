import '@fortawesome/fontawesome-svg-core/styles.css';
import '@/styles/globals.css';

import { config } from '@fortawesome/fontawesome-svg-core';

import { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ReactNode, Suspense } from 'react';

import { MainProvider } from '@/components/providers/MainProvider';
import { MainLayout } from '@/components/templates/MainLayout';

import { cn } from '@/lib/utils';

// CSS is imported above; stop Font Awesome from injecting it at runtime
config.autoAddCss = false;

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
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.variable, 'font-primary')} suppressHydrationWarning>
        <MainProvider>
          <MainLayout>
            <Suspense>{children}</Suspense>
          </MainLayout>
        </MainProvider>
      </body>
    </html>
  );
};

export default RootLayout;
