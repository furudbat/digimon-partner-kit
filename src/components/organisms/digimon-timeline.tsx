import { Timeline } from 'flowbite-react';
import React from 'react';
import { useMediaQuery } from 'react-responsive';
import { scroller } from 'react-scroll';
import { Element } from 'react-scroll';
import { DigimonLevel, DigimonData } from 'src/models/digimon';

import { DigimonTimelineCard } from '../molecules/digimon-timeline-card';

export function DigimonTimeline({
  selectDigimonLevel,
  clearDigimonLevel,
  isSelectable,
  baby1,
  baby2,
  child,
  adult,
  perfect,
  ultimate,
  currentSelectionLevel,
  readonly,
}: {
  selectDigimonLevel: (level: DigimonLevel) => void;
  clearDigimonLevel: (level: DigimonLevel) => void;
  isSelectable: (level: DigimonLevel) => boolean;
  baby1?: DigimonData;
  baby2?: DigimonData;
  child?: DigimonData;
  adult?: DigimonData;
  perfect?: DigimonData;
  ultimate?: DigimonData;
  currentSelectionLevel: DigimonLevel;
  readonly?: boolean;
}) {
  const isMobile = useMediaQuery({ maxWidth: 768 });

  const onSelectCard = React.useCallback(
    (level: DigimonLevel) => {
      selectDigimonLevel(level);
      if (isMobile) {
        scroller.scrollTo('digimonSelectionList', {
          duration: 500,
          smooth: true,
        });
      }
    },
    [isMobile, selectDigimonLevel]
  );

  return (
    <Timeline horizontal>
      <Timeline.Item id="digimonTimelineBabyI">
        <Element name="digimonTimelineBabyI"></Element>
        <div className="flex items-center dark:text-white">
          <div className="z-10 flex items-center justify-center w-6 h-6 rounded-full ring-0 sm:ring-1 shrink-0">I</div>
          <div className="hidden sm:flex w-full bg-gray-200 h-0.5 dark:bg-gray-700"></div>
        </div>
        <Timeline.Content>
          <div className="px-3">
            <DigimonTimelineCard
              title="Baby I"
              data={baby1}
              onClick={() => onSelectCard('Baby I')}
              onReset={() => clearDigimonLevel('Baby I')}
              disabled={!isSelectable('Baby I')}
              selected={currentSelectionLevel === 'Baby I'}
              readonly={readonly}
            />
          </div>
        </Timeline.Content>
      </Timeline.Item>
      <Timeline.Item id="digimonTimelineBabyII">
        <Element name="digimonTimelineBabyII"></Element>
        <div className="flex items-center dark:text-white">
          <div className="z-10 flex items-center justify-center w-6 h-6 rounded-full ring-0 sm:ring-1 shrink-0">II</div>
          <div className="hidden sm:flex w-full bg-gray-200 h-0.5 dark:bg-gray-700"></div>
        </div>
        <Timeline.Content>
          <div className="px-3">
            <DigimonTimelineCard
              title="Baby II"
              data={baby2}
              onClick={() => onSelectCard('Baby II')}
              onReset={() => clearDigimonLevel('Baby II')}
              disabled={!isSelectable('Baby II')}
              selected={currentSelectionLevel === 'Baby II'}
              readonly={readonly}
            />
          </div>
        </Timeline.Content>
      </Timeline.Item>
      <Timeline.Item id="digimonTimelineChild">
        <Element name="digimonTimelineChild"></Element>
        <div className="flex items-center dark:text-white">
          <div className="z-10 flex items-center justify-center w-6 h-6 rounded-full ring-0 sm:ring-1 shrink-0">
            III
          </div>
          <div className="hidden sm:flex w-full bg-gray-200 h-0.5 dark:bg-gray-700"></div>
        </div>
        <Timeline.Content>
          <div className="px-3">
            <DigimonTimelineCard
              title="Child"
              data={child}
              onClick={() => onSelectCard('Child')}
              onReset={() => clearDigimonLevel('Child')}
              disabled={!isSelectable('Child')}
              selected={currentSelectionLevel === 'Child'}
              readonly={readonly}
            />
          </div>
        </Timeline.Content>
      </Timeline.Item>
      <Timeline.Item id="digimonTimelineAdult">
        <Element name="digimonTimelineAdult"></Element>
        <div className="flex items-center dark:text-white">
          <div className="z-10 flex items-center justify-center w-6 h-6 rounded-full ring-0 sm:ring-1 shrink-0">IV</div>
          <div className="hidden sm:flex w-full bg-gray-200 h-0.5 dark:bg-gray-700"></div>
        </div>
        <Timeline.Content>
          <div className="px-3">
            <DigimonTimelineCard
              title="Adult"
              data={adult}
              onClick={() => onSelectCard('Adult')}
              onReset={() => clearDigimonLevel('Adult')}
              disabled={!isSelectable('Adult')}
              selected={currentSelectionLevel === 'Adult'}
              readonly={readonly}
            />
          </div>
        </Timeline.Content>
      </Timeline.Item>
      <Timeline.Item id="digimonTimelinePerfect">
        <Element name="digimonTimelinePerfect"></Element>
        <div className="flex items-center dark:text-white">
          <div className="z-10 flex items-center justify-center w-6 h-6 rounded-full ring-0 sm:ring-1 shrink-0">V</div>
          <div className="hidden sm:flex w-full bg-gray-200 h-0.5 dark:bg-gray-700"></div>
        </div>
        <Timeline.Content>
          <div className="px-3">
            <DigimonTimelineCard
              title="Perfect"
              data={perfect}
              onClick={() => onSelectCard('Perfect')}
              onReset={() => clearDigimonLevel('Perfect')}
              disabled={!isSelectable('Perfect')}
              selected={currentSelectionLevel === 'Perfect'}
              readonly={readonly}
            />
          </div>
        </Timeline.Content>
      </Timeline.Item>
      <Timeline.Item id="digimonTimelineUltimate">
        <Element name="digimonTimelineUltimate"></Element>
        <div className="flex items-center dark:text-white">
          <div className="z-10 flex items-center justify-center w-6 h-6 rounded-full ring-0 sm:ring-1 shrink-0">VI</div>
        </div>
        <Timeline.Content>
          <div className="px-3">
            <DigimonTimelineCard
              title="Ultimate"
              data={ultimate}
              onClick={() => onSelectCard('Ultimate')}
              onReset={() => clearDigimonLevel('Ultimate')}
              disabled={!isSelectable('Ultimate')}
              selected={currentSelectionLevel === 'Ultimate'}
              readonly={readonly}
            />
          </div>
        </Timeline.Content>
      </Timeline.Item>
    </Timeline>
  );
}
