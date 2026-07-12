'use client';

import { faArrowUp, faCopy } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Popover, Tooltip } from 'flowbite-react';
import { usePathname, useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import React, { Suspense } from 'react';
import { useEffect } from 'react';
import { useMediaQuery } from 'react-responsive';
import { scroller } from 'react-scroll';
import { Element } from 'react-scroll';
import { DigimonDB, DigimonData, DigimonLevel, DigimonListElement, DigimonDataEvolveElement } from 'src/models/digimon';

import { MediaQueryMobileBreakpoint } from '@/components/constants';
import { DigimonInfoBox } from '@/components/molecules/digimon-info-box';
import { DigimonSelectionList, SelectableDigimon } from '@/components/molecules/digimon-selection-list';
import { DigimonTimeline } from '@/components/organisms/digimon-timeline';

import { getRandomFromArray } from '@/lib/utils';
import ClientOnly from '@/components/atoms/client-only';

type DigimonSelection = {
  baby1Id?: string;
  baby2Id?: string;
  childId?: string;
  adultId?: string;
  perfectId?: string;
  ultimateId?: string;
  currentSelectionLevel: DigimonLevel;
};

// for backward compatible ids
const hrefToId = (href?: string) =>
  href
    ?.replace('/', '')
    .replaceAll(' ', '_')
    .replaceAll('+', '_')
    .replaceAll("'", '')
    .replaceAll('·', '_')
    .replace(':', '_')
    .replace('ä', 'ae')
    .replace('ö', 'oe')
    .replace('ü', 'ue')
    .replaceAll('(', '')
    .replaceAll(')', '')
    .replace('.', '_')
    .replaceAll('__', '_') ?? '';

// storage key map shared between effects
const STORAGE_KEYS: Record<string, string> = {
  baby1Id: 'baby1',
  baby2Id: 'baby2',
  childId: 'child',
  adultId: 'adult',
  perfectId: 'perfect',
  ultimateId: 'ultimate',
};
const PARAM_KEYS: Record<string, string> = {
  baby1Id: 'baby1',
  baby2Id: 'baby2',
  childId: 'child',
  adultId: 'adult',
  perfectId: 'perfect',
  ultimateId: 'ultimate',
};

const HomePageInner = () => {
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useMediaQuery({ maxWidth: MediaQueryMobileBreakpoint });

  const searchParams = useSearchParams();
  const [openCopyPopover, setOpenCopyPopover] = React.useState(false);
  const [freeMode, setFreeMode] = React.useState(false);
  const [printMode, setPrintMode] = React.useState(false);
  const printRef = React.useRef<HTMLDivElement | null>(null);

  const [db, setDB] = React.useState<DigimonDB | undefined>(undefined);
  const [digimons, setDigimons] = React.useState<Record<string, DigimonData> | undefined>(undefined);

  const [selection, setSelection] = React.useState<DigimonSelection>({
    currentSelectionLevel: 'Child',
  });

  const { baby1Id, baby2Id, childId, adultId, perfectId, ultimateId, currentSelectionLevel } = selection;

  const patchSelection = React.useCallback(
    (patch: Partial<DigimonSelection>) => setSelection((prev) => ({ ...prev, ...patch })),
    []
  );

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

  const selectedLevels = React.useMemo(
    () =>
      [baby1?.level, baby2?.level, child?.level, adult?.level, perfect?.level, ultimate?.level].filter(
        Boolean
      ) as DigimonLevel[],
    [baby1, baby2, child, adult, perfect, ultimate]
  );

  const isDigimonLevelSet = React.useCallback(
    (levels: DigimonLevel[]) => levels.every((a) => selectedLevels.some((b) => a === b)),
    [selectedLevels]
  );
  const isDigimonLevelNotSet = React.useCallback(
    (levels: DigimonLevel[]) => levels.every((a) => !selectedLevels.some((b) => a === b)),
    [selectedLevels]
  );

  const isSelectable = React.useCallback(
    (level: DigimonLevel): boolean => {
      if (selectedLevels.length === 0 || freeMode) {
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
    [freeMode, selectedLevels, isDigimonLevelSet, isDigimonLevelNotSet]
  );

  const selectDigimonLevel = React.useCallback(
    (level: DigimonLevel) => patchSelection({ currentSelectionLevel: level }),
    [patchSelection]
  );

  const clearDigimonLevel = React.useCallback(
    (level: DigimonLevel) => {
      const map: Record<DigimonLevel, keyof DigimonSelection> = {
        'Baby I': 'baby1Id',
        'Baby II': 'baby2Id',
        Child: 'childId',
        Adult: 'adultId',
        Perfect: 'perfectId',
        Ultimate: 'ultimateId',
      };
      patchSelection({ [map[level]]: undefined });
    },
    [patchSelection]
  );

  const clearAllDigimonLevels = React.useCallback(() => {
    setSelection((prev) => ({ currentSelectionLevel: prev.currentSelectionLevel }));
  }, []);

  const selectDigimon = React.useCallback(
    (digimonId: string) => {
      const keyMap: Record<DigimonLevel, keyof DigimonSelection> = {
        'Baby I': 'baby1Id',
        'Baby II': 'baby2Id',
        Child: 'childId',
        Adult: 'adultId',
        Perfect: 'perfectId',
        Ultimate: 'ultimateId',
      };
      patchSelection({ [keyMap[currentSelectionLevel]]: digimonId });
      // URL + localStorage are synced by the effect below
    },
    [currentSelectionLevel, patchSelection]
  );

  useEffect(() => {
    if (!digimons) return;

    const ids: Record<string, string | undefined> = {
      baby1Id,
      baby2Id,
      childId,
      adultId,
      perfectId,
      ultimateId,
    };

    const params = new URLSearchParams();

    for (const [stateKey, id] of Object.entries(ids)) {
      const paramKey = PARAM_KEYS[stateKey];
      const storageKey = STORAGE_KEYS[stateKey];
      if (id) {
        params.set(paramKey, id);
        localStorage.setItem(storageKey, id);
      } else {
        localStorage.removeItem(storageKey);
      }
    }

    const qs = params.toString();
    // use pathname from usePathname() — never window.location.pathname
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [digimons, baby1Id, baby2Id, childId, adultId, perfectId, ultimateId, router, pathname]);

  const selectableDigimons = React.useMemo<SelectableDigimon[] | undefined>(() => {
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

  const allSelectableDigimons = React.useMemo<DigimonListElement[] | undefined>(() => {
    switch (currentSelectionLevel) {
      case 'Baby I':
        return db?.lists.baby1;
      case 'Baby II':
        return db?.lists.baby2;
      case 'Child':
        return db?.lists.child;
      case 'Adult':
        return db?.lists.adult;
      case 'Perfect':
        return db?.lists.perfect;
      case 'Ultimate':
        return db?.lists.ultimate;
    }
    return undefined;
  }, [currentSelectionLevel, db]);

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
    const targets: [DigimonData | undefined, DigimonLevel, string][] = [
      [baby1, 'Baby I', 'digimonTimelineBabyI'],
      [baby2, 'Baby II', 'digimonTimelineBabyII'],
      [child, 'Child', 'digimonTimelineChild'],
      [adult, 'Adult', 'digimonTimelineAdult'],
      [perfect, 'Perfect', 'digimonTimelinePerfect'],
      [ultimate, 'Ultimate', 'digimonTimelineUltimate'],
    ];
    const target = targets.find(([mon, level]) => !mon && isSelectable(level));
    scroller.scrollTo(target?.[2] ?? 'digimonTimelineBabyI', { duration: 500, smooth: true });
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
    const link = window.location.origin + window.location.pathname + '?' + newQuery;

    navigator.clipboard.writeText(link);
    // alt:
    //navigator.clipboard.writeText(window.location.href);

    setOpenCopyPopover(true);
    setTimeout(() => setOpenCopyPopover(false), 2000);
  }, [baby1Id, baby2Id, childId, adultId, perfectId, ultimateId]);

  const randomize = React.useCallback(() => {
    const pick = (lst?: { id: string }[]) => {
      const id = getRandomFromArray(lst)?.id;
      return digimons && id ? digimons[id] : undefined;
    };
    const ch = pick(db?.lists.child);
    const b2 = pick(!freeMode ? ch?.evolvesFrom : db?.lists.baby2);
    const b1 = pick(!freeMode ? b2?.evolvesFrom : db?.lists.baby1);
    const ad = pick(!freeMode ? ch?.evolvesTo : db?.lists.adult);
    const pe = pick(!freeMode ? ad?.evolvesTo : db?.lists.perfect);
    const ul = pick(!freeMode ? pe?.evolvesTo : db?.lists.ultimate);
    setSelection((prev) => ({
      ...prev,
      baby1Id: b1?.id,
      baby2Id: b2?.id,
      childId: ch?.id,
      adultId: ad?.id,
      perfectId: pe?.id,
      ultimateId: ul?.id,
    }));
  }, [freeMode, digimons, db]);

  const searchParamsRef = React.useRef(searchParams);
  useEffect(() => {
    searchParamsRef.current = searchParams;
  });

  useEffect(() => {
    import('../db/digimon.db.json').then((data) => {
      const db = data.default as DigimonDB;
      setDB(db);
      const digimons: Record<string, DigimonData> = {};
      db.digimons.forEach((d) => {
        digimons[d.id] = d;
      });
      setDigimons(digimons);

      const sp = searchParamsRef.current;
      const resolve = (key: string): string | undefined => {
        const fromUrl = sp?.get(key);
        const normalized = fromUrl ? hrefToId(fromUrl) : undefined;
        if (normalized && normalized in digimons) return normalized;
        const fromStorage = localStorage.getItem(key);
        if (fromStorage && fromStorage in digimons) return fromStorage;
        return undefined;
      };

      const baby1Id = resolve('baby1');
      const baby2Id = resolve('baby2');
      const childId = resolve('child');
      const adultId = resolve('adult');
      const perfectId = resolve('perfect');
      const ultimateId = resolve('ultimate');

      const computeInitialLevel = (): DigimonLevel => {
        if (baby1Id) return 'Baby I';
        if (baby2Id) return 'Baby II';
        if (childId) return 'Child';
        if (adultId) return 'Adult';
        if (perfectId) return 'Perfect';
        if (ultimateId) return 'Ultimate';
        return 'Child';
      };

      setSelection({
        baby1Id,
        baby2Id,
        childId,
        adultId,
        perfectId,
        ultimateId,
        currentSelectionLevel: computeInitialLevel(),
      });
    });
  }, []);

  const InfoBoxHeight = '32rem';

  return (
    <div>
      <Element name="mainPage" />
      <div className="mx-auto my-2 px-2">
        <div className="flex items-center w-full">
          <div className="mx-auto place-self-center" id="digimonTimeLine" ref={printRef}>
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
              printMode={printMode}
            />
          </div>
        </div>
        <div className="container mx-auto max-w-screen-xl mt-4 md:mt-6" style={{ minHeight: '20rem' }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              {!currentSelectionLevel && !currentDigimon && (
                <h2 className="pb-2">Select the Level, then the Digimon</h2>
              )}
              <div className="px-2 md:px-1" style={{ minHeight: InfoBoxHeight }}>
                {currentDigimon && <DigimonInfoBox data={currentDigimon} height={InfoBoxHeight} />}
              </div>
            </div>
            <div className="order-first md:order-last px-4 md:px-2">
              <div className="mb-2" style={{ minHeight: '30rem' }}>
                <DigimonSelectionList
                  selectableDigimons={selectableDigimons}
                  allSelectableDigimons={allSelectableDigimons}
                  digimons={digimons}
                  isSelectable={isSelectable}
                  currentSelectionLevel={currentSelectionLevel}
                  selectDigimon={selectDigimon}
                  currentDigimon={currentDigimon}
                  gotoDigimonLevel={(level) => selectDigimonLevel(level)}
                  isDigimonLevelSet={isDigimonLevelSet}
                  freeMode={freeMode}
                />
              </div>
              <div className="w-full flex mx-2 mt-4 gap-4 items-center">
                <Tooltip content="Select any Digimon" placement="bottom">
                  <label className="inline-flex items-center cursor-pointer">
                    <input type="checkbox" onChange={(e) => setFreeMode(e.target.checked)} className="sr-only peer" />
                    <div className="relative w-11 h-6 rounded-full bg-gray-300 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 peer-checked:bg-purple-600 dark:peer-checked:bg-purple-500 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:border-gray-400 dark:after:border-gray-600 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full" />
                    <span className="ms-3 text-sm font-medium text-gray-700 dark:text-gray-400">Free mode</span>
                  </label>
                </Tooltip>
                <Tooltip content="Make Timeline Screenshot friendly" placement="bottom">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      onChange={(e) => setPrintMode(e.target.checked)}
                      className="sr-only peer"
                      checked={printMode}
                    />
                    <div className="relative w-11 h-6 rounded-full bg-gray-300 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:border-gray-400 dark:after:border-gray-600 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full" />
                    <span className="ms-3 text-sm font-medium text-gray-700 dark:text-gray-400">Print mode</span>
                  </label>
                </Tooltip>
              </div>
              <div className="w-full flex mx-2 mt-4 gap-4 items-center min-h-2">
                {selectedLevels.length > 0 && (
                  <Popover
                    aria-labelledby="copy-share-link-popover"
                    open={openCopyPopover}
                    content={<div className="flex w-32 flex-col gap-2 p-1 px-2 text-center text-sm">Link Copied!</div>}
                  >
                    <Button color="info" onClick={() => copyShareLink()} className="items-center mx-1">
                      <FontAwesomeIcon icon={faCopy} className="mx-1 items-center align-center" />
                      Copy Share Link
                    </Button>
                  </Popover>
                )}
              </div>
              <div className="w-full flex mx-2 mt-4 gap-4 items-center">
                <div className="w-full flex mt-2 items-center">
                  {selectedLevels.length > 0 && (
                    <Button color="red" onClick={() => clearAllDigimonLevels()} className="items-center mx-1">
                      Reset All
                    </Button>
                  )}
                </div>
                <div className="w-full flex mx-2 mt-2 items-center">
                  <Button color="purple" onClick={() => randomize()} className="items-center mx-1">
                    Randomize
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ClientOnly>
        {isMobile && (
          <div className="fixed h-32 w-32 z-90 bottom-0 right-0 p-12 m-2 items-center">
            <Button
              id="to-top-button"
              onClick={() => goToTop()}
              title="Go To Top"
              className="visible md:invisible items-center rounded-full w-16 h-16"
            >
              <FontAwesomeIcon icon={faArrowUp} size="2x" />
            </Button>
          </div>
        )}
      </ClientOnly>
    </div>
  );
};

const HomePage = () => (
  <Suspense fallback={null}>
    <HomePageInner />
  </Suspense>
);

export default HomePage;
