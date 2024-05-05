/* eslint no-console: off */

import axios from 'axios';
import cheerio from 'cheerio';
import crypto from 'crypto';
import fs, { existsSync, mkdirSync } from 'fs';
import { copy } from 'fs-extra';
import { writeFile } from 'fs/promises';
import Downloader from 'nodejs-file-downloader';
import { resolve } from 'path';
import { getRandom } from 'random-useragent';
import { promisify } from 'util';

const config = {
  wikimonUrl: 'https://wikimon.net',
  baby1Lists: ['https://wikimon.net/Category:Baby_I_Level'],
  baby2Lists: ['https://wikimon.net/Category:Baby_II_Level'],
  childLists: [
    'https://wikimon.net/Category:Child_Level',
    'https://wikimon.net/index.php?title=Category:Child_Level&pagefrom=Toy+Agumon#mw-pages',
  ],
  adultList: [
    'https://wikimon.net/index.php?title=Category:Adult_Level',
    'https://wikimon.net/index.php?title=Category:Adult_Level&pagefrom=Mad+Leomon%3A+Armed+Mode#mw-pages',
  ],
  perfectList: [
    'https://wikimon.net/Category:Perfect_Level',
    'https://wikimon.net/index.php?title=Category:Perfect_Level&pagefrom=Mephismon+%28X-Antibody%29#mw-pages',
  ],
  ultimateList: [
    'https://wikimon.net/Category:Ultimate_Level',
    'https://wikimon.net/index.php?title=Category:Ultimate_Level&pagefrom=Jokermon#mw-pages',
    'https://wikimon.net/index.php?title=Category:Ultimate_Level&pagefrom=VR-SaintGalgo#mw-pages',
  ],
};

const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);

function flatten<T>(arr: T[][]): T[] {
  return ([] as T[]).concat(...arr);
}
function filterUnique<T>(arr: T[], pred: (a: T, b: T) => boolean) {
  return arr.filter((value, index, self) => {
    return self.findIndex((v) => pred(v, value)) === index;
  });
}

function getRandomValue(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
//async function asyncSleep(ms: number) {
//  return new Promise((resolve) => setTimeout(resolve, ms));
//}
async function asyncRandomSleep(minMs: number, maxMs: number) {
  return new Promise((resolve) => setTimeout(resolve, getRandomValue(minMs, maxMs)));
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
          getRandomValue(50, 230)
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

const userAgent = getRandom();

async function scrapeWebsite(url: string) {
  const headers = {
    'User-Agent': userAgent,
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  };

  const response = await axios.get<string>(url, { headers });
  // @TODO: check for caching header

  await asyncRandomSleep(500, 5000);

  return response.data;
}

async function fetchFromWebOrCache(url: string, prefix?: string, ignoreCache = false) {
  const generateHash = (data: string) => {
    const hash = crypto.createHash('sha256');
    hash.update(data);

    return hash.digest('hex');
  };
  if (!existsSync(resolve(__dirname, '.cache'))) {
    mkdirSync('.cache');
  }
  console.info(`Getting data from ${url}`);
  const hash = generateHash(url);
  const filename = prefix
    ? resolve(__dirname, `.cache/${prefix}${hash}.html`)
    : resolve(__dirname, `.cache/${hash}.html`);
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
async function downloadImage(url: string, ignoreCache = false) {
  const generateHash = (data: string) => {
    const hash = crypto.createHash('sha256');
    hash.update(data);

    return hash.digest('hex');
  };
  if (!existsSync(resolve(__dirname, '.cache'))) {
    mkdirSync('.cache');
  }
  console.info(`Getting image from ${url}`);
  const hash = generateHash(url);
  const filename = resolve(__dirname, `.cache/i_${hash}.png`);
  if (!ignoreCache && fs.existsSync(filename)) {
    console.info(`Loading from cache... [${hash}]`);

    return filename;
  } else {
    console.info(`Loading from Website... [${hash}]`);
    const headers = {
      'User-Agent': userAgent,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    };

    const downloader = new Downloader({
      url,
      directory: '.cache',
      headers,
    });

    try {
      const ret = await downloader.download();
      await asyncRandomSleep(1000, 5000);

      // @TODO: check for caching header or "lastModified"
      if (!ignoreCache && ret.filePath) {
        console.info(`Write to cache... [${hash}]`);
        await copy(ret.filePath, filename);
        console.info(`Image Saved ${ret.filePath} => ${filename}`);

        return filename;
      }

      return ret.filePath;
    } catch (error) {
      if (error.responseBody) {
        console.log({ url, error: error.responseBody });
      }
    }
  }

  return null;
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
  names: Record<string, string>;
  description: string;
  img: string;
  imgOrigin: string;
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
const hrefToId = (href?: string) => {
  return href
    ? decodeURI(href.replace(config.wikimonUrl, '').replace('/', ''))
        .replaceAll(' ', '_')
        .replaceAll('+', '_')
        .replaceAll("'", '')
        .replaceAll('·', '_')
        .replaceAll('%20', '_')
        .replaceAll('%2B', '_')
        .replaceAll('%27', '')
        .replace(':', '_')
        .replace('ä', 'ae')
        .replace('ö', 'oe')
        .replace('ü', 'ue')
        .replaceAll('(', '')
        .replaceAll(')', '')
        .replace('.', '_')
        .replaceAll('__', '_')
    : undefined;
};
class DigimonScraperScraper {
  readonly baseUrl = config.wikimonUrl;

  async scrapeDigimon(url: string) {
    const html = await fetchFromWebOrCache(url);

    const $ = cheerio.load(html);

    const name = $('#firstHeading').text().trim();

    const getInfoFromInfoBox = (infoBox: cheerio.Cheerio, params: { title?: string; text?: string }) => {
      let ret: string[] = [];

      const tr = ((): cheerio.Cheerio | undefined => {
        if (params.text && params.title) {
          let ftd: cheerio.Cheerio | undefined;
          infoBox.find(`td a[title="${params.title}"]`).each((i, e) => {
            if ($(e).text().trim() === params.text && !ftd) {
              ftd = $(e);
            }
          });

          return ftd ? ftd.closest('tr') : undefined;
        }

        if (params.title) {
          return infoBox.find(`td a[title="${params.title}"]:first`).closest('tr');
        }

        if (params.text) {
          let ret: cheerio.Cheerio | undefined = undefined;
          infoBox.find(`td`).each((index, td) => {
            if ($(td).text().trim() === params.text && !ret) {
              ret = $(td).closest('tr');
            }
          });

          return ret ? ret : infoBox.find(`td:first`).closest('tr');
        }

        return infoBox.find(`td:first`).closest('tr');
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

      const descriptionTd = (() => {
        if ($('#mw-content-text #TopLayerMorphContent1 #pn1aCurrentMultiMorphContent1').length) {
          return $('#mw-content-text #TopLayerMorphContent1 #pn1aCurrentMultiMorphContent1 td[valign="top"]').remove(
            'span.pnDigimonRefBookMultiMorphLink2'
          );
        }

        return $('#mw-content-text #TopLayerMorphContent1 #pnDigimonRefBookMultiMorphContent1 td[valign="top"]').remove(
          'span.pnDigimonRefBookMultiMorphLink2'
        );
      })();
      const infoBox = $('#StatsBoxMorphContent1 table');
      //const nameTable = $('#S2NameEtyMorphContent1 table:first table:first');
      const img = infoBox.find('a.image img');

      const levels = getInfoFromInfoBox(infoBox, { title: 'Evolution Stage', text: 'Level' });
      const digimonClasses = getInfoFromInfoBox(infoBox, { title: 'Evolution Stage', text: 'Class' });
      const types = getInfoFromInfoBox(infoBox, { title: 'Type' });
      const attributes = getInfoFromInfoBox(infoBox, { title: 'Attribute' });
      const fields = getInfoFromInfoBox(infoBox, { title: 'Field' });

      //const nameDubs = getInfoFromInfoBox(nameTable, { text: 'Dub:' });

      const weightTr = infoBox.find('td a[title="Weight"]').closest('tr');
      const weightTgText = weightTr.find('td').eq(1).text().trim().replace('\n', '');
      const minWeights: number[] = weightTgText
        .split('g')
        .filter((g) => g !== '')
        .map((g) => parseInt(g));

      const categorieAs = infoBox.find('th a[title^="Category:"]');

      const preCategories: {
        id: string;
        name: string;
        img?: string;
        title?: string;
        href?: string;
        downloadImageUrl: string;
      }[] = [];
      categorieAs.each((i, e) => {
        const catId = hrefToId($(e).attr('href')?.trim().replace('Category:', ''));
        const name = $(e).attr('title')?.trim().replace('Category:', '');
        const imgSrc = $(e).find('img').attr('src');

        if (name && catId && imgSrc) {
          const downloadImageUrl = this.baseUrl + imgSrc;
          const imgFilename = imgSrc ? `img/${catId}.png` : undefined;

          preCategories.push({
            id: catId,
            name: name,
            img: imgFilename,
            title: $(e).attr('title'),
            href: this.baseUrl + $(e).attr('href'),
            downloadImageUrl,
          });
        }
      });

      const categories: { id: string; name: string; img?: string; title?: string; href?: string }[] = await Promise.all(
        preCategories.map(async (cat) => {
          if (cat.downloadImageUrl) {
            const downloadFilename = await downloadImage(cat.downloadImageUrl);
            if (downloadFilename && cat.img) {
              const filename = resolve(__dirname, cat.img);
              if (!fs.existsSync(filename)) {
                await copy(downloadFilename, filename);
              }
            }
          }

          return {
            id: cat.id,
            name: cat.name,
            img: cat.img,
            title: cat.title,
            href: cat.href,
          };
        })
      );

      const evolvesFromLi = $('#Evolves_From').closest('h2').next('ul').children('li');
      const evolvesFrom: DigimonDataEvolveElement[] = [];
      evolvesFromLi.each((i, e) => {
        const id = hrefToId($(e).find('a').attr('href'));
        const title = $(e).find('a').attr('title');
        const canon = $(e).find('b').length > 0;
        if (id && title) {
          const line = $(e)
            .text()
            .trim()
            .replaceAll('\n', '')
            .replaceAll(/\s+/gm, ' ')
            .replaceAll(/\\[[0-9]+\\]/gm, '');

          const note = (() => {
            const matches = line.match(/\\((.*)\\)/);
            if (matches) {
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
            line: line,
          } as DigimonDataEvolveElement);
        }
      });

      const evolvesToLi = $('#Evolves_To').closest('h2').next('ul').children('li');
      const evolvesTo: DigimonDataEvolveElement[] = [];
      evolvesToLi.each((i, e) => {
        const id = hrefToId($(e).find('a').attr('href'));
        const title = $(e).find('a').attr('title');
        const canon = $(e).find('b').length > 0;
        if (id && title) {
          const line = $(e)
            .text()
            .trim()
            .replaceAll('\n', '')
            .replaceAll(/\s+/gm, ' ')
            .replaceAll(/\\[[0-9]+\\]/gm, '');

          const note = (() => {
            const matches = line.match(/\\(.*\\)/);
            if (matches) {
              return matches[0].replace(title?.trim(), '').replaceAll(/\\[[A-Z\s]?[0-9]+\\]/g, '');
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

      const id = hrefToId(url.replace(this.baseUrl + '/', ''));
      if (id) {
        const downloadImageUrl = this.baseUrl + img.attr('src');
        const downloadFilename = await downloadImage(downloadImageUrl);
        const imgFilename = `img/${id.replace('/', '')}.png`;
        if (downloadFilename) {
          const filename = resolve(__dirname, imgFilename);
          if (!fs.existsSync(filename)) {
            await copy(downloadFilename, filename);
          }
        }

        console.info(`Scrapped Digimon: ${name} (${levels}) [${attributes}]`);

        return {
          href: url,
          id: id,
          name,
          names: {}, ///< @TODO: get dub names
          description: descriptionTd
            .text()
            .trim()
            .replace(/'^. Japanese'/, '')
            .replace('⇨ Japanese', ''),
          img: imgFilename,
          imgOrigin: downloadImageUrl,
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
          evolvesFrom: evolvesFrom.filter((evo) => !evo.name.match(/^(Any .*Digimon|Digimon Card Game|Category:)/)),
          evolvesTo: evolvesTo.filter((evo) => !evo.name.match(/^(Any .*Digimon|Digimon Card Game|Category:)/)),
        } as DigimonData;
      }
    }

    return undefined;
  }

  async scrapeDigimonList(url: string) {
    const html = await fetchFromWebOrCache(url, 'l_');

    const $ = cheerio.load(html);

    const ret: { id: string; href: string; name: string }[] = [];
    $('.mw-category-group a').each((i, e) => {
      if ($(e).attr('href') && $(e).attr('title')) {
        ret.push({
          id: hrefToId($(e).attr('href')) ?? '',
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

  const baby1List = flatten(
    await executePromisesWithLimit(
      config.baby1Lists.map((url) => scraper.scrapeDigimonList(url)),
      1
    )
  );

  return baby1List.filter((d) => !d.name.match(/^Baby I$/));
}

async function getBaby2DigimonList() {
  const scraper = new DigimonScraperScraper();

  const baby2List = flatten(
    await executePromisesWithLimit(
      config.baby2Lists.map((url) => scraper.scrapeDigimonList(url)),
      1
    )
  );

  return baby2List.filter((d) => !d.name.match(/^Baby II$/));
}

async function getChildDigimonList() {
  const scraper = new DigimonScraperScraper();

  const childList = flatten(
    await executePromisesWithLimit(
      config.childLists.map((url) => scraper.scrapeDigimonList(url)),
      1
    )
  );

  return childList.filter((d) => !d.name.match(/^Child$/));
}

async function getAdultDigimonList() {
  const scraper = new DigimonScraperScraper();

  const adultList = flatten(
    await executePromisesWithLimit(
      config.adultList.map((url) => scraper.scrapeDigimonList(url)),
      1
    )
  );

  return adultList.filter((d) => !d.name.match(/^Adult$/));
}

async function getPerfectDigimonList() {
  const scraper = new DigimonScraperScraper();

  const perfectList = flatten(
    await executePromisesWithLimit(
      config.perfectList.map((url) => scraper.scrapeDigimonList(url)),
      1
    )
  );

  return perfectList.filter((d) => !d.name.match(/^Perfect$/));
}

async function getUltimateDigimonList() {
  const scraper = new DigimonScraperScraper();

  const ultimateList = flatten(
    await executePromisesWithLimit(
      config.ultimateList.map((url) => scraper.scrapeDigimonList(url)),
      1
    )
  );

  return ultimateList.filter((d) => !d.name.match(/^Ultimate$/));
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
  //console.debug(await scraper.scrapeDigimon('https://wikimon.net/Agumon'));
  //console.debug(await scraper.scrapeDigimon('https://wikimon.net/Agumon_(2006_Anime_Version)'));
  //console.debug(await scraper.scrapeDigimon('https://wikimon.net/Agumon_(Black)_(2006_Anime_Version)'));
  //console.debug(await scraper.scrapeDigimon('https://wikimon.net/Agnimon'));
  //return;

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
      all: filterUnique(
        [...baby1List, ...baby2List, ...childList, ...adultList, ...perfectList, ...ultimateList],
        (a, b) => a.id === b.id
      ),
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
  console.debug(`Before: clean up duplicates: ${db.digimons.length}`);
  db.digimons = filterUnique(db.digimons, (a, b) => a.id === b.id);
  console.debug(`After: clean up duplicates: ${db.digimons.length}`);

  // clean up evols
  db.digimons = db.digimons.map((digimon) => {
    const evolvesFrom = filterUnique(
      digimon.evolvesFrom.filter((evo) => {
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
      }),
      (a, b) => a.id === b.id
    );

    const evolvesTo = filterUnique(
      digimon.evolvesTo.filter((evo) => {
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
      }),
      (a, b) => a.id === b.id
    );

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
  db.lists.ultimate = db.lists.ultimate.filter((d) => {
    const digimon = db.digimons.find((fd) => d.id === fd.id);

    return digimon?.level === 'Ultimate';
  });

  console.info(`Save ${db.digimons.length} Digimons...`);
  saveData('digimon.db', db);
}

main();
