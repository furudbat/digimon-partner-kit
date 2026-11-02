'use client';

import React, { useEffect, useState } from 'react';
import { useMediaQuery } from 'react-responsive';
import { scroller } from 'react-scroll';
import { Element } from 'react-scroll';
import { DigimonLevel, DigimonData } from 'src/models/digimon';

import { MediaQueryMobileBreakpoint } from '../constants';
import { DigimonTimelineCard } from '../molecules/digimon-timeline-card';
import styles from './digimon-timeline.module.css';

export function DigimonTimeline({
  selectDigimonLevel,
  clearDigimonLevel,
  isSelectable,
  baby1,
  baby2,
  child,
  adult,
  perfect,
  ultimate,
  currentSelectionLevel,
  printMode,
}: {
  selectDigimonLevel: (level: DigimonLevel) => void;
  clearDigimonLevel: (level: DigimonLevel) => void;
  isSelectable: (level: DigimonLevel) => boolean;
  baby1?: DigimonData;
  baby2?: DigimonData;
  child?: DigimonData;
  adult?: DigimonData;
  perfect?: DigimonData;
  ultimate?: DigimonData;
  currentSelectionLevel: DigimonLevel;
  printMode?: boolean;
}) {
  const [isMobile, setIsMobile] = useState(false);
  const isMobileQuery = useMediaQuery({ maxWidth: MediaQueryMobileBreakpoint });

  const onSelectCard = React.useCallback(
    (level: DigimonLevel) => {
      selectDigimonLevel(level);
      if (isMobile) {
        scroller.scrollTo('digimonSelectionList', {
          duration: 500,
          smooth: true,
        });
      } else {
        scroller.scrollTo('mainPage', {
          duration: 100,
          smooth: true,
        });
      }
    },
    [isMobile, selectDigimonLevel]
  );

  useEffect(() => {
    setIsMobile(isMobileQuery);
  }, [isMobileQuery]);

  const items: { level: DigimonLevel; id: string; marker: string; data?: DigimonData }[] = [
    { level: 'Baby I', id: 'digimonTimelineBabyI', marker: 'I', data: baby1 },
    { level: 'Baby II', id: 'digimonTimelineBabyII', marker: 'II', data: baby2 },
    { level: 'Child', id: 'digimonTimelineChild', marker: 'III', data: child },
    { level: 'Adult', id: 'digimonTimelineAdult', marker: 'IV', data: adult },
    { level: 'Perfect', id: 'digimonTimelinePerfect', marker: 'V', data: perfect },
    { level: 'Ultimate', id: 'digimonTimelineUltimate', marker: 'VI', data: ultimate },
  ];

  return (
    <>
      <Element name="digimonTimeline" />
      <ol className={styles.timeline}>
        {items.map((item, index) => (
          <li key={item.id} id={item.id} className={styles.item}>
            <Element name={item.id} />
            <div className={styles.markerRow}>
              <span className={styles.marker}>{item.marker}</span>
              {index < items.length - 1 && <span className={styles.line} />}
            </div>
            <DigimonTimelineCard
              title={item.level}
              data={item.data}
              onClick={() => onSelectCard(item.level)}
              onReset={() => clearDigimonLevel(item.level)}
              disabled={!isSelectable(item.level)}
              selected={currentSelectionLevel === item.level}
              printMode={printMode}
            />
          </li>
        ))}
      </ol>
    </>
  );
}
