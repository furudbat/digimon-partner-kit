'use client';

import { faArrowLeft, faArrowRight, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, ListGroup } from 'flowbite-react';
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
  if (prevDigimonLevel && nextDigimonLevel) {
    return (
      <div className="flex justify-center md:w-72">
        <div className="inline-flex" role="group">
          <Button
            outline
            color="gray"
            disabled={!isSelectable(prevDigimonLevel) && !isDigimonLevelSet([prevDigimonLevel])}
            onClick={() => gotoDigimonLevel(prevDigimonLevel)}
            className="align-start text-center items-center rounded-none rounded-l md:w-36"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mx-1 my-1 inline-block align-middle" />
            <span className="inline-block align-middle">{prevDigimonLevel}</span>
          </Button>
          <Button
            outline
            color="gray"
            disabled={!isSelectable(nextDigimonLevel) && !isDigimonLevelSet([nextDigimonLevel])}
            onClick={() => gotoDigimonLevel(nextDigimonLevel)}
            className="align-end text-center items-center rounded-none rounded-r md:w-36"
          >
            <span className="inline-block align-middle">{nextDigimonLevel}</span>
            <FontAwesomeIcon icon={faArrowRight} className="mx-1 my-1 inline-block align-middle" />
          </Button>
        </div>
      </div>
    );
  }

  if (prevDigimonLevel) {
    return (
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
    );
  }

  if (nextDigimonLevel) {
    return (
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
    );
  }

  return <></>;
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
  const debouncedDigimonSearch = useDebouncedCallback(
    (value) => {
      setDigimonSearch(value);
    },
    // delay in ms
    230
  );

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
    () => digimonList?.filter((digimon) => digimon.name.toLowerCase().includes(digimonSearch.toLowerCase())),
    [digimonList, digimonSearch]
  );

  return (
    <div className="dark:text-white snap-start md:snap-none" id="digimonSelectionList">
      <Element name="digimonSelectionList"></Element>
      <LevelSelectionButtonGroup
        nextDigimonLevel={nextDigimonLevel}
        prevDigimonLevel={prevDigimonLevel}
        isSelectable={isSelectable}
        gotoDigimonLevel={gotoDigimonLevel}
        isDigimonLevelSet={isDigimonLevelSet}
      />
      <div className="text-center mt-2">
        {selectableDigimons && isSelectable(currentSelectionLevel) && (
          <h3 className="pb-2">Select {currentSelectionLevel} Level</h3>
        )}
        {selectableDigimons && !isSelectable(currentSelectionLevel) && (
          <h3 className="pb-2 underline">Can not select Digivolution in the middle of the line</h3>
        )}
      </div>
      {selectableDigimons && isSelectable(currentSelectionLevel) && (
        <form className="flex items-center max-w-sm mx-auto mb-2">
          <label htmlFor="simple-search" className="sr-only">
            Search
          </label>
          <div className="relative w-full md:max-w-72">
            <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
              <FontAwesomeIcon icon={faMagnifyingGlass} />
            </div>
            <input
              type="search"
              id="digimon-list-search"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="Search"
              onChange={(e) => debouncedDigimonSearch(e.target.value)}
            />
          </div>
        </form>
      )}
      {digimonList.length === 0 && <p>No Digimon to select</p>}
      {digimonList.length > 0 && (
        <ListGroup className="text-sm w-full md:max-w-72 max-h-72 md:max-h-96 overflow-y-auto">
          {filteredSelectableDigimons.map((digimon) => {
            return (
              <ListGroup.Item
                className={cn('truncate', digimon.canon ? 'font-extrabold' : '')}
                key={digimon.id}
                onClick={() => selectDigimon(digimon.id)}
                active={digimon.id === currentDigimon?.id}
                disabled={!isSelectable(currentSelectionLevel)}
              >
                <span
                  className={
                    !freeMode || selectableDigimons?.some((sdigimon) => sdigimon.id === digimon.id)
                      ? 'not-italic'
                      : 'italic'
                  }
                >
                  {digimon.name}
                </span>
              </ListGroup.Item>
            );
          })}
        </ListGroup>
      )}
    </div>
  );
}
