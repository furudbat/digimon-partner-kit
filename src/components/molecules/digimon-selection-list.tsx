import { ListGroup } from 'flowbite-react';
import { DigimonData, DigimonLevel } from 'src/models/digimon';

import { cn } from '@/lib/utils';

export function DigimonSelectionList({
  selectableDigimons,
  isSelectable,
  currentSelectionLevel,
  selectDigimon,
  digimons,
  currentDigimon,
}: {
  selectableDigimons?: { id: string; name: string; canon?: boolean }[];
  isSelectable: (level: DigimonLevel) => boolean;
  currentSelectionLevel: DigimonLevel;
  selectDigimon: (digimon: DigimonData) => void;
  digimons?: Record<string, DigimonData>;
  currentDigimon?: DigimonData;
}) {
  return (
    <div className="dark:text-white">
      <div className="text-center">
        {selectableDigimons && isSelectable(currentSelectionLevel) && (
          <h3 className="pb-2">Select {currentSelectionLevel} Level</h3>
        )}
        {selectableDigimons && !isSelectable(currentSelectionLevel) && (
          <h3 className="pb-2 underline">Can not select Digivolution in the middle of the line</h3>
        )}
      </div>
      {selectableDigimons && selectableDigimons?.length === 0 && <p>No Digimon to select</p>}
      {selectableDigimons && selectableDigimons?.length > 0 && (
        <ListGroup className="text-sm w-full md:max-w-72 max-h-96 overflow-y-auto">
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
