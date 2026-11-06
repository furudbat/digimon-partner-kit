'use client';

import Image from 'next/image';
import Link from 'next/link';
import { DigimonData } from 'src/models/digimon';
import useFitText from 'use-fit-text';

import { cn } from '@/lib/utils';
import styles from './digimon-timeline-card.module.css';

export function DigimonTimelineCard({
  title,
  data,
  onClick,
  onReset,
  disabled,
  selected,
  highlight,
  printMode,
}: {
  title?: string;
  data?: DigimonData;
  onClick?: () => void;
  onReset?: () => void;
  disabled?: boolean;
  selected?: boolean;
  highlight?: boolean;
  printMode?: boolean;
}) {
  const { fontSize, ref } = useFitText();
  //const pathname = usePathname();

  const imgSize = 240;

  return (
    <article
      className={cn(
        styles.card,
        highlight && styles.highlight,
        printMode && styles.print,
        selected && !printMode && styles.selected
      )}
      style={{ height: imgSize + 78 }}
    >
      <div
        className={cn(styles.media, data || !disabled ? styles.clickable : styles.notAllowed)}
        onClick={() => {
          if ((data || !disabled) && onClick) {
            onClick();
          }
        }}
      >
        {data && (
          <Image
            className={styles.image}
            src={window.location.pathname + '/' + data.img}
            width={imgSize}
            height={imgSize}
            alt={data.name}
            loading="eager"
          />
        )}
        {!data && !printMode && !disabled && !selected && <p className={styles.placeholder}>Click Me to Select</p>}
        {!data && !printMode && !disabled && selected && (
          <p className={styles.placeholder}>Select Digimon in the list below</p>
        )}
        {!data && !printMode && disabled && <p className={styles.placeholder}>(Select previous Level)</p>}
        {!data && printMode && <p className={styles.placeholder}>No Data</p>}
      </div>

      <div className={styles.body}>
        {data && !printMode && (
          <Link href={data.href} target="_blank" rel="noreferrer" className={styles.name}>
            {data.name}
          </Link>
        )}
        {data && printMode && (
          <div ref={ref} style={{ fontSize }} className={styles.namePrint}>
            {data.name}
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <span>{data?.level || title}</span>
        {!printMode && data && (
          <button type="button" className="btn btn-small" disabled={disabled} onClick={() => onReset && onReset()}>
            Reset
          </button>
        )}
      </div>
    </article>
  );
}
