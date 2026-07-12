'use client';

import { faArrowLeft, faArrowRight, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Badge, Button, TextInput, Tooltip } from 'flowbite-react';
import React from 'react';
import { Element } from 'react-scroll';
import { DigimonData, DigimonDataEvolveElement, DigimonLevel, DigimonListElement } from 'src/models/digimon';
import { useDebouncedCallback } from 'use-debounce';
import { cn } from '@/lib/utils';

const LIST_WIDTH = 86;
const LIST_HEIGHT = 96;

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
        <div className="flex justify-center w-full md:w-100">
          <div className="grow inline-flex" role="group">
            <Button
              outline
              color="gray"
              disabled={!isSelectable(prevDigimonLevel) && !isDigimonLevelSet([prevDigimonLevel])}
              onClick={() => gotoDigimonLevel(prevDigimonLevel)}
              className={`align-start text-center items-center rounded-none rounded-l w-2/4 md:w-${LIST_WIDTH / 2}`}
            >
              <FontAwesomeIcon icon={faArrowLeft} className="mx-1 my-1 inline-block align-middle" />
              <span className="inline-block align-middle">{prevDigimonLevel}</span>
            </Button>
            <Button
              outline
              color="gray"
              disabled={!isSelectable(nextDigimonLevel) && !isDigimonLevelSet([nextDigimonLevel])}
              onClick={() => gotoDigimonLevel(nextDigimonLevel)}
              className={`align-end text-center items-center rounded-none rounded-r w-2/4 md:w-${LIST_WIDTH / 2}`}
            >
              <span className="inline-block align-middle">{nextDigimonLevel}</span>
              <FontAwesomeIcon icon={faArrowRight} className="mx-1 my-1 inline-block align-middle" />
            </Button>
          </div>
        </div>
      ),
    [prevDigimonLevel, nextDigimonLevel, isSelectable, isDigimonLevelSet, gotoDigimonLevel]
  );

  const prevDigimonLevelButton = React.useMemo(
    () =>
      prevDigimonLevel &&
      !nextDigimonLevel && (
        <Button
          outline
          color="gray"
          disabled={!isSelectable(prevDigimonLevel) && !isDigimonLevelSet([prevDigimonLevel])}
          onClick={() => gotoDigimonLevel(prevDigimonLevel)}
          className={`text-center items-center w-full md:w-${LIST_WIDTH}`}
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mx-1 my-1 inline-block align-middle" />
          <span className="inline-block align-middle">{prevDigimonLevel}</span>
        </Button>
      ),
    [prevDigimonLevel, nextDigimonLevel, isSelectable, isDigimonLevelSet, gotoDigimonLevel]
  );

  const nextDigimonLevelButton = React.useMemo(
    () =>
      !prevDigimonLevel &&
      nextDigimonLevel && (
        <Button
          outline
          color="gray"
          disabled={!isSelectable(nextDigimonLevel) && !isDigimonLevelSet([nextDigimonLevel])}
          onClick={() => gotoDigimonLevel(nextDigimonLevel)}
          className={`text-center items-center w-full md:w-${LIST_WIDTH}`}
        >
          <span className="inline-block align-middle">{nextDigimonLevel}</span>
          <FontAwesomeIcon icon={faArrowRight} className="mx-1 my-1 inline-block align-middle" />
        </Button>
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

  return (
    <div className="snap-start md:snap-none pt-4" id="digimonSelectionList">
      <Element name="digimonSelectionList" />
      <LevelSelectionButtonGroup
        nextDigimonLevel={nextDigimonLevel}
        prevDigimonLevel={prevDigimonLevel}
        isSelectable={isSelectable}
        gotoDigimonLevel={gotoDigimonLevel}
        isDigimonLevelSet={isDigimonLevelSet}
      />

      <div className={`text-center w-full md:w-${LIST_WIDTH} mt-2 h-8 mb-2`}>
        {selectableDigimons && (
          <h3 className="pb-2">
            {levelDisabled ? (
              <span className="underline">Can not select Digivolution in the middle of the line</span>
            ) : (
              <>Select {currentSelectionLevel} Level</>
            )}
          </h3>
        )}
      </div>

      <div className="flex items-center w-full max-w-sm mx-auto mt-2 h-12 mb-2">
        {selectableDigimons && !levelDisabled && (
          <form className="flex items-center w-full mx-auto">
            <label htmlFor="digimon-list-search" className="sr-only">
              Search
            </label>
            <div className={`relative w-full md:max-w-${LIST_WIDTH}`}>
              <TextInput
                type="search"
                id="digimon-list-search"
                className="block w-full ps-12 p-3"
                placeholder="Search"
                onChange={(e) => debouncedDigimonSearch(e.target.value)}
                disabled={levelDisabled || digimonList.length === 0}
              />
            </div>
          </form>
        )}
      </div>

      {digimonList.length === 0 && (
        <p className={`px-5 text-lg w-full md:max-w-${LIST_WIDTH} h-${LIST_HEIGHT - 24} md:h-${LIST_HEIGHT}`}>
          No Digimon to select
        </p>
      )}
      {digimonList.length > 0 && (
        <ul
          className={`text-sm w-full md:${LIST_WIDTH} h-${LIST_HEIGHT - 24} md:h-${LIST_HEIGHT} overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-600 divide-y divide-gray-200 dark:divide-gray-600`}
          style={{ height: '19rem' }}
        >
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
              <li key={digimon.id} className="first:rounded-t-lg last:rounded-b-lg overflow-hidden">
                <button
                  type="button"
                  disabled={levelDisabled}
                  onClick={() => selectDigimon(digimon.id)}
                  className={cn(
                    'flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors',
                    isActive
                      ? 'bg-gray-100 text-gray-900 dark:bg-gray-600 dark:text-white'
                      : 'text-gray-900 dark:text-white bg-white dark:bg-gray-800',
                    !isActive &&
                      !levelDisabled &&
                      'hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white',
                    levelDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
                    canon ? 'font-extrabold' : 'font-normal'
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">
                    {canon ? (
                      <strong className={cn(!freeMode || isInEvolveLine ? 'not-italic' : 'italic')}>
                        {digimon.name}
                      </strong>
                    ) : (
                      <span className={cn(!freeMode || isInEvolveLine ? 'not-italic' : 'italic')}>{digimon.name}</span>
                    )}
                  </span>

                  <span className="ml-auto inline-flex items-center gap-1">
                    {visibleBadges.map((badge) => {
                      const isAnimeBadge = badge === 'anime' && animeList;
                      const badgeElement = (
                        <Badge key={badge} size="xs" color={isAnimeBadge ? 'red' : 'gray'}>
                          {badge}
                        </Badge>
                      );

                      if (isAnimeBadge) {
                        return (
                          <Tooltip key={badge} content={animeList} placement="top" style="dark">
                            {badgeElement}
                          </Tooltip>
                        );
                      }

                      return badgeElement;
                    })}

                    {hiddenBadges.length > 0 && (
                      <Tooltip content={hiddenBadges.join(', ')} placement="top" style="dark">
                        <Badge size="xs" color="gray">
                          ...
                        </Badge>
                      </Tooltip>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
