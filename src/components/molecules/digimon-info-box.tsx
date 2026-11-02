'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { DigimonData } from 'src/models/digimon';

import { NOT_FOUND_IMAGE } from '../constants';
import { useMemo } from 'react';
import styles from './digimon-info-box.module.css';

export function DigimonInfoBox({ data, height }: { data: DigimonData; height?: string }) {
  const isMobile = useIsMobile();
  //const pathname = usePathname();

  const minHeight = useMemo(() => height ?? '32rem', [height]);

  const heightInner = useMemo(() => height ?? '24rem', [height]);

  return (
    <section className={styles.box} style={!isMobile ? { minHeight } : undefined}>
      <div className={styles.grid}>
        <div className={styles.imageCol}>
          <Image
            className={styles.image}
            width={320}
            height={320}
            src={window.location.pathname + '/' + (data.img || NOT_FOUND_IMAGE)}
            alt={data.name}
            loading="eager"
          />
        </div>
        <div className={styles.details} style={!isMobile ? { height: heightInner } : undefined}>
          <h2 className={styles.name}>
            <Link href={data.href} title={data.name} target="_blank" rel="noreferrer">
              {data.name}
            </Link>
          </h2>
          <p>
            <strong>Level:</strong> {data.level}
          </p>
          {data.types?.length > 0 && (
            <div>
              <strong>Type:</strong>
              <ul className={styles.values}>
                {data.types.map((type) => (
                  <li key={type}>{type}</li>
                ))}
              </ul>
            </div>
          )}
          {data.attributes?.length > 0 && (
            <div>
              <strong>Attributes:</strong>
              <ul className={styles.values}>
                {data.attributes.map((attribute) => (
                  <li key={attribute}>{attribute}</li>
                ))}
              </ul>
            </div>
          )}
          {data.fields?.length > 0 && (
            <div>
              <strong>Field:</strong>
              <ul className={styles.values}>
                {data.fields.map((field) => (
                  <li key={field}>{field}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className={styles.categories}>
          {data.categories?.length > 0 &&
            data.categories.map((category) => (
              <Link
                key={category.title}
                href={category.href ?? '#'}
                title={category.title}
                target="_blank"
                rel="noreferrer"
              >
                <Image
                  className={styles.categoryIcon}
                  src={window.location.pathname + '/' + category.img}
                  alt={category.name}
                  width={50}
                  height={50}
                  loading="eager"
                />
              </Link>
            ))}
        </div>
      </div>
      <div className={styles.description}>
        <p className={styles.descriptionText}>{data.description}</p>
        <Link href={data.href} target="_blank" rel="noreferrer">
          more
        </Link>
      </div>
    </section>
  );
}
