import { Button, Card } from 'flowbite-react';
import Image from 'next/image';
import Link from 'next/link';
import { DigimonData } from 'src/models/digimon';
import useFitText from 'use-fit-text';

import { cn } from '@/lib/utils';

export function DigimonTimelineCard({
  title,
  data,
  onClick,
  onReset,
  disabled,
  selected,
  highlight,
  printMode,
}: {
  title?: string;
  data?: DigimonData;
  onClick?: () => void;
  onReset?: () => void;
  disabled?: boolean;
  selected?: boolean;
  highlight?: boolean;
  printMode?: boolean;
}) {
  const { fontSize, ref } = useFitText();
  //const pathname = usePathname();

  const bg = (() => {
    if (disabled && !printMode) {
      return !selected || printMode
        ? 'bg-gray-200 dark:bg-gray-600 dark:text-white'
        : 'bg-gray-300 dark:bg-gray-700 dark:text-white';
    }

    return !selected || printMode
      ? 'bg-white dark:bg-gray-800 dark:text-white'
      : 'bg-blue-300 dark:bg-blue-900 dark:text-white';
  })();

  const imgSize = 240;

  return (
    <Card
      className={cn('w-60 py-4 px-1 items-center', bg, highlight ? 'border-2' : 'border', printMode ? 'shadow-sm' : '')}
      style={{ height: imgSize + 78 }}
      renderImage={() => {
        return (
          <div
            className={cn('flex items-center', data || !disabled ? 'cursor-pointer' : 'cursor-not-allowed')}
            onClick={() => {
              if ((data || !disabled) && onClick) {
                onClick();
              }
            }}
          >
            {data && (
              <Image
                className="rounded-lg w-auto max-w-full max-h-48"
                src={window.location.pathname + '/' + data.img}
                width={imgSize}
                height={imgSize}
                alt={data.name}
              />
            )}
            {!data && !printMode && !disabled && (
              <p className={`py-4 text-lg font-normal self-center`} style={{ height: imgSize - 48 }}>
                Click Me to Select
              </p>
            )}
            {!data && !printMode && disabled && (
              <p className={`py-4 text-lg self-center`} style={{ height: imgSize - 48 }}>
                (Select previous Level)
              </p>
            )}
            {!data && printMode && (
              <p className={`py-4 text-lg self-center`} style={{ height: imgSize - 48 }}>
                No Data
              </p>
            )}
          </div>
        );
      }}
    >
      {/*Can not customize gap in Card Body, use negative margin */}
      <div className="w-56 px-2 mb-2" style={{ marginTop: -10 }}>
        {data && !printMode && (
          <Link
            href={data.href}
            target="_blank"
            className="items-center text-center text-blue-800 dark:text-blue-400 hover:underline"
            rel="noreferrer"
          >
            <div className={cn('text-xl font-medium', !printMode ? 'truncate' : 'h-14 text-wrap overflow-hidden')}>
              {data.name}
            </div>
          </Link>
        )}
        {data && printMode && (
          <h5 className={cn('text-xl font-medium', !printMode ? 'truncate' : 'h-14 text-wrap overflow-hidden')}>
            <div ref={ref} style={{ fontSize }} className="h-14">
              {data.name}
            </div>
          </h5>
        )}
      </div>
      <div
        className="grid grid-flow-row-dense grid-cols-3 grid-rows-1 items-center px-2 gap-1"
        style={{ marginTop: printMode ? -18 : -14 }}
      >
        <div className="col-span-2">
          <p className="text-sm">{data?.level || title}</p>
        </div>
        {!printMode && (
          <div>
            {data && disabled && (
              <Button color="gray" size="xs" disabled={disabled} onClick={() => onReset && onReset()}>
                Reset
              </Button>
            )}
            {data && !disabled && (
              <Button
                color="gray"
                size="xs"
                className="text-gray-900 bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
                disabled={disabled}
                onClick={() => onReset && onReset()}
              >
                Reset
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
