import { ListGroup } from 'flowbite-react';
import { DigimonData, DigimonLevel } from 'src/models/digimon';

export function DigimonSelectionList({
  selectableDigimons,
  isSelectable,
  currentSelectionLevel,
  selectDigimon,
  digimons,
  currentDigimon,
}: {
  selectableDigimons?: { id: string; name: string }[];
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
        <ListGroup className="text-sm w-50 max-h-96 overflow-y-auto">
          {selectableDigimons.map((digimon) => {
            return (
              <ListGroup.Item
                className="truncate"
                key={digimon.id}
                onClick={() => selectDigimon(digimons[digimon.id])}
                active={digimon.id === currentDigimon?.id}
                disabled={!isSelectable}
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
