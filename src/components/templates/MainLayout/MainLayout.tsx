import { ReactNode } from 'react';

import { MainFooter } from '@/components/organisms/footer';
import { MainHeader } from '@/components/organisms/header';

import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: ReactNode;
  className?: string;
}

// This is the place responsible for wrapping your app.
// Add here components like Footer, Nav etc.
export const MainLayout = ({ children, className }: MainLayoutProps) => {
  const wrapperStyles = cn('text-gray-900 dark:bg-gray-900 dark:text-gray-100', className);

  return (
    <div className={wrapperStyles}>
      <MainHeader />
      <main>{children}</main>
      <MainFooter />
    </div>
  );
};
