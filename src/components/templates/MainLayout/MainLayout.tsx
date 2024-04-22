import { faGithub, faTwitter } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Flowbite, Footer } from 'flowbite-react';
import { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: ReactNode;
  className?: string;
}

// This is the place responsible for wrapping your app.
// Add here components like Footer, Nav etc.
export const MainLayout = ({ children, className }: MainLayoutProps) => {
  const wrapperStyles = cn('flex flex-col min-h-screen bg-white dark:bg-gray-900', className);

  return (
    <div className={wrapperStyles}>
      <Flowbite>
        <main className="flex-1">{children}</main>
        <Footer container className="rounded-none shadow-none mt-16">
          <div className="w-full mx-auto max-w-screen-xl p-4 md:flex md:items-center md:justify-between">
            <span className="text-sm sm:text-center">
              © 2024{' '}
              <a href="https://github.com/furudbat" className="hover:underline">
                furudbat
              </a>
            </span>
            <ul className="flex flex-wrap items-center mt-3 text-sm font-medium text-gray-500 dark:text-gray-400 sm:mt-0">
              <li>
                <a href="https://github.com/furudbat" className="hover:underline me-4 md:me-6">
                  <FontAwesomeIcon icon={faGithub} />
                </a>
              </li>
              <li>
                <a href="https://twitter.com/furudbat" className="hover:underline me-4 md:me-6">
                  <FontAwesomeIcon icon={faTwitter} />
                </a>
              </li>
            </ul>
          </div>
        </Footer>
      </Flowbite>
    </div>
  );
};
