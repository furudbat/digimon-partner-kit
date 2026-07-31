'use client';

import { faArrowLeft, faArrowRight, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Badge, Button, TextInput, Tooltip } from 'flowbite-react';
import React, { useMemo } from 'react';
import { Element } from 'react-scroll';
import { DigimonData, DigimonDataEvolveElement, DigimonLevel, DigimonListElement } from 'src/models/digimon';
import { useDebouncedCallback } from 'use-debounce';
import { cn } from '@/lib/utils';
import { ListGroup, ListGroupItem } from 'flowbite-react';
import { DigimonListMaxHeight, DigimonListMaxHeightMd } from '@/components/constants';

const listGroupTheme = {
  base: 'list-none rounded-lg border border-gray-200 text-sm font-medium text-gray-900 dark:border-gray-600 dark:text-white',
};

const listGroupItemTheme = {
  base: 'items-center border-b border-gray-200 dark:border-gray-600',
  link: {
    base: 'flex w-full items-center',
    /*
    active: {
      off: 'bg-white text-gray-900 hover:bg-gray-100 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-600',
      on: 'bg-gray-100 text-gray-900 dark:bg-gray-600 dark:text-white',
    },
    */
    disabled: {
      off: '',
      on: 'cursor-not-allowed bg-gray-100 text-gray-900 opacity-50 dark:bg-gray-600 dark:text-gray-400',
    },
  },
};

const LIST_WIDTH = 86;

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
    <div id="digimonSelectionList">
      <Element name="digimonSelectionList" />
      <LevelSelectionButtonGroup
        nextDigimonLevel={nextDigimonLevel}
        prevDigimonLevel={prevDigimonLevel}
        isSelectable={isSelectable}
        gotoDigimonLevel={gotoDigimonLevel}
        isDigimonLevelSet={isDigimonLevelSet}
      />

      <div className={cn(['text-center', 'w-full', `md:w-${LIST_WIDTH}`, 'mt-2', 'h-8', 'mb-1'])}>
        {selectableDigimons && (
          <h3>
            {levelDisabled ? (
              <span className="underline"> Can not select Digivolution in the middle of the line</span>
            ) : (
              <>{selectionText1}</>
            )}
          </h3>
        )}
      </div>
      <div className={`text-center w-full md:w-${LIST_WIDTH} mt-1 h-8 mb-1`}>
        {selectableDigimons && (
          <h3>
            {levelDisabled ? (
              <em className="text-sm text-gray-600">{selectionText2}</em>
            ) : (
              <em className="text-sm text-gray-500">{selectionText2}</em>
            )}
          </h3>
        )}
      </div>

      <div className="items-center w-full max-w-sm mx-auto mt-1 mb-2">
        {selectableDigimons && (
          <form className="flex items-center w-full mx-auto">
            <label htmlFor="digimon-list-search" className="sr-only">
              Search
            </label>
            <div className={cn('relative', 'w-full', `md:max-w-${LIST_WIDTH}`)}>
              <TextInput
                type="search"
                id="digimon-list-search"
                className="block w-full ps-10 p-1 text-sm"
                placeholder="Search"
                onChange={(e) => debouncedDigimonSearch(e.target.value)}
                disabled={levelDisabled || digimonList.length === 0}
              />
            </div>
          </form>
        )}
      </div>

      <div className={cn(`overflow-y-auto`)}>
        <ListGroup theme={listGroupTheme} className="text-sm w-full border-0 rounded-none">
          {digimonList.length === 0 && <ListGroupItem theme={listGroupItemTheme}>No Digimon to select</ListGroupItem>}
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
              <ListGroupItem
                theme={listGroupItemTheme}
                className={cn('flex items-center gap-2', canon ? 'font-extrabold' : undefined)}
                key={digimon.id}
                onClick={() => selectDigimon(digimon.id)}
                active={digimon.id === currentDigimon?.id}
                disabled={!isSelectable(currentSelectionLevel)}
              >
                <span className="truncate flex-1 text-left">
                  {canon ? (
                    <strong className={cn(!freeMode || isInEvolveLine ? 'not-italic' : 'italic')}>
                      {digimon.name}
                    </strong>
                  ) : (
                    <span className={cn(!freeMode || isInEvolveLine ? 'not-italic' : 'italic')}>{digimon.name}</span>
                  )}
                </span>

                <span className="flex shrink-0 items-center gap-1">
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
              </ListGroupItem>
            );
          })}
        </ListGroup>
      </div>
    </div>
  );
}
