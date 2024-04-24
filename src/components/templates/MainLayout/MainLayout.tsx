import { Flowbite } from 'flowbite-react';
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
  const wrapperStyles = cn('flex flex-col min-h-full bg-white dark:bg-gray-900 snap-y', className);

  return (
    <div className={wrapperStyles}>
      <Flowbite>
        <MainHeader />
        <main className="flex-2 flex-grow snap-start">{children}</main>
        <MainFooter />
      </Flowbite>
    </div>
  );
};
