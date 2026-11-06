import { ReactNode } from 'react';

import { MainFooter } from '@/components/organisms/footer';
import { MainHeader } from '@/components/organisms/header';

interface MainLayoutProps {
  children: ReactNode;
  className?: string;
}

// This is the place responsible for wrapping your app.
// Add here components like Footer, Nav etc.
export const MainLayout = ({ children, className }: MainLayoutProps) => {
  return (
    <div className={className}>
      <MainHeader />
      <main>{children}</main>
      <MainFooter />
    </div>
  );
};
