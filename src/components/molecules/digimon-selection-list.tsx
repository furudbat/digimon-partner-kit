'use client';

import { faArrowLeft, faArrowRight, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, TextInput } from 'flowbite-react';
import React from 'react';
import { Element } from 'react-scroll';
import { DigimonData, DigimonLevel } from 'src/models/digimon';
import { useDebouncedCallback } from 'use-debounce';
import { cn } from '@/lib/utils';

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
        <div className="flex justify-center w-full md:w-72">
          <div className="grow inline-flex" role="group">
            <Button
              outline
              color="gray"
              disabled={!isSelectable(prevDigimonLevel) && !isDigimonLevelSet([prevDigimonLevel])}
              onClick={() => gotoDigimonLevel(prevDigimonLevel)}
              className="align-start text-center items-center rounded-none rounded-l w-2/4 md:w-36"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="mx-1 my-1 inline-block align-middle" />
              <span className="inline-block align-middle">{prevDigimonLevel}</span>
            </Button>
            <Button
              outline
              color="gray"
              disabled={!isSelectable(nextDigimonLevel) && !isDigimonLevelSet([nextDigimonLevel])}
              onClick={() => gotoDigimonLevel(nextDigimonLevel)}
              className="align-end text-center items-center rounded-none rounded-r w-2/4 md:w-36"
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
          className="text-center items-center w-full md:w-72"
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
          className="text-center items-center w-full md:w-72"
        >
          <span className="inline-block align-middle">{nextDigimonLevel}</span>
          <FontAwesomeIcon icon={faArrowRight} className="mx-1 my-1 inline-block align-middle" />
        </Button>
      ),
    [prevDigimonLevel, nextDigimonLevel, isSelectable, isDigimonLevelSet, gotoDigimonLevel]
  );

  return buttonGroup || prevDigimonLevelButton || nextDigimonLevelButton;
}

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
}: {
  selectableDigimons?: { id: string; name: string; canon?: boolean }[];
  allSelectableDigimons?: { id: string; name: string; canon?: boolean }[];
  isSelectable: (level: DigimonLevel) => boolean;
  currentSelectionLevel: DigimonLevel;
  gotoDigimonLevel: (level: DigimonLevel) => void;
  selectDigimon: (digimonId: string) => void;
  currentDigimon?: DigimonData;
  isDigimonLevelSet: (levels: DigimonLevel[]) => boolean;
  freeMode?: boolean;
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
    (digimonId: string) => selectableDigimons?.find((s) => s.id === digimonId)?.canon,
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

      <div className="text-center mt-2 w-full md:w-72 h-8">
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

      {selectableDigimons && !levelDisabled && (
        <form className="flex items-center max-w-sm mx-auto mb-2">
          <label htmlFor="digimon-list-search" className="sr-only">
            Search
          </label>
          <div className="relative w-full md:max-w-72">
            <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
              <FontAwesomeIcon icon={faMagnifyingGlass} />
            </div>
            <TextInput
              type="search"
              id="digimon-list-search"
              className="block w-full ps-10 p-2.5"
              placeholder="Search"
              onChange={(e) => debouncedDigimonSearch(e.target.value)}
            />
          </div>
        </form>
      )}

      {digimonList.length === 0 && <p>No Digimon to select</p>}
      {digimonList.length > 0 && (
        <ul className="text-sm w-full md:max-w-72 max-h-72 md:max-h-96 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-600 divide-y divide-gray-200 dark:divide-gray-600">
          {filteredSelectableDigimons.map((digimon) => {
            const canon = isEvolCanon(digimon.id);
            const isActive = digimon.id === currentDigimon?.id;
            const isInEvolveLine = selectableDigimons?.some((s) => s.id === digimon.id);

            return (
              <li key={digimon.id} className="first:rounded-t-lg last:rounded-b-lg overflow-hidden">
                <button
                  type="button"
                  disabled={levelDisabled}
                  onClick={() => selectDigimon(digimon.id)}
                  className={cn(
                    'flex w-full items-center px-4 py-2 text-left text-sm transition-colors',
                    isActive
                      ? 'bg-gray-100 text-gray-900 dark:bg-gray-600 dark:text-white'
                      : 'text-gray-900 dark:text-white bg-white dark:bg-gray-800',
                    !isActive &&
                      !levelDisabled &&
                      'hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white',
                    levelDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
                    canon ? 'font-extrabold' : 'font-normal',
                    'truncate'
                  )}
                >
                  {canon ? (
                    <strong className={cn('truncate', !freeMode || isInEvolveLine ? 'not-italic' : 'italic')}>
                      {digimon.name}
                    </strong>
                  ) : (
                    <span className={cn('truncate', !freeMode || isInEvolveLine ? 'not-italic' : 'italic')}>
                      {digimon.name}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
