/* eslint no-console: off */

import axios from 'axios';
import cheerio from 'cheerio';
import crypto from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import fs from 'fs';
import { writeFile } from 'fs/promises';
import { resolve } from 'path';
import { promisify } from 'util';

const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);

export function filterUnique<T>(arr: T[], pred: (a: T, b: T) => boolean) {
  return arr.filter((value, index, self) => {
    return self.findIndex((v) => pred(v, value)) === index;
  });
}

function getRandom(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
//async function asyncSleep(ms: number) {
//  return new Promise((resolve) => setTimeout(resolve, ms));
//}
async function asyncRandomSleep(minMs: number, maxMs: number) {
  return new Promise((resolve) => setTimeout(resolve, getRandom(minMs, maxMs)));
}
async function executePromisesWithLimit<T>(promises: Promise<T>[], limit: number): Promise<T[]> {
  let index = 0;
  const results: T[] = [];

  const executeBatch = async (): Promise<void> => {
    const batch = promises.slice(index, index + limit);
    index += limit;

    const executing = batch.map((promise) => {
      return new Promise<void>((resolve, reject) => {
        setTimeout(
          () => {
            promise
              .then((result) => {
                results.push(result); // Collect the result
                resolve();
              })
              .catch(reject);
          },
          getRandom(50, 230)
        );
      });
    });

    return Promise.allSettled(executing).then(() => {
      if (index < promises.length) {
        return executeBatch();
      }
    });
  };

  return executeBatch().then(() => results); // Return the collected results after all promises are executed
}
//function flatten<T>(arr: T[][]): T[] {
//  return ([] as T[]).concat(...arr);
//}

async function scrapeWebsite(url: string) {
  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
  };

  const response = await axios.get<string>(url, { headers });
  // @TODO: check for caching header

  await asyncRandomSleep(500, 5000);

  return response.data;
}

async function fetchFromWebOrCache(url: string, ignoreCache = false) {
  const generateHash = (data: string) => {
    const hash = crypto.createHash('sha256');
    hash.update(data);

    return hash.digest('hex');
  };
  if (!existsSync(resolve(__dirname, '.cache'))) {
    mkdirSync('.cache');
  }
  console.info(`Getting data for ${url}`);
  const hash = generateHash(url);
  const filename = resolve(__dirname, `.cache/${hash}.html`);
  if (!ignoreCache && fs.existsSync(filename)) {
    console.info(`Loading from cache... [${hash}]`);

    return readFileAsync(filename, 'utf8');
  } else {
    console.info(`Loading from Website... [${hash}]`);
    const HTMLData = await scrapeWebsite(url);
    // @TODO: check for caching header or "lastModified"
    if (!ignoreCache && HTMLData) {
      console.info(`Write to cache... [${hash}]`);
      await writeFileAsync(filename, HTMLData, 'utf8');
    }

    return HTMLData;
  }
}

type DigimonLevel = 'Baby I' | 'Baby II' | 'Child' | 'Adult' | 'Perfect' | 'Ultimate';
interface DigimonDataEvolveElement {
  id: string;
  name: string;
  url: string;
  canon?: boolean;
  line?: string;
}
interface DigimonData {
  href: string;
  id: string;
  name: string;
  description: string;
  img: string;
  levels: string[];
  level?: DigimonLevel;
  classes: string[];
  digimonClass?: string;
  types: string[];
  attributes: string[];
  fields: string[];
  minWeights: number[];
  minWeight?: number;
  categories: { name: string; img: string; title?: string; href?: string }[];
  evolvesFrom: DigimonDataEvolveElement[];
  evolvesTo: DigimonDataEvolveElement[];
}
class DigimonScraperScraper {
  readonly baseUrl = 'https://wikimon.net';

  async scrapeDigimon(url: string) {
    const html = await fetchFromWebOrCache(url);

    const $ = cheerio.load(html);

    const name = $('#firstHeading').text().trim();

    const getInfoFromInfoBox = (infoBox: cheerio.Cheerio, title: string, text?: string) => {
      let ret: string[] = [];

      const tr = ((): cheerio.Cheerio | undefined => {
        if (text) {
          let ftd: cheerio.Cheerio | undefined;
          infoBox.find(`td a[title="${title}"]`).each((i, e) => {
            if ($(e).text().trim() === text && !ftd) {
              ftd = $(e);
            }
          });

          return ftd ? ftd.closest('tr') : undefined;
        }

        return infoBox.find(`td a[title="${title}"]:first`).closest('tr');
      })();

      if (tr) {
        const count = parseInt(tr.find('td:first').attr('rowspan') || (tr.length ? '1' : '0'));
        const trs = count > 0 ? tr.nextAll().slice(0, count - 1) : undefined;
        if (count > 0) {
          const v = tr.find('td').eq(1).text().trim().replace('\n', '').replace('－', '');
          if (v) {
            ret.push(v);
          }
        }
        trs?.each((i, e) => {
          const v = $(e).find('td').eq(0).text().trim().replace('\n', '').replace('－', '');
          if (v) {
            ret.push(v);
          }
        });
        if (ret.length === 0 && tr.length > 0) {
          ret = [tr.find('td').eq(1).text().trim()];
        }
      }

      return ret;
    };

    if (name) {
      console.info(`Parse Digimon ${url} ...`);

      const descriptionTd = $(
        '#mw-content-text #TopLayerMorphContent1 #pnDigimonRefBookMultiMorphContent1 td[valign="top"]'
      ).remove('span.pnDigimonRefBookMultiMorphLink2');
      const infoBox = $('#StatsBoxMorphContent1 table');
      const img = infoBox.find('a.image img');

      const levels = getInfoFromInfoBox(infoBox, 'Evolution Stage', 'Level');
      const digimonClasses = getInfoFromInfoBox(infoBox, 'Evolution Stage', 'Class');
      const types = getInfoFromInfoBox(infoBox, 'Type');
      const attributes = getInfoFromInfoBox(infoBox, 'Attribute');
      const fields = getInfoFromInfoBox(infoBox, 'Field');

      const weightTr = infoBox.find('td a[title="Weight"]').closest('tr');
      const weightTgText = weightTr.find('td').eq(1).text().trim().replace('\n', '');
      const minWeights: number[] = weightTgText
        .split('g')
        .filter((g) => g !== '')
        .map((g) => parseInt(g));

      const categorieAs = infoBox.find('th a[title^="Category:"]');

      const categories: { name: string; img: string; title?: string; href?: string }[] = [];
      categorieAs.each((i, e) => {
        const name = $(e).attr('title')?.trim().replace('Category:', '');
        const img = $(e).find('img').attr('src');
        if (name && img) {
          categories.push({
            name: name,
            img: this.baseUrl + img,
            title: $(e).attr('title'),
            href: this.baseUrl + $(e).attr('href'),
          });
        }
      });

      const evolvesFromLi = $('#Evolves_From').closest('h2').next('ul').children('li');
      const evolvesFrom: DigimonDataEvolveElement[] = [];
      evolvesFromLi.each((i, e) => {
        const id = $(e).find('a').attr('href');
        const title = $(e).find('a').attr('title');
        const canon = $(e).find('b').length > 0;
        if (id && title) {
          const note = (() => {
            const matches = $(e)
              .text()
              .match(/\\((.*)\\)/);
            if (matches && matches.length) {
              return matches[0].replace(title?.trim(), '').replaceAll(/\\[[0-9]+\\]/g, '');
            }

            return undefined;
          })();

          evolvesFrom.push({
            id: id,
            name: title.trim(),
            url: this.baseUrl + $(e).find('a').attr('href'),
            canon: canon,
            note: note,
            line: $(e)
              .text()
              .trim()
              .replaceAll(/\\[[0-9]+\\]/g, ''),
          } as DigimonDataEvolveElement);
        }
      });

      const evolvesToLi = $('#Evolves_To').closest('h2').next('ul').children('li');
      const evolvesTo: DigimonDataEvolveElement[] = [];
      evolvesToLi.each((i, e) => {
        const id = $(e).find('a').attr('href');
        const title = $(e).find('a').attr('title');
        const canon = $(e).find('b').length > 0;
        if (id && title) {
          const note = (() => {
            const matches = $(e)
              .text()
              .match(/\\(.*\\)/);
            if (matches && matches.length === 1) {
              return matches[0].replace(title?.trim(), '').replaceAll(/\\[[0-9]+\\]/g, '');
            }

            return undefined;
          })();

          evolvesTo.push({
            id: id,
            name: title.trim(),
            url: this.baseUrl + $(e).find('a').attr('href'),
            canon: canon,
            note: note,
            line: $(e)
              .text()
              .trim()
              .replaceAll(/\\[[0-9]+\\]/g, ''),
          } as DigimonDataEvolveElement);
        }
      });

      console.info(`Scrapped Digimon: ${name} (${levels}) [${attributes}]`);

      return {
        href: url,
        id: url.replace(this.baseUrl, ''),
        name,
        description: descriptionTd
          .text()
          .trim()
          .replace(/'^. Japanese'/, '')
          .replace('⇨ Japanese', ''),
        img: this.baseUrl + img.attr('src'),
        levels: levels,
        level: levels.find((level) => level.match(/(Baby I|Baby II|Child|Adult|Perfect|Ultimate)/)) as DigimonLevel,
        classes: digimonClasses,
        digimonClass: digimonClasses.length >= 1 ? digimonClasses[0] : undefined,
        types: types,
        attributes: attributes,
        fields: fields,
        minWeights: minWeights,
        minWeight: minWeights.length ? Math.min(...minWeights) : undefined,
        categories: categories,
        evolvesFrom: evolvesFrom.filter((evo) => !evo.name.match(/^(Any .*Digimon|Digimon Card Game)/)),
        evolvesTo: evolvesTo.filter((evo) => !evo.name.match(/^(Any .*Digimon|Digimon Card Game)/)),
      } as DigimonData;
    }

    return undefined;
  }

  async scrapeDigimonList(url: string) {
    const html = await fetchFromWebOrCache(url);

    const $ = cheerio.load(html);

    const ret: { id: string; href: string; name: string }[] = [];
    $('.mw-category-group a').each((i, e) => {
      if ($(e).attr('href') && $(e).attr('title')) {
        ret.push({
          id: $(e).attr('href') ?? '',
          href: this.baseUrl + $(e).attr('href'),
          name: $(e).attr('title')?.trim() ?? '',
        });
      }
    });

    return ret;
  }
}

async function getBaby1DigimonList() {
  const scraper = new DigimonScraperScraper();

  const baby1List1 = await scraper.scrapeDigimonList('https://wikimon.net/Category:Baby_I_Level');

  return [...baby1List1].filter((d) => !d.name.match(/^Baby I$/));
}

async function getBaby2DigimonList() {
  const scraper = new DigimonScraperScraper();

  const baby2List1 = await scraper.scrapeDigimonList('https://wikimon.net/Category:Baby_II_Level');

  return [...baby2List1].filter((d) => !d.name.match(/^Baby II$/));
}

async function getChildDigimonList() {
  const scraper = new DigimonScraperScraper();

  const childList1 = await scraper.scrapeDigimonList('https://wikimon.net/Category:Child_Level');
  await asyncRandomSleep(250, 520);
  const childList2 = await scraper.scrapeDigimonList(
    'https://wikimon.net/index.php?title=Category:Child_Level&pagefrom=Toy+Agumon#mw-pages'
  );

  return [...childList1, ...childList2].filter((d) => !d.name.match(/^Child$/));
}

async function getAdultDigimonList() {
  const scraper = new DigimonScraperScraper();

  const adultList1 = await scraper.scrapeDigimonList('https://wikimon.net/index.php?title=Category:Adult_Level');
  await asyncRandomSleep(250, 520);
  const adultList2 = await scraper.scrapeDigimonList(
    'https://wikimon.net/index.php?title=Category:Adult_Level&pagefrom=Mad+Leomon%3A+Armed+Mode#mw-pages'
  );

  return [...adultList1, ...adultList2].filter((d) => !d.name.match(/^Adult$/));
}

async function getPerfectDigimonList() {
  const scraper = new DigimonScraperScraper();

  const perfectList1 = await scraper.scrapeDigimonList('https://wikimon.net/Category:Perfect_Level');
  await asyncRandomSleep(250, 520);
  const perfectList2 = await scraper.scrapeDigimonList(
    'https://wikimon.net/index.php?title=Category:Perfect_Level&pagefrom=Mephismon+%28X-Antibody%29#mw-pages'
  );

  return [...perfectList1, ...perfectList2].filter((d) => !d.name.match(/^Perfect$/));
}

async function getUltimateDigimonList() {
  const scraper = new DigimonScraperScraper();

  const ultimateList1 = await scraper.scrapeDigimonList('https://wikimon.net/Category:Ultimate_Level');
  await asyncRandomSleep(250, 520);
  const ultimateList2 = await scraper.scrapeDigimonList(
    'https://wikimon.net/index.php?title=Category:Ultimate_Level&pagefrom=Jokermon#mw-pages'
  );
  await asyncRandomSleep(100, 260);
  const ultimateList3 = await scraper.scrapeDigimonList(
    'https://wikimon.net/index.php?title=Category:Ultimate_Level&pagefrom=VR-SaintGalgo#mw-pages'
  );

  return [...ultimateList1, ...ultimateList2, ...ultimateList3].filter((d) => !d.name.match(/^Ultimate$/));
}

function saveData(filename: string, data: object) {
  writeFile(resolve(__dirname, `${filename}.json`), JSON.stringify(data), {
    encoding: 'utf8',
  });
  writeFile(resolve(__dirname, `${filename}.pretty.json`), JSON.stringify(data, null, 2), {
    encoding: 'utf8',
  });
}

export async function main() {
  const scraper = new DigimonScraperScraper();

  // test
  //console.debug(await scraper.scrapeDigimon("https://wikimon.net/Agumon"));
  //console.debug(await scraper.scrapeDigimon("https://wikimon.net/Agnimon"));

  const baby1List = await getBaby1DigimonList();
  console.info(`Get Baby I Digimon List: ${baby1List.length}`);

  await asyncRandomSleep(60, 230);
  const baby2List = await getBaby2DigimonList();
  console.info(`Get Baby II Digimon List: ${baby2List.length}`);

  await asyncRandomSleep(100, 260);
  const childList = await getChildDigimonList();
  console.info(`Get Child Digimon List: ${childList.length}`);

  await asyncRandomSleep(80, 510);
  const adultList = await getAdultDigimonList();
  console.info(`Get Adult Digimon List: ${adultList.length}`);

  await asyncRandomSleep(50, 120);
  const perfectList = await getPerfectDigimonList();
  console.info(`Get Perfect Digimon List: ${perfectList.length}`);

  await asyncRandomSleep(55, 120);
  const ultimateList = await getUltimateDigimonList();
  console.info(`Get Ultimate Digimon List: ${ultimateList.length}`);

  const db = {
    lists: {
      baby1: baby1List,
      baby2: baby2List,
      child: childList,
      adult: adultList,
      perfect: perfectList,
      ultimate: ultimateList,
      all: [...baby1List, ...baby2List, ...childList, ...adultList, ...perfectList, ...ultimateList],
    },
    digimons: [] as DigimonData[],
  };

  const allDigimonUrls = db.lists.all.map((d) => d.href);
  console.info(`Load ${allDigimonUrls.length} Digimons...`);

  const loadSlice = async (start: number, end: number) => {
    const slice = end >= start ? allDigimonUrls.slice(start, end) : [];
    if (slice.length) {
      const promises = slice.map(async (d) => scraper.scrapeDigimon(d));
      db.digimons = db.digimons.concat((await executePromisesWithLimit(promises, 2)).filter((d) => d) as DigimonData[]);
    }
  };

  const loadBatch = 10;
  let i = 0;
  while (i < allDigimonUrls.length) {
    await loadSlice(i, i + loadBatch);
    i += loadBatch;
  }
  // load rest/all
  const promises = allDigimonUrls.map(async (d) => scraper.scrapeDigimon(d));
  db.digimons = [...db.digimons, ...((await executePromisesWithLimit(promises, 2)).filter((d) => d) as DigimonData[])];

  console.info('clean up Digimons...');

  // filter unique digimon (remove duplicates)
  db.digimons = filterUnique(db.digimons, (a, b) => a.id === b.id);

  // clean up evols
  db.digimons = db.digimons.map((digimon) => {
    const evolvesFrom = digimon.evolvesFrom.filter((evo) => {
      const evoDigimon = db.digimons.find((d) => d.id === evo.id);
      if (evoDigimon) {
        switch (digimon.level) {
          case 'Baby I':
            return false;
          case 'Baby II':
            return evoDigimon?.level === 'Baby I';
          case 'Child':
            return evoDigimon?.level === 'Baby II';
          case 'Adult':
            return evoDigimon?.level === 'Child';
          case 'Perfect':
            return evoDigimon?.level === 'Adult';
          case 'Ultimate':
            return evoDigimon?.level === 'Perfect';
        }
      }

      return false;
    });
    const evolvesTo = digimon.evolvesTo.filter((evo) => {
      const evoDigimon = db.digimons.find((d) => d.id === evo.id);
      if (evoDigimon) {
        switch (digimon.level) {
          case 'Baby I':
            return evoDigimon?.level === 'Baby II';
          case 'Baby II':
            return evoDigimon?.level === 'Child';
          case 'Child':
            return evoDigimon?.level === 'Adult';
          case 'Adult':
            return evoDigimon?.level === 'Perfect';
          case 'Perfect':
            return evoDigimon?.level === 'Ultimate';
          case 'Ultimate':
            return false;
        }
      }

      return false;
    });

    return {
      ...digimon,
      evolvesFrom,
      evolvesTo,
    };
  });

  db.lists.baby1 = db.lists.baby1.filter((d) => {
    const digimon = db.digimons.find((fd) => d.id === fd.id);

    return digimon?.level === 'Baby I';
  });
  db.lists.baby2 = db.lists.baby2.filter((d) => {
    const digimon = db.digimons.find((fd) => d.id === fd.id);

    return digimon?.level === 'Baby II';
  });
  db.lists.child = db.lists.child.filter((d) => {
    const digimon = db.digimons.find((fd) => d.id === fd.id);

    return digimon?.level === 'Child';
  });
  db.lists.adult = db.lists.adult.filter((d) => {
    const digimon = db.digimons.find((fd) => d.id === fd.id);

    return digimon?.level === 'Adult';
  });
  db.lists.perfect = db.lists.perfect.filter((d) => {
    const digimon = db.digimons.find((fd) => d.id === fd.id);

    return digimon?.level === 'Perfect';
  });
  db.lists.perfect = db.lists.ultimate.filter((d) => {
    const digimon = db.digimons.find((fd) => d.id === fd.id);

    return digimon?.level === 'Ultimate';
  });

  console.info(`Save ${db.digimons.length} Digimons...`);
  saveData('digimon.db', db);
}

main();
