'use client';

import { faGithub, faTwitter } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Footer } from 'flowbite-react';
import Link from 'next/link';
import { useMediaQuery } from 'react-responsive';

import { MediaQueryMobileBreakpoint } from '../constants';

export function MainFooter() {
  const isMobile = useMediaQuery({ maxWidth: MediaQueryMobileBreakpoint });

  return (
    <Footer container className="footer bottom-0 inset-x-0 rounded-none shadow-none h-14 mt-4 md:mt-6 lg:mt-8">
      <div className="m-2 md:mx-6 w-full">
        <div className="md:flex items-center sm:justify-between w-full h-14">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            © 2025{' '}
            <Link href="https://github.com/furudbat" target="_blank" rel="noreferrer" className="hover:underline">
              furudbat
            </Link>
            .{' '}
            <em>
              This Project is a free fan site and not affiliated with Bandai Namco. Digimon and other media relating to
              the franchise are registered trademarks by{' '}
              <Link href="https://www.bandai.com/" title="Bandai Namco" target="_blank" rel="noreferrer">
                Bandai Namco
              </Link>
              . Images and data from{' '}
              <Link href="https://wikimon.net/" title="wikimon" target="_blank" rel="noreferrer">
                https://wikimon.net/
              </Link>
              .
            </em>
          </span>
          <div className="text-center m-2 p-2 md:p-0 md:m-0 md:mt-2">
            <Link
              className="text-gray-500 dark:text-gray-400 font-medium md:font-small p-2"
              target="_blank"
              rel="noreferrer"
              href="https://twitter.com/furudbat"
            >
              <FontAwesomeIcon icon={faTwitter} size={isMobile ? '2x' : '1x'} />
            </Link>
            <Link
              className="text-gray-500 dark:text-gray-400 font-medium md:font-small p-2"
              target="_blank"
              rel="noreferrer"
              href="https://github.com/furudbat/digimon-partner-kit"
            >
              <FontAwesomeIcon icon={faGithub} size={isMobile ? '2x' : '1x'} />
            </Link>
          </div>
        </div>
      </div>
    </Footer>
  );
}
