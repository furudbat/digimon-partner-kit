'use client';

import { DarkThemeToggle, ListGroup, Timeline } from 'flowbite-react';
import React from 'react';
import { useEffect } from 'react';
import { DigimonDB, DigimonData, DigimonLevel } from 'src/models/digimon';

import { DigimonInfoBox } from '@/components/molecules/digimon-info-box';
import { DigimonSelection } from '@/components/molecules/digimon-selection';

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
  }, [baby1, baby2, child, adult, perfect, ultimate, currentSelectionLevel, isSelectable]);

  useEffect(() => {
    import('../db/digimon.db.json').then((data) => {
      setDB(data.default);
      const digimons: Record<string, DigimonData> = {};
      data.default.digimons.forEach((digimon) => {
        digimons[digimon.id] = digimon;
      });
      setDigimons(digimons);
    });
  }, []);

  return (
    <div>
      <section className="dark:text-white">
        <div className="mx-auto grid max-w-screen-xl px-1 py-1 text-center lg:py-2 lg:pt-4">
          <div className="mx-auto place-self-center">
            <h1 className="mb-2 max-w-2xl font-extrabold leading-none tracking-tight">Digimon Partner Kit</h1>
            <p className="mb-1 max-w-2xl lg:mb-2">
              Build your own Digimon-Partner Digivolution line. <DarkThemeToggle />
              <br />
              <em>Select your Child or Adult Digimon first and then select the next/previous Levels.</em>
            </p>
          </div>
        </div>
      </section>
      <div className="mx-auto mt-2 px-2">
        <div className="flex items-center w-full">
          <div className="mx-auto place-self-center">
            <Timeline horizontal>
              <Timeline.Item>
                <div className="flex items-center dark:text-white">
                  <div className="z-10 flex items-center justify-center w-6 h-6 rounded-full ring-0 sm:ring-1 shrink-0">
                    I
                  </div>
                  <div className="hidden sm:flex w-full bg-gray-200 h-0.5 dark:bg-gray-700"></div>
                </div>
                <Timeline.Content>
                  <div className="px-3">
                    <DigimonSelection
                      title="Baby I"
                      data={baby1}
                      onClick={() => selectDigimonLevel('Baby I')}
                      onReset={() => clearDigimonLevel('Baby I')}
                      disabled={!isSelectable('Baby I')}
                      selected={currentSelectionLevel === 'Baby I'}
                    />
                  </div>
                </Timeline.Content>
              </Timeline.Item>
              <Timeline.Item>
                <div className="flex items-center dark:text-white">
                  <div className="z-10 flex items-center justify-center w-6 h-6 rounded-full ring-0 sm:ring-1 shrink-0">
                    II
                  </div>
                  <div className="hidden sm:flex w-full bg-gray-200 h-0.5 dark:bg-gray-700"></div>
                </div>
                <Timeline.Content>
                  <div className="px-3">
                    <DigimonSelection
                      title="Baby II"
                      data={baby2}
                      onClick={() => selectDigimonLevel('Baby II')}
                      onReset={() => clearDigimonLevel('Baby II')}
                      disabled={!isSelectable('Baby II')}
                      selected={currentSelectionLevel === 'Baby II'}
                    />
                  </div>
                </Timeline.Content>
              </Timeline.Item>
              <Timeline.Item>
                <div className="flex items-center dark:text-white">
                  <div className="z-10 flex items-center justify-center w-6 h-6 rounded-full ring-0 sm:ring-1 shrink-0">
                    III
                  </div>
                  <div className="hidden sm:flex w-full bg-gray-200 h-0.5 dark:bg-gray-700"></div>
                </div>
                <Timeline.Content>
                  <div className="px-3">
                    <DigimonSelection
                      title="Child"
                      data={child}
                      onClick={() => selectDigimonLevel('Child')}
                      onReset={() => clearDigimonLevel('Child')}
                      disabled={!isSelectable('Child')}
                      selected={currentSelectionLevel === 'Child'}
                    />
                  </div>
                </Timeline.Content>
              </Timeline.Item>
              <Timeline.Item>
                <div className="flex items-center dark:text-white">
                  <div className="z-10 flex items-center justify-center w-6 h-6 rounded-full ring-0 sm:ring-1 shrink-0">
                    IV
                  </div>
                  <div className="hidden sm:flex w-full bg-gray-200 h-0.5 dark:bg-gray-700"></div>
                </div>
                <Timeline.Content>
                  <div className="px-3">
                    <DigimonSelection
                      title="Adult"
                      data={adult}
                      onClick={() => selectDigimonLevel('Adult')}
                      onReset={() => clearDigimonLevel('Adult')}
                      disabled={!isSelectable('Adult')}
                      selected={currentSelectionLevel === 'Adult'}
                    />
                  </div>
                </Timeline.Content>
              </Timeline.Item>
              <Timeline.Item>
                <div className="flex items-center dark:text-white">
                  <div className="z-10 flex items-center justify-center w-6 h-6 rounded-full ring-0 sm:ring-1 shrink-0">
                    V
                  </div>
                  <div className="hidden sm:flex w-full bg-gray-200 h-0.5 dark:bg-gray-700"></div>
                </div>
                <Timeline.Content>
                  <div className="px-3">
                    <DigimonSelection
                      title="Perfect"
                      data={perfect}
                      onClick={() => selectDigimonLevel('Perfect')}
                      onReset={() => clearDigimonLevel('Perfect')}
                      disabled={!isSelectable('Perfect')}
                      selected={currentSelectionLevel === 'Perfect'}
                    />
                  </div>
                </Timeline.Content>
              </Timeline.Item>
              <Timeline.Item>
                <div className="flex items-center dark:text-white">
                  <div className="z-10 flex items-center justify-center w-6 h-6 rounded-full ring-0 sm:ring-1 shrink-0">
                    VI
                  </div>
                </div>
                <Timeline.Content>
                  <div className="px-3">
                    <DigimonSelection
                      title="Ultimate"
                      data={ultimate}
                      onClick={() => selectDigimonLevel('Ultimate')}
                      onReset={() => clearDigimonLevel('Ultimate')}
                      disabled={!isSelectable('Ultimate')}
                      selected={currentSelectionLevel === 'Ultimate'}
                    />
                  </div>
                </Timeline.Content>
              </Timeline.Item>
            </Timeline>
          </div>
        </div>
        <div className="container mx-auto max-w-screen-lg mt-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              {!currentSelectionLevel && !currentDigimon && (
                <h2 className="pb-2">Select the Level, then the Digimon</h2>
              )}
              {currentDigimon && <DigimonInfoBox data={currentDigimon} />}
            </div>
            <div className="dark:text-white">
              <div className="text-center">
                {selectableDigimons && isSelectable(currentSelectionLevel) && (
                  <h3 className="pb-2">Select {currentSelectionLevel} Level</h3>
                )}
                {selectableDigimons && !isSelectable(currentSelectionLevel) && (
                  <h3 className="pb-2 underline">Can not select Digivolution in the middle of the line</h3>
                )}
              </div>
              {selectableDigimons && selectableDigimons.length === 0 && <p>No Digimon to select</p>}
              {selectableDigimons && selectableDigimons.length > 0 && (
                <ListGroup className="text-sm w-50 max-h-96 overflow-y-auto">
                  {selectableDigimons.map((digimon) => {
                    return (
                      <ListGroup.Item
                        className="truncate"
                        key={digimon.id}
                        onClick={() => selectDigimon(digimon)}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
