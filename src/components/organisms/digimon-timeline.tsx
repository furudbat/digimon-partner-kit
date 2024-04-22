import { Timeline } from 'flowbite-react';
import { DigimonLevel, DigimonData } from 'src/models/digimon';

import { DigimonSelection } from '../molecules/digimon-selection';

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
}) {
  return (
    <Timeline horizontal>
      <Timeline.Item>
        <div className="flex items-center dark:text-white">
          <div className="z-10 flex items-center justify-center w-6 h-6 rounded-full ring-0 sm:ring-1 shrink-0">I</div>
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
          <div className="z-10 flex items-center justify-center w-6 h-6 rounded-full ring-0 sm:ring-1 shrink-0">II</div>
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
          <div className="z-10 flex items-center justify-center w-6 h-6 rounded-full ring-0 sm:ring-1 shrink-0">IV</div>
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
          <div className="z-10 flex items-center justify-center w-6 h-6 rounded-full ring-0 sm:ring-1 shrink-0">V</div>
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
          <div className="z-10 flex items-center justify-center w-6 h-6 rounded-full ring-0 sm:ring-1 shrink-0">VI</div>
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
  );
}
