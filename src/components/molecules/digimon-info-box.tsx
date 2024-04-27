import { List } from 'flowbite-react';
import Image from 'next/image';
import Link from 'next/link';
import { DigimonData } from 'src/models/digimon';

export function DigimonInfoBox({ data, height }: { data: DigimonData; height?: string | number }) {
  return (
    <div className="max-w-full border border-gray-200 rounded-lg shadow p-4" style={{ minHeight: height ?? '35rem' }}>
      <div className="grid grid-flow-row-dense md:grid-cols-2 md:grid-rows-1 px-2">
        <div className="items-center mt-11">
          <Image
            /*crossOrigin="anonymous"*/
            unoptimized
            className="self-center h-max-auto w-auto max-w-full rounded-md"
            width={320}
            height={320}
            src={data.img}
            alt={data.name}
          />
        </div>
        <div className="px-2 md:items-start ml-4 overflow-y-auto" style={{ height: '24rem' }}>
          <h5 className="text-2xl pb-2 font-bold tracking-tight text-gray-900 dark:text-white">
            <Link href={data.href} title={data.name} target="_blank" rel="noreferrer">
              {data.name}
            </Link>
          </h5>
          <p className="font-normal text-gray-700 dark:text-gray-400">
            <strong>Level:</strong> {data.level}
          </p>
          {data.types?.length > 0 && (
            <div className="font-normal text-gray-700 dark:text-gray-400">
              <strong>Type:</strong>{' '}
              <List unstyled>
                {data.types.map((type) => (
                  <List.Item key={type} className="ml-3">
                    {type}
                  </List.Item>
                ))}
              </List>
            </div>
          )}
          {data.attributes?.length > 0 && (
            <div className="font-normal text-gray-700 dark:text-gray-400">
              <strong>Attributes:</strong>{' '}
              <List unstyled>
                {data.attributes.map((attribute) => (
                  <List.Item key={attribute} className="ml-2">
                    {attribute}
                  </List.Item>
                ))}
              </List>
            </div>
          )}
          {data.fields?.length > 0 && (
            <div className="font-normal text-gray-700 dark:text-gray-400">
              <strong>Field:</strong>{' '}
              <List unstyled>
                {data.fields.map((field) => (
                  <List.Item key={field} className="ml-2">
                    {field}
                  </List.Item>
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
                    /*crossOrigin="anonymous"*/
                    unoptimized
                    className="flex flex-inline mx-1 h-auto max-w-full"
                    src={category.img}
                    alt={category.name}
                    width={50}
                    height={50}
                  />
                </Link>
              ))}
          </div>
        </div>
      </div>
      <div className="p-1 px-2 my-2 ml-6">
        <div className="overflow-hidden h-12 w-full dark:text-white" style={{ maxLines: 2 }}>
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
