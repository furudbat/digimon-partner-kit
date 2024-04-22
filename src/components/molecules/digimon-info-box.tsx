import { List } from 'flowbite-react';
import Link from 'next/link';
import { DigimonData } from 'src/models/digimon';

export function DigimonInfoBox({ data }: { data: DigimonData }) {
  return (
    <div className="max-w-full border border-gray-200 rounded-lg shadow p-5" style={{ height: '28rem' }}>
      <div className="grid grid-flow-row-dense grid-cols-2 grid-rows-1 px-2">
        <div className="items-stretch items-center my-5">
          <img
            className="self-center h-max-auto w-auto max-w-full rounded-md"
            height={320}
            src={data.img}
            alt={data.name}
          />
        </div>
        <div className="px-2 items-start ml-4 overflow-y-auto" style={{ height: '22rem' }}>
          <h5 className="text-2xl pb-3 font-bold tracking-tight text-gray-900 dark:text-white">
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
        <div className="px-4 mt-3 row-start-2 max-h-16">
          <div className="grid grid-flow-col auto-cols-max items-center">
            {data.categories?.length > 0 &&
              data.categories.map((category) => (
                <a key={category.title} href={category.href} title={category.title}>
                  <img className="flex flex-inline mx-1 h-auto max-w-full" src={category.img} alt={category.name} />
                </a>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}