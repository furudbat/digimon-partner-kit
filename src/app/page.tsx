'use client';

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

  const isSelectable = React.useCallback(
    (level: DigimonLevel): boolean => {
      switch (level) {
        case 'Baby I':
          return baby2 !== undefined;
        case 'Baby II':
          return child !== undefined && !baby1;
        case 'Child':
          return (!adult && !baby2) || (adult && !baby2) || (!child && !adult);
        case 'Adult':
          return (child && !perfect) || (!child && !perfect) || (!child && !adult);
        case 'Perfect':
          return adult !== undefined && !ultimate;
        case 'Ultimate':
          return perfect !== undefined;
      }

      return false;
    },
    [baby1, baby2, child, adult, perfect, ultimate]
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

  const selectableDigimons = React.useMemo<{ id: string; name: string }[] | undefined>(() => {
    switch (currentSelectionLevel) {
      case 'Baby I':
        return baby2?.evolvesFrom;
      case 'Baby II':
        return child?.evolvesFrom;
      case 'Child': {
        if (adult) {
          return adult.evolvesFrom;
        }

        return db?.lists.child;
      }
      case 'Adult': {
        if (child) {
          return child.evolvesTo;
        }

        return db?.lists.adult;
      }
      case 'Perfect':
        return adult?.evolvesTo;
      case 'Ultimate':
        return perfect?.evolvesTo;
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
              {currentDigimon && <DigimonInfoBox data={currentDigimon} />}
            </div>
            <DigimonSelectionList
              selectableDigimons={selectableDigimons}
              isSelectable={isSelectable}
              currentSelectionLevel={currentSelectionLevel}
              selectDigimon={selectDigimon}
              digimons={digimons}
              currentDigimon={currentDigimon}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
