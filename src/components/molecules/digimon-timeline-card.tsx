import { Button, Card } from 'flowbite-react';
import Image from 'next/image';
import Link from 'next/link';
import { DigimonData } from 'src/models/digimon';

import { cn } from '@/lib/utils';

export function DigimonTimelineCard({
  title,
  data,
  onClick,
  onReset,
  disabled,
  selected,
  highlight,
}: {
  title?: string;
  data?: DigimonData;
  onClick?: () => void;
  onReset?: () => void;
  disabled?: boolean;
  selected?: boolean;
  highlight?: boolean;
}) {
  const bg = (() => {
    if (disabled) {
      return !selected
        ? 'bg-gray-200 dark:bg-gray-600 dark:text-white'
        : 'bg-gray-300 dark:bg-gray-700 dark:text-white';
    }

    return !selected ? 'bg-white dark:bg-gray-800 dark:text-white' : 'bg-blue-300 dark:bg-blue-900 dark:text-white';
  })();

  const imgSize = 240;

  return (
    <Card
      className={cn('w-60', bg, highlight ? 'border-2' : 'border')}
      style={{ height: imgSize + 86 }}
      renderImage={() => {
        return (
          <Button color="light" onClick={() => onClick && onClick()} disabled={data === undefined && disabled}>
            {data && (
              <Image
                /*crossOrigin="anonymous"*/
                unoptimized
                className="rounded-lg w-auto max-w-full max-h-48"
                src={data.img}
                width={imgSize}
                height={imgSize}
                alt={data.name}
              />
            )}
            {!data && !disabled && (
              <p className={`py-4 text-lg font-normal self-center`} style={{ height: imgSize }}>
                Click Me to Select
              </p>
            )}
            {!data && disabled && (
              <p className={`py-4 text-lg self-center`} style={{ height: imgSize }}>
                (Select previous Level)
              </p>
            )}
          </Button>
        );
      }}
    >
      {/*Can not customize gap in Card Body, use negative margin */}
      <div className="px-2" style={{ marginTop: -12 }}>
        <h5 className="text-xl font-medium truncate">{data?.name}</h5>
        <p className="text-sm">{data?.level || title}</p>
      </div>
      <div
        className="grid grid-flow-row-dense grid-cols-3 grid-rows-1 items-center px-2 gap-1"
        style={{ marginTop: -10 }}
      >
        <div className="col-span-2">
          <p className="text-xs justify-self-center">
            {data && (
              <Link
                href={data.href}
                target="_blank"
                className="items-center text-center text-blue-800 dark:text-blue-400 hover:underline"
                rel="noreferrer"
              >
                [Go To Wikimon]
              </Link>
            )}
          </p>
        </div>
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
      </div>
    </Card>
  );
}
