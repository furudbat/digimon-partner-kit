'use client';

import React, { useMemo } from 'react';
import { Element } from 'react-scroll';
import { DigimonData, DigimonDataEvolveElement, DigimonLevel, DigimonListElement } from 'src/models/digimon';
import { useDebouncedCallback } from 'use-debounce';
import { cn } from '@/lib/utils';
import { DigimonListMaxHeight, DigimonListMaxHeightMd } from '@/components/constants';
import { ArrowLeftIcon, ArrowRightIcon } from '../atoms/icons';
import styles from './digimon-selection-list.module.css';

function LevelSelectionButtonGroup({
  prevDigimonLevel,
  nextDigimonLevel,
  isSelectable,
  gotoDigimonLevel,
  isDigimonLevelSet,
}: {
  prevDigimonLevel?: DigimonLevel;
  nextDigimonLevel?: DigimonLevel;
  isSelectable: (level: DigimonLevel) => boolean;
  gotoDigimonLevel: (level: DigimonLevel) => void;
  isDigimonLevelSet: (levels: DigimonLevel[]) => boolean;
}) {
  const buttonGroup = React.useMemo(
    () =>
      prevDigimonLevel &&
      nextDigimonLevel && (
        <div className={styles.levelNav} role="group">
          <button
            type="button"
            className={styles.levelButton}
            disabled={!isSelectable(prevDigimonLevel) && !isDigimonLevelSet([prevDigimonLevel])}
            onClick={() => gotoDigimonLevel(prevDigimonLevel)}
          >
            <ArrowLeftIcon />
            <span>{prevDigimonLevel}</span>
          </button>
          <button
            type="button"
            className={styles.levelButton}
            disabled={!isSelectable(nextDigimonLevel) && !isDigimonLevelSet([nextDigimonLevel])}
            onClick={() => gotoDigimonLevel(nextDigimonLevel)}
          >
            <span>{nextDigimonLevel}</span>
            <ArrowRightIcon />
          </button>
        </div>
      ),
    [prevDigimonLevel, nextDigimonLevel, isSelectable, isDigimonLevelSet, gotoDigimonLevel]
  );

  const prevDigimonLevelButton = React.useMemo(
    () =>
      prevDigimonLevel &&
      !nextDigimonLevel && (
        <div className={styles.levelNav}>
          <button
            type="button"
            className={styles.levelButton}
            disabled={!isSelectable(prevDigimonLevel) && !isDigimonLevelSet([prevDigimonLevel])}
            onClick={() => gotoDigimonLevel(prevDigimonLevel)}
          >
            <ArrowLeftIcon />
            <span>{prevDigimonLevel}</span>
          </button>
        </div>
      ),
    [prevDigimonLevel, nextDigimonLevel, isSelectable, isDigimonLevelSet, gotoDigimonLevel]
  );

  const nextDigimonLevelButton = React.useMemo(
    () =>
      !prevDigimonLevel &&
      nextDigimonLevel && (
        <div className={styles.levelNav}>
          <button
            type="button"
            className={styles.levelButton}
            disabled={!isSelectable(nextDigimonLevel) && !isDigimonLevelSet([nextDigimonLevel])}
            onClick={() => gotoDigimonLevel(nextDigimonLevel)}
          >
            <span>{nextDigimonLevel}</span>
            <ArrowRightIcon />
          </button>
        </div>
      ),
    [prevDigimonLevel, nextDigimonLevel, isSelectable, isDigimonLevelSet, gotoDigimonLevel]
  );

  return buttonGroup || prevDigimonLevelButton || nextDigimonLevelButton;
}

export type SelectableDigimon = DigimonDataEvolveElement | DigimonListElement;

export function DigimonSelectionList({
  selectableDigimons,
  allSelectableDigimons,
  isSelectable,
  currentSelectionLevel,
  gotoDigimonLevel,
  selectDigimon,
  currentDigimon,
  prevDigimon,
  isDigimonLevelSet,
  freeMode,
  digimons,
}: {
  selectableDigimons?: SelectableDigimon[];
  allSelectableDigimons?: SelectableDigimon[];
  isSelectable: (level: DigimonLevel) => boolean;
  currentSelectionLevel: DigimonLevel;
  gotoDigimonLevel: (level: DigimonLevel) => void;
  selectDigimon: (digimonId: string) => void;
  currentDigimon?: DigimonData;
  prevDigimon?: DigimonData;
  isDigimonLevelSet: (levels: DigimonLevel[]) => boolean;
  freeMode?: boolean;
  digimons?: Record<string, DigimonData>;
}) {
  const [digimonSearch, setDigimonSearch] = React.useState('');
  const debouncedDigimonSearch = useDebouncedCallback((value) => setDigimonSearch(value), 230);

  const prevDigimonLevel = React.useMemo((): DigimonLevel | undefined => {
    switch (currentSelectionLevel) {
      case 'Baby II':
        return 'Baby I';
      case 'Child':
        return 'Baby II';
      case 'Adult':
        return 'Child';
      case 'Perfect':
        return 'Adult';
      case 'Ultimate':
        return 'Perfect';
    }
    return undefined;
  }, [currentSelectionLevel]);

  const nextDigimonLevel = React.useMemo((): DigimonLevel | undefined => {
    switch (currentSelectionLevel) {
      case 'Baby I':
        return 'Baby II';
      case 'Baby II':
        return 'Child';
      case 'Child':
        return 'Adult';
      case 'Adult':
        return 'Perfect';
      case 'Perfect':
        return 'Ultimate';
    }
    return undefined;
  }, [currentSelectionLevel]);

  const digimonList = React.useMemo(
    () => (freeMode ? allSelectableDigimons : selectableDigimons) ?? [],
    [freeMode, selectableDigimons, allSelectableDigimons]
  );

  const filteredSelectableDigimons = React.useMemo(
    () =>
      digimonSearch
        ? digimonList.filter((d) => d.name.toLowerCase().includes(digimonSearch.toLowerCase()))
        : digimonList,
    [digimonList, digimonSearch]
  );

  const isEvolCanon = React.useCallback(
    (digimonId: string) => {
      const digimon = selectableDigimons?.find((s) => s.id === digimonId);
      if (!digimon || !('canon' in digimon)) {
        return false;
      }

      return !!digimon.canon;
    },
    [selectableDigimons]
  );

  const levelDisabled = !isSelectable(currentSelectionLevel);

  const selectionText1 = React.useMemo(() => {
    return `Select ${currentSelectionLevel} Level`;
  }, [currentSelectionLevel, prevDigimon]);

  const selectionText2 = React.useMemo(() => {
    return prevDigimon ? `Digivolved from ${prevDigimon.name}` : '';
  }, [currentSelectionLevel, prevDigimon]);

  const heightClasses = useMemo(
    () => `max-h-[${DigimonListMaxHeight}] md:max-h-[${DigimonListMaxHeightMd}]`,
    [DigimonListMaxHeight, DigimonListMaxHeightMd]
  );

  return (
    <div id="digimonSelectionList" className={styles.root}>
      <Element name="digimonSelectionList" />
      <LevelSelectionButtonGroup
        nextDigimonLevel={nextDigimonLevel}
        prevDigimonLevel={prevDigimonLevel}
        isSelectable={isSelectable}
        gotoDigimonLevel={gotoDigimonLevel}
        isDigimonLevelSet={isDigimonLevelSet}
      />

      <div className={styles.heading}>
        {selectableDigimons && (
          <h3>
            {levelDisabled ? (
              <span className="underline">Can not select Digivolution in the middle of the line</span>
            ) : (
              <>{selectionText1}</>
            )}
          </h3>
        )}
      </div>
      <div className={styles.subheading}>
        {selectableDigimons && (
          <h3>
            <em className={styles.muted}>{selectionText2}</em>
          </h3>
        )}
      </div>

      <div className={styles.search}>
        {selectableDigimons && (
          <form onSubmit={(e) => e.preventDefault()}>
            <label htmlFor="digimon-list-search" className="sr-only">
              Search
            </label>
            <input
              type="search"
              id="digimon-list-search"
              className={styles.searchInput}
              placeholder="Search"
              onChange={(e) => debouncedDigimonSearch(e.target.value)}
              disabled={levelDisabled || digimonList.length === 0}
            />
          </form>
        )}
      </div>

      <div
        className={styles.listScroll}
        style={
          { '--list-max-h': DigimonListMaxHeight, '--list-max-h-md': DigimonListMaxHeightMd } as React.CSSProperties
        }
      >
        <ul className={styles.list}>
          {digimonList.length === 0 && <li className={styles.empty}>No Digimon to select</li>}
          {filteredSelectableDigimons.map((digimon) => {
            const canon = isEvolCanon(digimon.id);
            const isActive = digimon.id === currentDigimon?.id;
            const isInEvolveLine = selectableDigimons?.some((s) => s.id === digimon.id);
            //const digimonData = digimons ? digimons[digimon.id] : undefined;

            const badges = ((): string[] => {
              const anime = 'animes' in digimon && digimon.animes?.length ? 'anime' : undefined;
              const dm = 'dm' in digimon && digimon.dm ? 'dm' : undefined;
              const dm20 = 'dm20' in digimon && digimon.dm20 ? 'dm20' : undefined;
              const dmc = 'dmc' in digimon && digimon.dmc ? 'dmc' : undefined;
              const dmx = 'dmx' in digimon && digimon.dmx ? 'dmx' : undefined;
              const pen = 'pen' in digimon && digimon.pen ? 'pen' : undefined;
              const pen20 = 'pen20' in digimon && digimon.pen20 ? 'pen20' : undefined;

              return [anime, dm, dm20, dmc, dmx, pen, pen20].filter((b) => b) as string[];
            })();
            const visibleBadges = badges.length <= 2 ? badges.slice(0, 2) : badges.slice(0, 1);
            const hiddenBadges = badges.length <= 2 ? badges.slice(2) : badges.slice(1);
            const animeList =
              'animes' in digimon && digimon.animes ? Array.from(new Set(digimon.animes)).join(', ') : undefined;

            return (
              <li key={digimon.id}>
                <button
                  type="button"
                  className={cn(styles.item, isActive && styles.active, canon && styles.canon)}
                  onClick={() => selectDigimon(digimon.id)}
                  aria-current={isActive ? 'true' : undefined}
                  disabled={!isSelectable(currentSelectionLevel)}
                >
                  <span className={cn(styles.itemName, freeMode && !isInEvolveLine && styles.italic)}>
                    {canon ? <strong>{digimon.name}</strong> : digimon.name}
                  </span>

                  <span className={styles.badges}>
                    {visibleBadges.map((badge) => {
                      const isAnimeBadge = badge === 'anime' && animeList;
                      return (
                        <span
                          key={badge}
                          className={cn(styles.badge, isAnimeBadge && styles.badgeAnime)}
                          title={isAnimeBadge ? animeList : undefined}
                        >
                          {badge}
                        </span>
                      );
                    })}

                    {hiddenBadges.length > 0 && (
                      <span className={styles.badge} title={hiddenBadges.join(', ')}>
                        ...
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
