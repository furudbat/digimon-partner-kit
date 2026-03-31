'use client';

import { List, ListItem } from 'flowbite-react';
import Image from 'next/image';
import Link from 'next/link';
import { useMediaQuery } from 'react-responsive';
import { DigimonData } from 'src/models/digimon';

import { MediaQueryMobileBreakpoint, NOT_FOUND_IMAGE } from '../constants';

export function DigimonInfoBox({ data, height }: { data: DigimonData; height?: string | number }) {
  const isMobile = useMediaQuery({ maxWidth: MediaQueryMobileBreakpoint });
  //const pathname = usePathname();

  return (
    <div
      className="max-w-full border rounded-lg shadow p-4"
      style={{ minHeight: !isMobile ? (height ?? '32rem') : undefined }}
    >
      <div className="grid grid-flow-row-dense md:grid-cols-2 md:grid-rows-1 px-2">
        <div className="items-center mt-11">
          <Image
            className="self-center h-max-auto w-auto max-w-full rounded-md"
            width={320}
            height={320}
            src={window.location.pathname + '/' + (data.img || NOT_FOUND_IMAGE)}
            alt={data.name}
            loading="eager"
          />
        </div>
        <div className="px-2 md:items-start ml-4 overflow-y-auto" style={{ height: !isMobile ? '26rem' : undefined }}>
          <h5 className="text-2xl pb-2 font-bold tracking-tight">
            <Link href={data.href} title={data.name} target="_blank" rel="noreferrer">
              {data.name}
            </Link>
          </h5>
          <p className="font-normal">
            <strong>Level:</strong> {data.level}
          </p>
          {data.types?.length > 0 && (
            <div className="font-normal">
              <strong>Type:</strong>{' '}
              <List unstyled>
                {data.types.map((type) => (
                  <ListItem key={type} className="ml-3">
                    {type}
                  </ListItem>
                ))}
              </List>
            </div>
          )}
          {data.attributes?.length > 0 && (
            <div className="font-normal">
              <strong>Attributes:</strong>{' '}
              <List unstyled>
                {data.attributes.map((attribute) => (
                  <ListItem key={attribute} className="ml-2">
                    {attribute}
                  </ListItem>
                ))}
              </List>
            </div>
          )}
          {data.fields?.length > 0 && (
            <div className="font-normal">
              <strong>Field:</strong>{' '}
              <List unstyled>
                {data.fields.map((field) => (
                  <ListItem key={field} className="ml-2">
                    {field}
                  </ListItem>
                ))}
              </List>
            </div>
          )}
        </div>
        <div className="px-4 mt-1 md:row-start-2 max-h-12">
          <div className="grid grid-flow-col auto-cols-max items-center">
            {data.categories?.length > 0 &&
              data.categories.map((category) => (
                <Link
                  key={category.title}
                  href={category.href ?? '#'}
                  title={category.title}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Image
                    className="flex flex-inline mx-1 h-max-auto max-w-full"
                    src={window.location.pathname + '/' + category.img}
                    alt={category.name}
                    width={50}
                    height={50}
                    loading="eager"
                  />
                </Link>
              ))}
          </div>
        </div>
      </div>
      <div className="p-1 px-2 my-2 ml-6">
        <div className="overflow-hidden h-12 w-full" style={{ maxLines: 2 }}>
          <p className="text-ellipsis" style={{ lineClamp: 2, whiteSpace: 'pre-line' }}>
            {data.description}
          </p>
        </div>
        <Link
          href={data.href}
          target="_blank"
          className="items-center text-center text-blue-800 dark:text-blue-400 hover:underline"
          rel="noreferrer"
        >
          more
        </Link>
      </div>
    </div>
  );
}
