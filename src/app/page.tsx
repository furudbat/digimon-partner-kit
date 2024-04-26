'use client';

import { faArrowUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'flowbite-react';
import React from 'react';
import { useEffect } from 'react';
import { scroller } from 'react-scroll';
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

  const isDigimonLevelSet = React.useCallback(
    (levels: DigimonLevel[]): boolean => {
      return levels.every((a) => selectedLevels.some((b) => a === b));
    },
    [selectedLevels]
  );
  const isDigimonLevelNotSet = React.useCallback(
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
            isDigimonLevelNotSet(['Baby II', 'Child', 'Adult', 'Perfect', 'Ultimate']) ||
            (isDigimonLevelSet(['Baby I', 'Baby II']) &&
              isDigimonLevelNotSet(['Child', 'Adult', 'Perfect', 'Ultimate'])) ||
            (isDigimonLevelSet(['Baby II']) && isDigimonLevelNotSet(['Child', 'Adult', 'Perfect', 'Ultimate'])) ||
            (isDigimonLevelSet(['Baby II', 'Child', 'Adult']) && isDigimonLevelNotSet(['Perfect', 'Ultimate'])) ||
            (isDigimonLevelSet(['Baby II', 'Child', 'Adult', 'Perfect']) && isDigimonLevelNotSet(['Ultimate'])) ||
            (isDigimonLevelSet(['Baby II', 'Child', 'Adult', 'Perfect', 'Ultimate']) &&
              isDigimonLevelNotSet(['Baby I'])) ||
            isDigimonLevelSet(['Baby I', 'Baby II', 'Child', 'Adult', 'Perfect', 'Ultimate']) ||
            (isDigimonLevelSet(['Baby II', 'Child']) && isDigimonLevelNotSet(['Adult', 'Perfect', 'Ultimate'])) ||
            (isDigimonLevelSet(['Baby II', 'Child', 'Adult']) && isDigimonLevelNotSet(['Perfect', 'Ultimate'])) ||
            (isDigimonLevelSet(['Baby II', 'Child', 'Adult', 'Perfect']) && isDigimonLevelNotSet(['Ultimate']))
          );
        case 'Baby II':
          return (
            (isDigimonLevelSet(['Baby I']) && isDigimonLevelNotSet(['Child', 'Adult', 'Perfect', 'Ultimate'])) ||
            (isDigimonLevelSet(['Baby I', 'Baby II']) &&
              isDigimonLevelNotSet(['Child', 'Adult', 'Perfect', 'Ultimate'])) ||
            (isDigimonLevelNotSet(['Baby I']) && isDigimonLevelSet(['Child', 'Adult', 'Perfect', 'Ultimate'])) ||
            (isDigimonLevelNotSet(['Baby I']) && isDigimonLevelNotSet(['Child', 'Adult', 'Perfect', 'Ultimate'])) ||
            (isDigimonLevelSet(['Child']) &&
              isDigimonLevelNotSet(['Baby I', 'Baby II', 'Adult', 'Perfect', 'Ultimate'])) ||
            (isDigimonLevelSet(['Child', 'Adult']) && isDigimonLevelNotSet(['Baby I', 'Perfect', 'Ultimate'])) ||
            (isDigimonLevelNotSet(['Baby II']) && isDigimonLevelSet(['Child', 'Adult'])) ||
            (isDigimonLevelNotSet(['Baby I']) && isDigimonLevelSet(['Child', 'Adult'])) ||
            (isDigimonLevelNotSet(['Baby I']) && isDigimonLevelSet(['Child']))
          );
        case 'Child':
          return (
            (isDigimonLevelSet(['Baby I', 'Baby II']) && isDigimonLevelNotSet(['Adult', 'Perfect', 'Ultimate'])) ||
            (isDigimonLevelSet(['Baby I', 'Baby II', 'Child']) &&
              isDigimonLevelNotSet(['Adult', 'Perfect', 'Ultimate'])) ||
            (isDigimonLevelNotSet(['Baby I', 'Baby II']) && isDigimonLevelSet(['Adult', 'Perfect', 'Ultimate'])) ||
            (isDigimonLevelSet(['Child']) &&
              isDigimonLevelNotSet(['Baby I', 'Baby II', 'Adult', 'Perfect', 'Ultimate'])) ||
            (isDigimonLevelSet(['Adult']) &&
              isDigimonLevelNotSet(['Baby I', 'Baby II', 'Child', 'Perfect', 'Ultimate'])) ||
            (isDigimonLevelSet(['Adult']) && isDigimonLevelNotSet(['Baby I', 'Baby II', 'Perfect', 'Ultimate'])) ||
            (isDigimonLevelSet(['Baby II']) && isDigimonLevelNotSet(['Baby I', 'Adult', 'Perfect', 'Ultimate'])) ||
            (isDigimonLevelNotSet(['Child']) && isDigimonLevelSet(['Adult', 'Perfect'])) ||
            (isDigimonLevelNotSet(['Baby II']) && isDigimonLevelSet(['Adult', 'Perfect']))
          );
        case 'Adult':
          return (
            (isDigimonLevelSet(['Baby I', 'Baby II', 'Child']) && isDigimonLevelNotSet(['Perfect', 'Ultimate'])) ||
            (isDigimonLevelSet(['Baby I', 'Baby II', 'Child', 'Adult']) &&
              isDigimonLevelNotSet(['Perfect', 'Ultimate'])) ||
            (isDigimonLevelNotSet(['Baby I', 'Baby II', 'Child']) && isDigimonLevelSet(['Perfect', 'Ultimate'])) ||
            (isDigimonLevelNotSet(['Perfect', 'Ultimate']) && isDigimonLevelSet(['Child', 'Baby II'])) ||
            (isDigimonLevelNotSet(['Perfect', 'Ultimate']) && isDigimonLevelNotSet(['Child', 'Baby II', 'Baby I'])) ||
            (isDigimonLevelSet(['Child']) && isDigimonLevelNotSet(['Perfect', 'Ultimate'])) ||
            (isDigimonLevelSet(['Perfect']) && isDigimonLevelNotSet(['Adult', 'Ultimate'])) ||
            (isDigimonLevelSet(['Adult', 'Perfect']) && isDigimonLevelNotSet(['Child', 'Ultimate']))
          );
        case 'Perfect':
          return (
            (isDigimonLevelSet(['Baby I', 'Baby II', 'Child', 'Adult']) && isDigimonLevelNotSet(['Ultimate'])) ||
            (isDigimonLevelSet(['Baby I', 'Baby II', 'Child', 'Adult', 'Perfect']) &&
              isDigimonLevelNotSet(['Ultimate'])) ||
            (isDigimonLevelNotSet(['Baby I', 'Baby II', 'Child', 'Adult']) && isDigimonLevelSet(['Ultimate'])) ||
            (isDigimonLevelSet(['Perfect']) && isDigimonLevelNotSet(['Adult', 'Ultimate'])) ||
            (isDigimonLevelNotSet(['Baby I', 'Baby II', 'Child', 'Ultimate']) && isDigimonLevelSet(['Adult'])) ||
            (isDigimonLevelSet(['Child', 'Adult']) && isDigimonLevelNotSet(['Perfect', 'Ultimate'])) ||
            (isDigimonLevelSet(['Child', 'Adult', 'Perfect']) && isDigimonLevelNotSet(['Ultimate']))
          );
        case 'Ultimate':
          return (
            isDigimonLevelSet(['Baby I', 'Baby II', 'Child', 'Adult', 'Perfect']) ||
            isDigimonLevelNotSet(['Baby I', 'Baby II', 'Child', 'Adult', 'Perfect']) ||
            (isDigimonLevelNotSet(['Baby I', 'Baby II', 'Child', 'Adult']) && isDigimonLevelSet(['Perfect'])) ||
            (isDigimonLevelNotSet(['Baby I', 'Baby II', 'Child']) && isDigimonLevelSet(['Perfect'])) ||
            (isDigimonLevelNotSet(['Baby I', 'Baby II']) && isDigimonLevelSet(['Adult', 'Perfect'])) ||
            (isDigimonLevelNotSet(['Baby I', 'Baby II']) && isDigimonLevelSet(['Child', 'Adult', 'Perfect'])) ||
            (isDigimonLevelNotSet(['Baby I']) && isDigimonLevelSet(['Baby II', 'Child', 'Adult', 'Perfect']))
          );
      }

      return false;
    },
    [selectedLevels, isDigimonLevelSet, isDigimonLevelNotSet]
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
  }, [baby1, baby2, child, adult, perfect, ultimate, currentSelectionLevel, db]);

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

  const goToTop = React.useCallback(() => {
    if (!baby1 && isSelectable('Baby I')) {
      scroller.scrollTo('digimonTimelineBabyI', {
        duration: 500,
        smooth: true,
      });
    } else if (!baby2 && isSelectable('Baby II')) {
      scroller.scrollTo('digimonTimelineBabyII', {
        duration: 500,
        smooth: true,
      });
    } else if (!child && isSelectable('Child')) {
      scroller.scrollTo('digimonTimelineChild', {
        duration: 500,
        smooth: true,
      });
    } else if (!adult && isSelectable('Adult')) {
      scroller.scrollTo('digimonTimelineAdult', {
        duration: 500,
        smooth: true,
      });
    } else if (!perfect && isSelectable('Perfect')) {
      scroller.scrollTo('digimonTimelinePerfect', {
        duration: 500,
        smooth: true,
      });
    } else if (!ultimate && isSelectable('Ultimate')) {
      scroller.scrollTo('digimonTimelineUltimate', {
        duration: 500,
        smooth: true,
      });
    }

    scroller.scrollTo('digimonTimelineBabyI', {
      duration: 500,
      smooth: true,
    });
  }, [baby1, baby2, child, adult, perfect, ultimate, isSelectable]);

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
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              {!currentSelectionLevel && !currentDigimon && (
                <h2 className="pb-2">Select the Level, then the Digimon</h2>
              )}
              <div className="px-2 md:px-1" style={{ minHeight: infoBoxHeight }}>
                {currentDigimon && <DigimonInfoBox data={currentDigimon} height={infoBoxHeight} />}
              </div>
            </div>
            <div className="order-first md:order-last px-4 md:px-2">
              <DigimonSelectionList
                selectableDigimons={selectableDigimons}
                isSelectable={isSelectable}
                currentSelectionLevel={currentSelectionLevel}
                selectDigimon={selectDigimon}
                digimons={digimons}
                currentDigimon={currentDigimon}
                gotoDigimonLevel={(level) => setCurrentSelectionLevel(level)}
                isDigimonLevelSet={isDigimonLevelSet}
              />
              <div className="w-full px-4 mt-4 items-center md:items-end">
                {selectedLevels.length > 0 && (
                  <Button color="failure" onClick={() => clearAllDigimonLevels()}>
                    Rest All
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="relative h-32 w-32 z-90 bottom-0.5 right-0 p-4 m-20">
            <Button
              id="to-top-button"
              onClick={() => goToTop()}
              title="Go To Top"
              className="absolute visible md:invisible items-center rounded-full w-16 h-16"
            >
              <FontAwesomeIcon icon={faArrowUp} size="2x" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
