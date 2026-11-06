'use client';

import Link from 'next/link';
import { useIsMobile } from '@/hooks/use-is-mobile';

import { useMemo } from 'react';
import { GitHubIcon, XIcon } from '../atoms/icons';
import styles from './footer.module.css';

export function MainFooter() {
  const isMobile = useIsMobile();

  const iconSize = useMemo(() => (isMobile ? '2x' : '1x'), [isMobile]);

  const iconPx = iconSize === '2x' ? 32 : 16;

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p className={styles.text}>
          © 2026{' '}
          <Link href="https://github.com/furudbat" target="_blank" rel="noreferrer">
            furudbat
          </Link>
          <span> - </span>
          <Link href={'https://github.com/furudbat/digimon-partner-kit'} title="License" target="_blank" rel="noopener">
            digimon-partner-kit v2.0.0
          </Link>
          <span> - </span>
          <Link
            href={'https://github.com/furudbat/digimon-partner-kit/blob/main/LICENSE'}
            title="License"
            target="_blank"
            rel="noopener"
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
        </p>
        <div className={styles.social}>
          <Link
            className={styles.socialLink}
            target="_blank"
            rel="noreferrer"
            href="https://twitter.com/furudbat"
            aria-label="Twitter"
          >
            <XIcon size={iconPx} />
          </Link>
          <Link
            className={styles.socialLink}
            target="_blank"
            rel="noreferrer"
            href="https://github.com/furudbat/digimon-partner-kit"
            aria-label="GitHub"
          >
            <GitHubIcon size={iconPx} />
          </Link>
        </div>
      </div>
    </footer>
  );
}
