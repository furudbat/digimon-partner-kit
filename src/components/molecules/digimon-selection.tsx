import { Button, Card } from 'flowbite-react';
import Link from 'next/link';
import { DigimonData } from 'src/models/digimon';

export function DigimonSelection({
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
    if (selected) {
      return 'bg-blue-400 bg-blue-200 dark:text-white';
    }

    return !disabled ? 'bg-white dark:bg-gray-800 dark:text-white' : 'bg-gray-200 dark:bg-gray-700 dark:text-white';
  })();

  const cardClassName = highlight ? `w-60 ${bg} border-2 p-1` : `w-60 ${bg} border p-1`;
  const imgHeight = 240;

  return (
    <Card
      className={cardClassName}
      style={{ height: imgHeight + 120 }}
      renderImage={() => {
        return (
          <Button color="light" onClick={() => onClick && onClick()} disabled={data === undefined && disabled}>
            {data && (
              <img
                className="rounded-lg w-auto max-w-full max-h-48"
                src={data.img}
                height={imgHeight}
                alt={data.name}
              />
            )}
            {!data && !disabled && (
              <p className={`my-4 text-lg font-normal self-center`} style={{ height: imgHeight }}>
                Click Me to Select
              </p>
            )}
            {!data && disabled && (
              <p className={`my-4 text-lg self-center`} style={{ height: imgHeight }}>
                (Select previous Level)
              </p>
            )}
          </Button>
        );
      }}
    >
      <div className="px-2">
        <h5 className="text-xl font-medium truncate">{data?.name}</h5>
        <p className="text-sm">{data?.level || title}</p>
      </div>
      <div className="grid grid-flow-row-dense grid-cols-3 grid-rows-1 items-center px-2">
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
          {data && (
            <Button outline pill color="gray" size="xs" disabled={disabled} onClick={() => onReset && onReset()}>
              Reset
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
