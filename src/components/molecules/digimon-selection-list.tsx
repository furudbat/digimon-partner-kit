import { faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, ListGroup } from 'flowbite-react';
import React from 'react';
import { Element } from 'react-scroll';
import { DigimonData, DigimonLevel } from 'src/models/digimon';

import { cn } from '@/lib/utils';

export function DigimonSelectionList({
  selectableDigimons,
  isSelectable,
  currentSelectionLevel,
  gotoDigimonLevel,
  selectDigimon,
  digimons,
  currentDigimon,
  isDigimonLevelSet,
}: {
  selectableDigimons?: { id: string; name: string; canon?: boolean }[];
  isSelectable: (level: DigimonLevel) => boolean;
  currentSelectionLevel: DigimonLevel;
  gotoDigimonLevel: (level: DigimonLevel) => void;
  selectDigimon: (digimon: DigimonData) => void;
  digimons?: Record<string, DigimonData>;
  currentDigimon?: DigimonData;
  isDigimonLevelSet: (levels: DigimonLevel[]) => boolean;
}) {
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

  const LevelSelectionButtonGroup = ({
    prevDigimonLevel,
    nextDigimonLevel,
    isSelectable,
    gotoDigimonLevel,
  }: {
    prevDigimonLevel?: DigimonLevel;
    nextDigimonLevel?: DigimonLevel;
    isSelectable: (level: DigimonLevel) => boolean;
    gotoDigimonLevel: (level: DigimonLevel) => void;
  }) => {
    if (prevDigimonLevel && nextDigimonLevel) {
      return (
        <Button.Group outline className="w-full items-center">
          <Button
            color="gray"
            disabled={!isSelectable(prevDigimonLevel) && !isDigimonLevelSet([prevDigimonLevel])}
            onClick={() => gotoDigimonLevel(prevDigimonLevel)}
            className="text-center items-center w-full"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mx-1 my-1 inline-block align-middle" />
            <span className="inline-block align-middle">{prevDigimonLevel}</span>
          </Button>
          <Button
            color="gray"
            disabled={!isSelectable(nextDigimonLevel) && !isDigimonLevelSet([nextDigimonLevel])}
            onClick={() => gotoDigimonLevel(nextDigimonLevel)}
            className="text-center items-center w-full"
          >
            <span className="inline-block align-middle">{nextDigimonLevel}</span>
            <FontAwesomeIcon icon={faArrowRight} className="mx-1 my-1 inline-block align-middle" />
          </Button>
        </Button.Group>
      );
    }

    if (prevDigimonLevel) {
      return (
        <Button
          color="gray"
          disabled={!isSelectable(prevDigimonLevel)}
          onClick={() => gotoDigimonLevel(prevDigimonLevel)}
          className="text-center items-center w-full"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mx-1 my-1 inline-block align-middle" />
          <span className="inline-block align-middle">{prevDigimonLevel}</span>
        </Button>
      );
    }

    if (nextDigimonLevel) {
      return (
        <Button
          color="gray"
          disabled={!isSelectable(nextDigimonLevel)}
          onClick={() => gotoDigimonLevel(nextDigimonLevel)}
          className="text-center items-center w-full"
        >
          <span className="inline-block align-middle">{nextDigimonLevel}</span>
          <FontAwesomeIcon icon={faArrowRight} className="mx-1 my-1 inline-block align-middle" />
        </Button>
      );
    }

    return undefined;
  };

  return (
    <div className="dark:text-white snap-start md:snap-none" id="digimonSelectionList">
      <Element name="digimonSelectionList"></Element>
      <LevelSelectionButtonGroup
        nextDigimonLevel={nextDigimonLevel}
        prevDigimonLevel={prevDigimonLevel}
        isSelectable={isSelectable}
        gotoDigimonLevel={gotoDigimonLevel}
      />
      <div className="text-center mt-2">
        {selectableDigimons && isSelectable(currentSelectionLevel) && (
          <h3 className="pb-2">Select {currentSelectionLevel} Level</h3>
        )}
        {selectableDigimons && !isSelectable(currentSelectionLevel) && (
          <h3 className="pb-2 underline">Can not select Digivolution in the middle of the line</h3>
        )}
      </div>
      {selectableDigimons && selectableDigimons?.length === 0 && <p>No Digimon to select</p>}
      {selectableDigimons && selectableDigimons?.length > 0 && (
        <ListGroup className="text-sm w-full md:max-w-72 max-h-72 md:max-h-96 overflow-y-auto">
          {selectableDigimons.map((digimon) => {
            return (
              <ListGroup.Item
                className={cn('truncate', digimon.canon ? 'font-extrabold' : '')}
                key={digimon.id}
                onClick={() => digimons && selectDigimon(digimons[digimon.id])}
                active={digimon.id === currentDigimon?.id}
                disabled={!isSelectable(currentSelectionLevel)}
              >
                {digimon.name}
              </ListGroup.Item>
            );
          })}
        </ListGroup>
      )}
    </div>
  );
}
