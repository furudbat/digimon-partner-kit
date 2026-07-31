'use client';

import { faGithub, faTwitter } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Footer } from 'flowbite-react';
import Link from 'next/link';
import { useMediaQuery } from 'react-responsive';

import { MediaQueryMobileBreakpoint } from '../constants';
import { useEffect, useMemo, useState } from 'react';

export function MainFooter() {
  const [isMobile, setIsMobile] = useState(false); // SSR-safe default
  const isMobileQuery = useMediaQuery({ maxWidth: MediaQueryMobileBreakpoint });

  const iconSize = useMemo(() => (isMobile ? '2x' : '1x'), [isMobile]);

  useEffect(() => {
    setIsMobile(isMobileQuery);
  }, [isMobileQuery]);

  return (
    <Footer container className="rounded-none shadow-none shrink-0 mt-5">
      <div className="m-1 md:mx-6 w-full">
        <div className="md:flex items-center sm:justify-between w-full min-h-14 p-1">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            © 2026{' '}
            <Link href="https://github.com/furudbat" target="_blank" rel="noreferrer" className="hover:underline">
              furudbat
            </Link>
            <span> - </span>
            <Link
              href={'https://github.com/furudbat/digimon-partner-kit'}
              title="License"
              target="_blank"
              rel="noopener"
              className="hover:underline"
            >
              digimon-partner-kit v1.2.5
            </Link>
            <span> - </span>
            <Link
              href={'https://github.com/furudbat/digimon-partner-kit/blob/main/LICENSE'}
              title="License"
              target="_blank"
              rel="noopener"
              className="hover:underline"
            >
              MIT
            </Link>
            <br />
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
              <FontAwesomeIcon icon={faTwitter} size={iconSize} />
            </Link>
            <Link
              className="text-gray-500 dark:text-gray-400 font-medium md:font-small p-2"
              target="_blank"
              rel="noreferrer"
              href="https://github.com/furudbat/digimon-partner-kit"
            >
              <FontAwesomeIcon icon={faGithub} size={iconSize} />
            </Link>
          </div>
        </div>
      </div>
    </Footer>
  );
}
