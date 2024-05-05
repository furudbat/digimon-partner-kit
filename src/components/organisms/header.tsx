'use client';

import { DarkThemeToggle } from 'flowbite-react';

export function MainHeader() {
  return (
    <section className="dark:text-white">
      <div className="mx-auto grid max-w-screen-xl px-1 py-1 text-center lg:py-2 lg:pt-4">
        <div className="mx-auto place-self-center">
          <h1 className="mt-2 mb-4 md:mb-2 max-w-2xl font-extrabold leading-none tracking-tight">
            Digimon Partner Kit
          </h1>
          <p className="mb-1 max-w-2xl lg:mb-2 m-2 md:m-1">
            Build your own Digimon-Partner Digivolution line. <DarkThemeToggle />
            <br />
            <em>Select your first Digimon and then select the next/previous Levels.</em>
          </p>
        </div>
      </div>
    </section>
  );
}
