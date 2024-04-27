'use client';

import { faArrowUp, faCopy } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Popover } from 'flowbite-react';
import { useSearchParams } from 'next/navigation';
import React from 'react';
import { useEffect } from 'react';
import { scroller } from 'react-scroll';
import { DigimonDB, DigimonData, DigimonLevel } from 'src/models/digimon';

import { DigimonInfoBox } from '@/components/molecules/digimon-info-box';
import { DigimonSelectionList } from '@/components/molecules/digimon-selection-list';
import { DigimonTimeline } from '@/components/organisms/digimon-timeline';

const HomePage = () => {
  const searchParams = useSearchParams();
  const [openCopyPopover, setOpenCopyPopover] = React.useState(false);

  const [db, setDB] = React.useState<DigimonDB | undefined>(undefined);
  const [digimons, setDigimons] = React.useState<Record<string, DigimonData> | undefined>(undefined);
  const [currentSelectionLevel, setCurrentSelectionLevel] = React.useState<DigimonLevel>('Child');

  const [baby1Id, setBaby1Id] = React.useState<string | undefined>(undefined);
  const [baby2Id, setBaby2Id] = React.useState<string | undefined>(undefined);
  const [childId, setChildId] = React.useState<string | undefined>(undefined);
  const [adultId, setAdultId] = React.useState<string | undefined>(undefined);
  const [perfectId, setPerfectId] = React.useState<string | undefined>(undefined);
  const [ultimateId, setUltimateId] = React.useState<string | undefined>(undefined);

  const baby1 = React.useMemo<DigimonData | undefined>(
    () => (baby1Id && digimons && baby1Id in digimons ? digimons[baby1Id] : undefined),
    [digimons, baby1Id]
  );
  const baby2 = React.useMemo<DigimonData | undefined>(
    () => (baby2Id && digimons && baby2Id in digimons ? digimons[baby2Id] : undefined),
    [digimons, baby2Id]
  );
  const child = React.useMemo<DigimonData | undefined>(
    () => (childId && digimons && childId in digimons ? digimons[childId] : undefined),
    [digimons, childId]
  );
  const adult = React.useMemo<DigimonData | undefined>(
    () => (adultId && digimons && adultId in digimons ? digimons[adultId] : undefined),
    [digimons, adultId]
  );
  const perfect = React.useMemo<DigimonData | undefined>(
    () => (perfectId && digimons && perfectId in digimons ? digimons[perfectId] : undefined),
    [digimons, perfectId]
  );
  const ultimate = React.useMemo<DigimonData | undefined>(
    () => (ultimateId && digimons && ultimateId in digimons ? digimons[ultimateId] : undefined),
    [digimons, ultimateId]
  );

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
        setBaby1Id(undefined);
        break;
      case 'Baby II':
        setBaby2Id(undefined);
        break;
      case 'Child':
        setChildId(undefined);
        break;
      case 'Adult':
        setAdultId(undefined);
        break;
      case 'Perfect':
        setPerfectId(undefined);
        break;
      case 'Ultimate':
        setUltimateId(undefined);
        break;
    }
  }, []);

  const clearAllDigimonLevels = React.useCallback(() => {
    setBaby1Id(undefined);
    setBaby2Id(undefined);
    setChildId(undefined);
    setAdultId(undefined);
    setPerfectId(undefined);
    setUltimateId(undefined);
  }, []);

  const selectDigimon = React.useCallback(
    (digimonId: string) => {
      switch (currentSelectionLevel) {
        case 'Baby I':
          setBaby1Id(digimonId);
          break;
        case 'Baby II': {
          setBaby2Id(digimonId);
          //if (digimon?.evolvesFrom.length === 1 && digimons) {
          //  setBaby1Id(newDigimon.evolvesFrom[0].id);
          //}
          break;
        }
        case 'Child':
          setChildId(digimonId);
          break;
        case 'Adult':
          setAdultId(digimonId);
          break;
        case 'Perfect':
          setPerfectId(digimonId);
          //if (newDigimon?.evolvesTo.length === 1 && digimons) {
          //  setUltimate(newDigimon.evolvesTo[0].id);
          //}
          break;
        case 'Ultimate':
          setUltimateId(digimonId);
          break;
      }
    },
    [currentSelectionLevel]
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

  const copyShareLink = React.useCallback(() => {
    const newQuery = (() => {
      const params = new URLSearchParams();
      if (baby1Id) {
        params.set('baby1', baby1Id);
      }
      if (baby2Id) {
        params.set('baby2', baby2Id);
      }
      if (childId) {
        params.set('child', childId);
      }
      if (adultId) {
        params.set('adult', adultId);
      }
      if (perfectId) {
        params.set('perfect', perfectId);
      }
      if (ultimateId) {
        params.set('ultimate', ultimateId);
      }

      return params.toString();
    })();
    setOpenCopyPopover(true);
    const link = window.location.origin + window.location.pathname + '?' + newQuery;

    navigator.clipboard.writeText(link);
    setTimeout(() => setOpenCopyPopover(false), 2000);
  }, [baby1Id, baby2Id, childId, adultId, perfectId, ultimateId]);

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

  useEffect(() => {
    if (searchParams) {
      setBaby1Id(
        digimons && searchParams.has('baby1') && searchParams.get('baby1') in digimons
          ? searchParams.get('baby1') || undefined
          : undefined
      );
      setBaby2Id(
        digimons && searchParams.has('baby2') && searchParams.get('baby2') in digimons
          ? searchParams.get('baby2') || undefined
          : undefined
      );
      setChildId(
        digimons && searchParams.has('child') && searchParams.get('child') in digimons
          ? searchParams.get('child') || undefined
          : undefined
      );
      setAdultId(
        digimons && searchParams.has('adult') && searchParams.get('adult') in digimons
          ? searchParams.get('adult') || undefined
          : undefined
      );
      setPerfectId(
        digimons && searchParams.has('perfect') && searchParams.get('perfect') in digimons
          ? searchParams.get('perfect') || undefined
          : undefined
      );
      setUltimateId(
        digimons && searchParams.has('ultimate') && searchParams.get('ultimate') in digimons
          ? searchParams.get('ultimate') || undefined
          : undefined
      );
    }
  }, [searchParams, digimons]);

  useEffect(() => {
    if (baby1 && isSelectable('Baby I')) {
      setCurrentSelectionLevel('Baby I');
    } else if (baby2 && isSelectable('Baby II')) {
      setCurrentSelectionLevel('Baby II');
    } else if (child && isSelectable('Child')) {
      setCurrentSelectionLevel('Child');
    } else if (adult && isSelectable('Adult')) {
      setCurrentSelectionLevel('Adult');
    } else if (perfect && isSelectable('Perfect')) {
      setCurrentSelectionLevel('Perfect');
    } else if (ultimate && isSelectable('Ultimate')) {
      setCurrentSelectionLevel('Ultimate');
    } else {
      setCurrentSelectionLevel('Child');
    }
  }, [searchParams, baby1, baby2, child, adult, perfect, ultimate, isSelectable, currentSelectionLevel]);

  const InfoBoxHeight = '36rem';

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
              <div className="px-2 md:px-1" style={{ minHeight: InfoBoxHeight }}>
                {currentDigimon && <DigimonInfoBox data={currentDigimon} height={InfoBoxHeight} />}
              </div>
            </div>
            <div className="order-first md:order-last px-4 md:px-2">
              <DigimonSelectionList
                selectableDigimons={selectableDigimons}
                isSelectable={isSelectable}
                currentSelectionLevel={currentSelectionLevel}
                selectDigimon={selectDigimon}
                currentDigimon={currentDigimon}
                gotoDigimonLevel={(level) => setCurrentSelectionLevel(level)}
                isDigimonLevelSet={isDigimonLevelSet}
              />
              <div className="w-full flex mx-2 mt-4 items-center">
                {selectedLevels.length > 0 && (
                  <Button color="failure" onClick={() => clearAllDigimonLevels()} className="items-center mx-1">
                    Rest All
                  </Button>
                )}
                {selectedLevels.length > 0 && (
                  <Popover
                    aria-labelledby="copy-share-link-popover"
                    open={openCopyPopover}
                    content={
                      <div className="flex w-32 flex-col gap-2 p-1 px-2 text-center text-sm bg-gray-200 dark:bg-gray-400">
                        Link Copied!
                      </div>
                    }
                  >
                    <Button color="success" onClick={() => copyShareLink()} className="items-center mx-1">
                      <FontAwesomeIcon icon={faCopy} className="mx-1 items-center align-center" />
                      Copy Share Link
                    </Button>
                  </Popover>
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
