'use client';

import { Button } from 'flowbite-react';
import React from 'react';
import { useEffect } from 'react';
import { DigimonDB, DigimonData, DigimonLevel } from 'src/models/digimon';

import { DigimonInfoBox } from '@/components/molecules/digimon-info-box';
import { DigimonSelectionList } from '@/components/molecules/digimon-selection-list';
import { DigimonTimeline } from '@/components/organisms/digimon-timeline';

const HomePage = () => {
  const [db, setDB] = React.useState<DigimonDB | undefined>(undefined);
  const [digimons, setDigimons] = React.useState<Record<string, DigimonData> | undefined>(undefined);
  const [currentSelectionLevel, setCurrentSelectionLevel] = React.useState<DigimonLevel>('Child');

  const [baby1, setBaby1] = React.useState<DigimonData | undefined>(undefined);
  const [baby2, setBaby2] = React.useState<DigimonData | undefined>(undefined);
  const [child, setChild] = React.useState<DigimonData | undefined>(undefined);
  const [adult, setAdult] = React.useState<DigimonData | undefined>(undefined);
  const [perfect, setPerfect] = React.useState<DigimonData | undefined>(undefined);
  const [ultimate, setUltimate] = React.useState<DigimonData | undefined>(undefined);

  const selectedLevels = React.useMemo(() => {
    return [baby1?.level, baby2?.level, child?.level, adult?.level, perfect?.level, ultimate?.level].filter(
      (d) => d
    ) as DigimonLevel[];
  }, [baby1, baby2, child, adult, perfect, ultimate]);

  const isSelected = React.useCallback(
    (levels: DigimonLevel[]): boolean => {
      return levels.every((a) => selectedLevels.some((b) => a === b));
    },
    [selectedLevels]
  );
  const isNotSelected = React.useCallback(
    (levels: DigimonLevel[]): boolean => {
      return levels.every((a) => !selectedLevels.some((b) => a === b));
    },
    [selectedLevels]
  );

  const isSelectable = React.useCallback(
    (level: DigimonLevel): boolean => {
      if (selectedLevels.length === 0) {
        return true;
      }

      /// @TODO: optimize boolean algebra
      switch (level) {
        case 'Baby I':
          return (
            isNotSelected(['Baby II', 'Child', 'Adult', 'Perfect', 'Ultimate']) ||
            (isSelected(['Baby I', 'Baby II']) && isNotSelected(['Child', 'Adult', 'Perfect', 'Ultimate'])) ||
            (isSelected(['Baby II']) && isNotSelected(['Child', 'Adult', 'Perfect', 'Ultimate'])) ||
            (isSelected(['Baby II', 'Child', 'Adult']) && isNotSelected(['Perfect', 'Ultimate'])) ||
            (isSelected(['Baby II', 'Child', 'Adult', 'Perfect']) && isNotSelected(['Ultimate'])) ||
            (isSelected(['Baby II', 'Child', 'Adult', 'Perfect', 'Ultimate']) && isNotSelected(['Baby I'])) ||
            isSelected(['Baby I', 'Baby II', 'Child', 'Adult', 'Perfect', 'Ultimate']) ||
            (isSelected(['Baby II', 'Child']) && isNotSelected(['Adult', 'Perfect', 'Ultimate'])) ||
            (isSelected(['Baby II', 'Child', 'Adult']) && isNotSelected(['Perfect', 'Ultimate'])) ||
            (isSelected(['Baby II', 'Child', 'Adult', 'Perfect']) && isNotSelected(['Ultimate']))
          );
        case 'Baby II':
          return (
            (isSelected(['Baby I']) && isNotSelected(['Child', 'Adult', 'Perfect', 'Ultimate'])) ||
            (isSelected(['Baby I', 'Baby II']) && isNotSelected(['Child', 'Adult', 'Perfect', 'Ultimate'])) ||
            (isNotSelected(['Baby I']) && isSelected(['Child', 'Adult', 'Perfect', 'Ultimate'])) ||
            (isNotSelected(['Baby I']) && isNotSelected(['Child', 'Adult', 'Perfect', 'Ultimate'])) ||
            (isSelected(['Child']) && isNotSelected(['Baby I', 'Baby II', 'Adult', 'Perfect', 'Ultimate'])) ||
            (isSelected(['Child', 'Adult']) && isNotSelected(['Baby I', 'Perfect', 'Ultimate'])) ||
            (isNotSelected(['Baby II']) && isSelected(['Child', 'Adult'])) ||
            (isNotSelected(['Baby I']) && isSelected(['Child', 'Adult'])) ||
            (isNotSelected(['Baby I']) && isSelected(['Child']))
          );
        case 'Child':
          return (
            (isSelected(['Baby I', 'Baby II']) && isNotSelected(['Adult', 'Perfect', 'Ultimate'])) ||
            (isSelected(['Baby I', 'Baby II', 'Child']) && isNotSelected(['Adult', 'Perfect', 'Ultimate'])) ||
            (isNotSelected(['Baby I', 'Baby II']) && isSelected(['Adult', 'Perfect', 'Ultimate'])) ||
            (isSelected(['Child']) && isNotSelected(['Baby I', 'Baby II', 'Adult', 'Perfect', 'Ultimate'])) ||
            (isSelected(['Adult']) && isNotSelected(['Baby I', 'Baby II', 'Child', 'Perfect', 'Ultimate'])) ||
            (isSelected(['Adult']) && isNotSelected(['Baby I', 'Baby II', 'Perfect', 'Ultimate'])) ||
            (isSelected(['Baby II']) && isNotSelected(['Baby I', 'Adult', 'Perfect', 'Ultimate'])) ||
            (isNotSelected(['Child']) && isSelected(['Adult', 'Perfect'])) ||
            (isNotSelected(['Baby II']) && isSelected(['Adult', 'Perfect']))
          );
        case 'Adult':
          return (
            (isSelected(['Baby I', 'Baby II', 'Child']) && isNotSelected(['Perfect', 'Ultimate'])) ||
            (isSelected(['Baby I', 'Baby II', 'Child', 'Adult']) && isNotSelected(['Perfect', 'Ultimate'])) ||
            (isNotSelected(['Baby I', 'Baby II', 'Child']) && isSelected(['Perfect', 'Ultimate'])) ||
            (isNotSelected(['Perfect', 'Ultimate']) && isSelected(['Child', 'Baby II'])) ||
            (isNotSelected(['Perfect', 'Ultimate']) && isNotSelected(['Child', 'Baby II', 'Baby I'])) ||
            (isSelected(['Child']) && isNotSelected(['Perfect', 'Ultimate'])) ||
            (isSelected(['Perfect']) && isNotSelected(['Adult', 'Ultimate'])) ||
            (isSelected(['Adult', 'Perfect']) && isNotSelected(['Child', 'Ultimate']))
          );
        case 'Perfect':
          return (
            (isSelected(['Baby I', 'Baby II', 'Child', 'Adult']) && isNotSelected(['Ultimate'])) ||
            (isSelected(['Baby I', 'Baby II', 'Child', 'Adult', 'Perfect']) && isNotSelected(['Ultimate'])) ||
            (isNotSelected(['Baby I', 'Baby II', 'Child', 'Adult']) && isSelected(['Ultimate'])) ||
            (isSelected(['Perfect']) && isNotSelected(['Adult', 'Ultimate'])) ||
            (isNotSelected(['Baby I', 'Baby II', 'Child', 'Ultimate']) && isSelected(['Adult'])) ||
            (isSelected(['Child', 'Adult']) && isNotSelected(['Perfect', 'Ultimate'])) ||
            (isSelected(['Child', 'Adult', 'Perfect']) && isNotSelected(['Ultimate']))
          );
        case 'Ultimate':
          return (
            isSelected(['Baby I', 'Baby II', 'Child', 'Adult', 'Perfect']) ||
            isNotSelected(['Baby I', 'Baby II', 'Child', 'Adult', 'Perfect']) ||
            (isNotSelected(['Baby I', 'Baby II', 'Child', 'Adult']) && isSelected(['Perfect'])) ||
            (isNotSelected(['Baby I', 'Baby II', 'Child']) && isSelected(['Perfect'])) ||
            (isNotSelected(['Baby I', 'Baby II']) && isSelected(['Adult', 'Perfect'])) ||
            (isNotSelected(['Baby I', 'Baby II']) && isSelected(['Child', 'Adult', 'Perfect'])) ||
            (isNotSelected(['Baby I']) && isSelected(['Baby II', 'Child', 'Adult', 'Perfect']))
          );
      }

      return false;
    },
    [baby1, baby2, child, adult, perfect, ultimate, selectedLevels, isSelected]
  );

  const selectDigimonLevel = React.useCallback((level: DigimonLevel) => {
    setCurrentSelectionLevel(level);
  }, []);

  const clearDigimonLevel = React.useCallback((level: DigimonLevel) => {
    switch (level) {
      case 'Baby I':
        setBaby1(undefined);
        break;
      case 'Baby II':
        setBaby2(undefined);
        break;
      case 'Child':
        setChild(undefined);
        break;
      case 'Adult':
        setAdult(undefined);
        break;
      case 'Perfect':
        setPerfect(undefined);
        break;
      case 'Ultimate':
        setUltimate(undefined);
        break;
    }
  }, []);

  const clearAllDigimonLevels = React.useCallback(() => {
    setBaby1(undefined);
    setBaby2(undefined);
    setChild(undefined);
    setAdult(undefined);
    setPerfect(undefined);
    setUltimate(undefined);
  }, []);

  const selectDigimon = React.useCallback(
    (digimon: DigimonData) => {
      const newDigimon = digimons ? digimons[digimon.id] : undefined;
      switch (currentSelectionLevel) {
        case 'Baby I':
          setBaby1(newDigimon);
          break;
        case 'Baby II': {
          setBaby2(newDigimon);
          //if (newDigimon?.evolvesFrom.length === 1 && digimons) {
          //  setBaby1(digimons[newDigimon.evolvesFrom[0].id]);
          //}
          break;
        }
        case 'Child':
          setChild(newDigimon);
          break;
        case 'Adult':
          setAdult(newDigimon);
          break;
        case 'Perfect':
          setPerfect(newDigimon);
          //if (newDigimon?.evolvesTo.length === 1 && digimons) {
          //  setUltimate(digimons[newDigimon.evolvesTo[0].id]);
          //}
          break;
        case 'Ultimate':
          setUltimate(newDigimon);
          break;
      }
    },
    [currentSelectionLevel, digimons]
  );

  const selectableDigimons = React.useMemo<{ id: string; name: string; canon?: boolean }[] | undefined>(() => {
    switch (currentSelectionLevel) {
      case 'Baby I':
        return baby2?.evolvesFrom ?? db?.lists.baby1;
      case 'Baby II':
        return baby1?.evolvesTo ?? child?.evolvesFrom ?? db?.lists.baby2;
      case 'Child':
        return baby2?.evolvesTo ?? adult?.evolvesFrom ?? db?.lists.child;
      case 'Adult':
        return child?.evolvesTo ?? perfect?.evolvesFrom ?? db?.lists.adult;
      case 'Perfect':
        return adult?.evolvesTo ?? ultimate?.evolvesFrom ?? db?.lists.perfect;
      case 'Ultimate':
        return perfect?.evolvesTo ?? db?.lists.ultimate;
    }

    return undefined;
  }, [baby2, child, adult, perfect, currentSelectionLevel, db]);

  const currentDigimon = React.useMemo<DigimonData | undefined>(() => {
    switch (currentSelectionLevel) {
      case 'Baby I':
        return baby1;
      case 'Baby II':
        return baby2;
      case 'Child':
        return child;
      case 'Adult':
        return adult;
      case 'Perfect':
        return perfect;
      case 'Ultimate':
        return ultimate;
    }

    return undefined;
  }, [baby1, baby2, child, adult, perfect, ultimate, currentSelectionLevel]);

  useEffect(() => {
    import('../db/digimon.db.json').then((data) => {
      const db = data.default as DigimonDB;
      setDB(db);
      const digimons: Record<string, DigimonData> = {};
      db.digimons.forEach((digimon) => {
        digimons[digimon.id] = digimon;
      });
      setDigimons(digimons);
    });
  }, []);

  const infoBoxHeight = '36rem';

  return (
    <div>
      <div className="mx-auto my-2 px-2">
        <div className="flex items-center w-full">
          <div className="mx-auto place-self-center">
            <DigimonTimeline
              selectDigimonLevel={selectDigimonLevel}
              clearDigimonLevel={clearDigimonLevel}
              isSelectable={isSelectable}
              baby1={baby1}
              baby2={baby2}
              child={child}
              adult={adult}
              perfect={perfect}
              ultimate={ultimate}
              currentSelectionLevel={currentSelectionLevel}
            />
          </div>
        </div>
        <div className="container mx-auto max-w-screen-lg mt-6" style={{ minHeight: '28rem' }}>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              {!currentSelectionLevel && !currentDigimon && (
                <h2 className="pb-2">Select the Level, then the Digimon</h2>
              )}
              <div style={{ minHeight: infoBoxHeight }}>
                {currentDigimon && <DigimonInfoBox data={currentDigimon} height={infoBoxHeight} />}
              </div>
            </div>
            <DigimonSelectionList
              selectableDigimons={selectableDigimons}
              isSelectable={isSelectable}
              currentSelectionLevel={currentSelectionLevel}
              selectDigimon={selectDigimon}
              digimons={digimons}
              currentDigimon={currentDigimon}
            />
            <div className="w-full- px-4 items-end">
              {selectedLevels.length > 0 && (
                <Button color="failure" onClick={() => clearAllDigimonLevels()}>
                  Rest All
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
