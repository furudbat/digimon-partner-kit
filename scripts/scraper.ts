/* eslint no-console: off */

import { load } from 'cheerio';
import type { Cheerio } from 'cheerio';
import crypto from 'crypto';
import { writeFile } from 'fs/promises';
import { AssertionError } from 'node:assert';
import { dirname, resolve } from 'path';
import { getRandom } from 'random-useragent';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import { finished } from 'node:stream/promises'; // Use the promises subpath
import { Readable } from 'node:stream';
import fs, { createWriteStream, existsSync, mkdirSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const POLITE = true;
// don't check for 304, just assume cached is always right
const ALWAYS_USE_CACHED = false;
const CAT_ALWAYS_USE_CACHED = true;
const FORCE_DOWNLOAD_IMAGES = false; // try to re-download images or update final image from cache (ALWAYS_USE_CACHED)
const REDOWNLOAD_LIST = false;
// Crawl-delay: 60

// for testing
const TESTING = false;
const ONLY_BUILD_DB = false;
const start_position = 0;

function assert(condition: boolean, msg?: string): asserts condition {
  if (!condition) {
    throw new AssertionError({ message: msg ?? '' });
  }
}

function logInfo(...args: any[]) {
  const timestamp = new Date().toISOString();
  console.info(`[${timestamp}]`, ...args);
}

const config = {
  wikimonUrl: 'https://wikimon.net',
  baby1Lists: ['https://wikimon.net/Category:Baby_I_Level'],
  baby2Lists: ['https://wikimon.net/Category:Baby_II_Level'],
  childLists: [
    'https://wikimon.net/Category:Child_Level',
    'https://wikimon.net/index.php?title=Category:Child_Level&pagefrom=Snow+Goburimon#mw-pages',
  ],
  adultLists: [
    'https://wikimon.net/index.php?title=Category:Adult_Level',
    'https://wikimon.net/index.php?title=Category:Adult_Level&pagefrom=Lianpumon#mw-pages',
    'https://wikimon.net/index.php?title=Category:Adult_Level&pagefrom=Whamon#mw-pages',
  ],
  perfectLists: [
    'https://wikimon.net/Category:Perfect_Level',
    'https://wikimon.net/index.php?title=Category:Perfect_Level&pagefrom=Matadrmon#mw-pages',
  ],
  ultimateLists: [
    'https://wikimon.net/Category:Ultimate_Level',
    'https://wikimon.net/index.php?title=Category:Ultimate_Level&pagefrom=Hi+Andromon#mw-pages',
    'https://wikimon.net/index.php?title=Category:Ultimate_Level&pagefrom=Skull+Mammon#mw-pages',
  ],
};

const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);

function getBaseHeaders() {
  return {
    'User-Agent': POLITE
      ? 'digimon-partner-kit-scrapper/1.2 (+https://furudbat.github.io/digimon-partner-kit)'
      : getRandom(),
    'Accept-Language': 'en-US,en;q=0.9',
    Referer: config.wikimonUrl,
  };
}
async function getMetaData(metaFile: string): Promise<{ etag: string; lastModified: string } | undefined> {
  if (fs.existsSync(metaFile)) {
    return JSON.parse(await readFileAsync(metaFile, 'utf8'));
  }

  return undefined;
}
async function getHeaders(metaFile: string, ignoreCache = false) {
  const headers: Record<string, string> = getBaseHeaders();
  if (!ignoreCache && fs.existsSync(metaFile)) {
    const meta = JSON.parse(await readFileAsync(metaFile, 'utf8'));
    if (meta.etag) headers['If-None-Match'] = meta.etag;
    if (meta.lastModified) headers['If-Modified-Since'] = meta.lastModified;
  }

  return headers;
}

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

async function asyncRandomSleep(minMs: number, maxMs: number) {
  return new Promise((resolve) => setTimeout(resolve, getRandomValue(minMs, maxMs)));
}

async function executePromisesWithLimit<T>(factories: Array<() => Promise<T>>, limit: number): Promise<T[]> {
  let index = 0;
  const results: T[] = [];

  const executeBatch = async (): Promise<void> => {
    const batch = factories.slice(index, index + limit);
    index += limit;

    const executing = batch.map((factory) => {
      return new Promise<void>((resolve, reject) => {
        setTimeout(
          () => {
            factory()
              .then((result) => {
                results.push(result);
                resolve();
              })
              .catch(reject);
          },
          getRandomValue(50, 230)
        );
      });
    });

    return Promise.allSettled(executing).then(() => {
      if (index < factories.length) {
        return executeBatch();
      }
    });
  };

  await executeBatch();

  return results;
}

type SafeRequestOptions = {
  polite?: boolean;
};

async function safeRequest(
  url: string,
  fn: () => Promise<Response>, // Changed to expect a Fetch Response
  options: SafeRequestOptions = {},
  retries: number = 3
): Promise<Response | null> {
  const { polite } = { polite: POLITE, ...options };

  try {
    console.debug(`----safeRequest (${retries})... ${url}`);

    const response = await fn();

    // Fetch does not throw on 4xx/5xx, so we handle them here
    if (!response.ok) {
      const status = response.status;

      // Rate limited (429) or Server Error (500+)
      if (retries > 0 && (status === 429 || status >= 500)) {
        const wait = polite ? 60 * 1000 : getRandomValue(3000, 7000);
        console.warn(`-----Status ${status}, retrying after ${wait}ms...`);

        await asyncRandomSleep(wait, wait + 2000);

        return safeRequest(url, fn, options, retries - 1);
      }

      // Not Found (404)
      if (status === 404) {
        console.warn(`-----Not Found: ${url}`);
        const wait = getRandomValue(3000, 7000);
        console.warn(`-----waiting ${wait}ms before returning null...`);

        await asyncRandomSleep(wait, wait + 2000);

        return null;
      }

      // Throw for other non-ok statuses to hit the catch block
      throw new Error(`Request failed with status ${status}`);
    }

    return response;
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('-----Fetch/Network error message:', err.message);
    }

    // If it's a network error and we have retries left, you could add retry logic here too
    if (retries > 0) {
      console.warn('-----Network error encountered, retrying...');
      await asyncRandomSleep(3000, 5000);

      return safeRequest(url, fn, options, retries - 1);
    }

    throw err;
  }
}

async function isPng(filePath: string): Promise<boolean> {
  try {
    const metadata = await sharp(filePath).metadata();

    return metadata.format === 'png';
  } catch {
    // Could not read file as image, treat as not PNG
    return false;
  }
}

export function isAllowedUrl(url: string) {
  // disallow /Special: and any /index.php? query pages
  try {
    const u = new URL(url);
    if (u.pathname.startsWith('/Special:')) return false;
    if (u.pathname === '/index.php' && u.search && u.search.length > 0) return false;
    // otherwise allowed

    return true;
  } catch {
    return false;
  }
}

type FetchFromWebOrCacheOptions = {
  prefix?: string;
  ignoreCache?: boolean;
  forceCache?: boolean;
};
async function fetchFromWebOrCache(
  url: string,
  options: FetchFromWebOrCacheOptions = {}
): Promise<{ content: string | null; cached: boolean; status: number | undefined } | undefined> {
  let { prefix, ignoreCache, forceCache } = {
    prefix: undefined,
    ignoreCache: false,
    forceCache: false,
    ...options,
  };

  const hash = crypto.createHash('sha256').update(url).digest('hex');
  const cacheDir = resolve(__dirname, '.cache');
  if (!existsSync(cacheDir)) mkdirSync(cacheDir);

  const metaFile = resolve(cacheDir, `${prefix || ''}${hash}.meta.json`);
  const htmlFile = resolve(cacheDir, `${prefix || ''}${hash}.html`);

  const headers: Record<string, string> = await getHeaders(metaFile, ignoreCache);

  if (forceCache) {
    if (fs.existsSync(htmlFile)) {
      logInfo(`----Using cache: [${hash}] (${url})`);

      return { content: await readFileAsync(htmlFile, 'utf8'), cached: true, status: undefined };
    }
    console.error(`----Cached file for ${url} not found`);

    return { content: null, cached: false, status: undefined };
  }

  if (ignoreCache || !fs.existsSync(htmlFile)) {
    try {
      console.debug(`--Download HTML... ${url}`);

      // Note: safeRequest now receives a Fetch call
      let response = await safeRequest(url, () => fetch(url, { headers }));

      if (response?.status === 304) {
        logInfo(`--304 Not Modified, using cache (${url})`);
        if (!fs.existsSync(htmlFile)) {
          const newHeaders = await getHeaders(metaFile, false);
          response = await safeRequest(url, () => fetch(url, { headers: newHeaders }));

          if (POLITE) {
            const wait = getRandomValue(5 * 1000, 7 * 1234);
            logInfo(`---Polite wait ${wait}ms...`);

            await asyncRandomSleep(wait, wait + 1000);
          }
        } else {
          const savedMeta = await getMetaData(metaFile);
          const newMeta = {
            etag: response.headers.get('etag') || (savedMeta?.etag ?? ''),
            lastModified: response.headers.get('last-modified') || (savedMeta?.lastModified ?? ''),
          };
          if (savedMeta && (savedMeta.etag !== newMeta.etag || savedMeta.lastModified !== newMeta.lastModified)) {
            ignoreCache = true;
          } else {
            return { content: await readFileAsync(htmlFile, 'utf8'), cached: true, status: response.status };
          }
        }
      }

      if (response?.status === 200) {
        const text = await response.text();
        await writeFileAsync(htmlFile, text, 'utf8');
        await writeFileAsync(
          metaFile,
          JSON.stringify(
            {
              etag: response.headers.get('etag'),
              lastModified: response.headers.get('last-modified'),
            },
            null,
            2
          )
        );
        logInfo(`--Cached saved: [${hash}] (${url}) -- ${response.headers.get('last-modified')}`);

        if (POLITE) {
          const wait = getRandomValue(60 * 1000, 60 * 1234);
          logInfo(`---Polite wait ${wait}ms...`);

          await asyncRandomSleep(wait, wait + 2000);
        }

        return { content: text, cached: false, status: response?.status };
      } else {
        return { content: null, cached: false, status: response?.status };
      }
    } catch (err) {
      console.warn(`Error fetching ${url}, fallback to cache`, err);
    }
  }

  // Final fallback to disk
  if (!ignoreCache && fs.existsSync(htmlFile)) {
    return { content: await readFileAsync(htmlFile, 'utf8'), cached: true, status: undefined };
  }

  return { content: null, cached: false, status: 404 };
}

type DownloadImageOptions = {
  ignoreCache?: boolean;
  forceCache?: boolean;
  polite?: boolean;
};
async function downloadImage(
  url: string,
  options: DownloadImageOptions = {}
): Promise<{ imgFile: string | null; cached: boolean; status: number | undefined } | undefined> {
  let { ignoreCache, forceCache, polite } = {
    ignoreCache: false,
    forceCache: false,
    polite: POLITE,
    ...options,
  };

  const hash = crypto.createHash('sha256').update(url).digest('hex');
  const cacheDir = resolve(__dirname, '.cache');
  if (!existsSync(cacheDir)) mkdirSync(cacheDir);

  const metaFile = resolve(cacheDir, `i_${hash}.meta.json`);
  const imgFile = resolve(cacheDir, `i_${hash}.png`);
  const headers = await getHeaders(metaFile);

  // 1. Force Cache Logic
  if (forceCache && existsSync(imgFile)) {
    return { imgFile, cached: true, status: undefined };
  }

  // 2. Fetch Logic
  if (ignoreCache || !existsSync(imgFile)) {
    try {
      const response = await safeRequest(url, () => fetch(url, { headers }), { polite }, 5);

      if (!response) throw new Error('No response received');

      // Handle 304 Not Modified
      if (response.status === 304 && existsSync(imgFile)) {
        logInfo(`--304 Not Modified, using cache: ${url}`);

        return { imgFile, cached: true, status: 304 };
      }

      // Handle 200 OK and Stream to Disk
      if (response.status === 200 && response.body) {
        logInfo(`--Image 200 OK, saving: ${imgFile}`);
        const writer = createWriteStream(imgFile);

        // Convert Web Stream to Node Stream and pipe it
        const nodeStream = Readable.fromWeb(response.body as any);
        nodeStream.pipe(writer);

        // Await the promise version of finished to ensure it's fully written to disk
        await finished(writer);

        await writeFileAsync(
          metaFile,
          JSON.stringify(
            {
              etag: response.headers.get('etag'),
              lastModified: response.headers.get('last-modified'),
            },
            null,
            2
          )
        );

        if (POLITE) {
          const wait = getRandomValue(60 * 1000, 60 * 1234);
          logInfo(`---Polite wait ${wait}ms...`);

          await asyncRandomSleep(wait, wait + 2000);
        }

        return { imgFile, cached: false, status: 200 };
      }

      if (response.status === 404) {
        return { imgFile: null, cached: false, status: 404 };
      }
    } catch (err) {
      console.warn(`Error fetching ${url}, checking for fallback...`, err);
    }
  }

  // 3. Fallback to existing file if fetch failed or wasn't needed
  if (existsSync(imgFile)) {
    return { imgFile, cached: true, status: undefined };
  }

  return { imgFile: null, cached: false, status: 404 };
}

type DigimonLevel = 'Baby I' | 'Baby II' | 'Child' | 'Adult' | 'Perfect' | 'Ultimate';
interface DigimonDataEvolveElement {
  id: string;
  name: string;
  url: string;
  canon?: boolean;
  line?: string;

  cites?: { cite: number; text: string }[];
  animes?: string[];
  // @TODO: add proper properties for each device
  [key: string]: any; // Allow the flexible addition of `dm`, `dm20`, etc.
}
interface DigimonData {
  href: string;
  id: string;
  name: string;
  names: Record<string, string>;
  description: string;
  img: string | null;
  imgOrigin: string | null;
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
  xAntibody?: boolean;

  // @TODO: add proper properties for each device
  [key: string]: any; // Allow the flexible addition of `dm`, `dm20`, `evolvesToDm`, etc.
}

interface DigimonListElement {
  id: string;
  href: string;
  name: string;
}
const hrefToId = (href?: string) => {
  if (!href) return undefined;

  let id = decodeURI(href.replace(config.wikimonUrl, ''))
    .trim()
    // replace slashes with underscores
    .replace(/\//g, '')
    // normalize umlauts & accents
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    // remove all quote-like characters
    .replace(/["'‘’“”«»„]/g, '')
    // replace anything not alphanumeric or underscore with underscore
    .replace(/[^a-z0-9_]+/gi, '_')
    // collapse multiple underscores
    .replace(/_+/g, '_')
    // trim underscores
    .replace(/^_+|_+$/g, '');

  // avoid Windows reserved names
  const reserved = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/;
  if (reserved.test(id)) {
    id = `_${id}`;
  }

  return id;
};

interface DigimonVPetData {
  name: string | string[];
}
type VPetDatabaseDevice = 'dm' | 'dm20' | 'dmx' | string;
type VPetDatabase = Record<VPetDatabaseDevice, DigimonVPetData[]>;

// Load V-Pet mapping into memory immediately
const VPET_DB_PATH = resolve(__dirname, 'digimon-vpets.db.json');

async function loadVPetData() {
  if (existsSync(VPET_DB_PATH)) {
    logInfo(`Loading V-Pet database lookup from ${VPET_DB_PATH}...`);
    const vpetRawData: VPetDatabase = JSON.parse(await readFileAsync(VPET_DB_PATH, 'utf8'));
    return vpetRawData ?? {};
  } else {
    console.warn(`Warning: V-Pet database file not found at ${VPET_DB_PATH}. Missing dynamic device parameters.`);
  }

  return {};
}

type ScrapeDigimonOptions = {
  ignoreCache?: boolean;
  forceCache?: boolean;
};
class DigimonScraperScraper {
  readonly baseUrl = config.wikimonUrl;
  position = 0;
  vpetDevices: VPetDatabase | undefined = undefined;

  async scrapeDigimon(url: string, options: ScrapeDigimonOptions = {}): Promise<DigimonData | undefined> {
    let { ignoreCache, forceCache } = {
      ...{ ignoreCache: false, forceCache: false },
      ...options,
    };

    this.vpetDevices = !this.vpetDevices ? await loadVPetData() : this.vpetDevices;

    /// @TODO: extract to functions, make reuse cached digimon from url
    const hash = crypto.createHash('sha256').update(url).digest('hex');
    const cacheResultDir = resolve(__dirname, '.cache/results');
    if (!existsSync(cacheResultDir)) mkdirSync(cacheResultDir);
    const resultFile = resolve(cacheResultDir, `${hash}.json`);
    if (ONLY_BUILD_DB) {
      console.debug(`--- Use cached result ${url}: [${hash}] -- ${resultFile}`);
      if (fs.existsSync(resultFile)) {
        return JSON.parse(await readFileAsync(resultFile, 'utf8'));
      }
      if (TESTING) {
        throw new AssertionError({ message: `no cache found for ${url}` });
      }

      return undefined;
    }

    let result: { content: string | null; cached: boolean; status: number | undefined } | undefined = undefined;
    if (this.position < start_position) {
      logInfo(`Skip Digimon: ${url} ... (${this.position})`);
      result = await fetchFromWebOrCache(url, { ignoreCache: false, forceCache: true });
    } else {
      logInfo(`Scrap Digimon: ${url} ... (${this.position})`);
      if (!isAllowedUrl(url)) {
        throw new Error(`URL disallowed by robots: ${url}`);
      }
      result = await fetchFromWebOrCache(url, { ignoreCache, forceCache });
    }
    const html = result?.content;
    const cached = result?.cached ?? false;
    //console.verbose({result});
    if (!html) return undefined;

    const $ = load(html);

    const no_article = $('#bodyContent .noarticletext');
    const no_article_text = $('#bodyContent .noarticletext p').text().trim();
    if (no_article.length && no_article_text.includes('There is currently no text in this page.')) {
      logInfo(`Not Article found for Digimon: ${url} ... (${this.position})`);

      return undefined;
    }

    const name = $('#firstHeading').text().trim();

    const getInfoFromInfoBox = (infoBox: Cheerio<any>, params: { title?: string; text?: string }) => {
      let ret: string[] = [];

      const tr = ((): Cheerio<any> | undefined => {
        if (params.text && params.title) {
          let ftd: Cheerio<any> | undefined;
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
          let ret: Cheerio<any> | undefined = undefined;
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
      logInfo(`  Parse Digimon: ${url} ...`);

      const altName = name.replace('ä', 'a').replace('ö', 'o').replace('ü', 'u');
      const altName2 = name.replace('ä', 'a').replace('ö', 'o').replace('ü', 'u').replaceAll(' ', '');
      const altName3 = name
        .replaceAll(' ', '_')
        .replaceAll('+', '_')
        .replaceAll("'", '')
        .replaceAll('·', '_')
        .replaceAll('%20', '_')
        .replaceAll('%2B', '_')
        .replaceAll('%27', '')
        .replaceAll('%22', '')
        .replace(':', '_')
        .replace('ä', 'ae')
        .replace('ö', 'oe')
        .replace('ü', 'ue')
        .replaceAll('(', '')
        .replaceAll(')', '')
        .replace('.', '_')
        .replaceAll('__', '_');

      const altNames = [name, name.split(' ')[0], altName, altName2, altName3];
      if (name.includes('(X-Antibody)')) {
        altNames.push(name.split(' ')[0] + 'x');
      }
      if (name.includes('(Black)')) {
        altNames.push(name.split(' ')[0] + ' black');
      }
      if (name.split(' ')[1]) {
        altNames.push(name.split(' ')[0] + ' ' + name.split(' ')[1]);
      }
      /// @TODO: add alt names from v-pets
      // missing names or aliases
      if (name === 'Orgemon') {
        altNames.push('Ogremon');
      }
      if (name === 'Orgemon (X-Antibody)') {
        altNames.push('Ogremon (X-Antibody)');
        altNames.push('Ogremon X');
      }
      if (name === 'JESmon') {
        altNames.push('Jesmon');
      }
      if (name === 'Tunomon') {
        altNames.push('Tsunomon');
      }
      if (name === 'Monochromon') {
        altNames.push('Monchromon');
      }
      if (name === 'Monzaemon') {
        altNames.push('Mozaemon');
      }
      if (name === 'Pukumon') {
        altNames.push('Pakumon');
      }
      if (name === 'Pukumon') {
        altNames.push('Bukamon');
      }
      if (name === 'Metal Greymon') {
        altNames.push('Taichi Metal Greymon');
      }
      if (name === 'Metal Greymon') {
        altNames.push('Taichis Metal Greymon');
      }
      if (name === 'Agumon') {
        altNames.push('Taichis Agumon');
      }
      if (name === 'Greymon') {
        altNames.push('Taichis Greymon');
      }
      if (name === 'War Greymon') {
        altNames.push('Taichis War Greymon');
      }
      if (name === 'Gabumon') {
        altNames.push('Yamatos Gabumon');
      }
      if (name === 'Garurumon') {
        altNames.push('Yamatos Garurumon');
      }
      if (name === 'Metal Garurumon') {
        altNames.push('Yamatos Metal Garurumon');
      }
      if (name === 'Were Garurumon') {
        altNames.push('Yamatos Were Garurumon');
      }
      if (name === 'Pabumon') {
        altNames.push('Bubbmon');
      }
      if (name === 'Saber Leomon') {
        altNames.push('Saberleomon');
      }
      if (name === 'Metal Etemon') {
        altNames.push('Metaletemon');
      }
      if (name === 'Durandamon') {
        altNames.push('Durandramon');
      }
      if (name === 'Herakle Kabuterimon') {
        altNames.push('Herkule Kabuterimon');
      }
      if (name === 'Waru Monzaemon') {
        altNames.push('Waru Mozaemon');
      }
      if (name === 'Beowolfmon') {
        altNames.push('Beowulfmon');
      }
      if (name === 'Manbomon') {
        altNames.push('Mambomon');
      }
      if (name === 'Yukimi Botamon') {
        altNames.push('Yukimibotamon');
      }
      if (name === 'Cho·Hakkaimon') {
        altNames.push('Cho Hakkaimon');
      }
      if (name === 'Cannonbeemon') {
        altNames.push('Cannon Beemon');
      }
      if (name === 'EBEmon') {
        altNames.push('Ebemon');
      }
      if (name === 'EBEmon (X-Antibody)') {
        altNames.push('Ebemon (X-Antibody)');
        altNames.push('Ebemon X');
      }
      if (name === 'JESmon GX') {
        altNames.push('Jesmon GX');
      }
      if (name === 'Keemon') {
        altNames.push('Kiimon');
      }
      if (name === 'Yarmon') {
        altNames.push('Yaamon');
        altNames.push('Yamon');
      }
      if (name === 'Mametyramon') {
        altNames.push('Mame Tyramon');
      }
      if (name === 'Ofanimon') {
        altNames.push('Ophanimon');
      }
      if (name === 'Ofanimon: Falldown Mode') {
        altNames.push('Ophanimon: Falldown Mode');
        altNames.push('Ophanimon Falldown Mode');
      }
      if (name === 'Ophanimon (X-Antibody)') {
        altNames.push('Ophanimon (X-Antibody)');
        altNames.push('Ophanimon X');
      }
      if (name === 'Pteranomon') {
        altNames.push('Pteramon');
        altNames.push('Petranamon');
      }
      if (name === 'Pteranomon (X-Antibody)') {
        altNames.push('Pteramon (X-Antibody)');
        altNames.push('Pteramon X');
        altNames.push('Petranamon (X-Antibody)');
        altNames.push('Petranamon X');
      }
      if (name === 'Ultimate Brachimon') {
        altNames.push('Ultimate Brachiomon');
      }
      if (name === 'Cannonbeemon') {
        altNames.push('Cannon Beemon');
      }
      if (name === 'Omegamon Alter B') {
        altNames.push('Omegamon Alter B');
      }
      if (name === 'Omegamon Alter S') {
        altNames.push('Omegamon Alter S');
      }
      if (name === 'Blucomon') {
        altNames.push('Bulucomon');
      }
      if (name === 'Andiramon') {
        altNames.push('Andiramon (Virus)');
      }
      if (name === 'Andiramon (Deva)') {
        altNames.push('Andiramon (Data)');
      }
      if (name === 'Dark Knightmon') {
        altNames.push('Axe Knightmon');
        altNames.push('AxeKnightmon');
      }
      if (name === 'Burgamon Adult') {
        altNames.push('Burgermon Adult');
        altNames.push('Burgermon (Mama)');
        altNames.push('Burgermon (Papa)');
        altNames.push('Burgamon (Mama)');
        altNames.push('Burgamon (Papa)');
      }
      if (name === 'Trailmon Ball') {
        altNames.push('Diginorimon');
      }
      if (name === 'Gottsumon') {
        altNames.push('Gotsumon');
      }
      if (name === 'Karatuki Numemon') {
        altNames.push('Shell Numemon');
        altNames.push('Karatsuki Numemon');
      }
      if (name === 'Metal Fantomon') {
        altNames.push('Metal Phantomon');
      }
      if (name === 'Fantomon') {
        altNames.push('Phantomon');
      }
      if (name === 'Tyranomon') {
        altNames.push('Tyrannomon');
      }
      if (name === 'Rust Tyranomon') {
        altNames.push('Rust Tyrannomon');
      }
      if (name === 'Metal Tyranomon') {
        altNames.push('Metal Tyrannomon');
      }
      if (name === 'Master Tyranomon') {
        altNames.push('Master Tyrannomon');
      }
      if (name === 'Tyranomon (X-Antibody)') {
        altNames.push('Tyrannomon (X-Antibody)');
        altNames.push('Tyrannomon X');
      }
      if (name === 'Sorcerimon') {
        altNames.push('Sorcermon');
        altNames.push('Sorcerimon');
        altNames.push('Sorcerymon');
        altNames.push('Socerimon');
      }
      if (name === 'Submarimon') {
        altNames.push('Submarimon');
        altNames.push('Submarinemon');
        altNames.push('Sabmarimon');
      }
      if (name === 'Tuchidarumon') {
        altNames.push('Mud Frigimon');
        altNames.push('Chuchidarumon');
        altNames.push('Tsuchidarumon');
      }
      if (name === 'Voltobautamon') {
        altNames.push('Volto Bautamon');
      }

      const is_x_antibody = name.includes('(X-Antibody)');
      if (is_x_antibody) {
        altNames.push(name.replace('(X-Antibody)', '').trim());
      }

      const isAltName = (alt: string, altNames: string[]): boolean => {
        return altNames.some((altName) => alt.toLowerCase().includes(altName.toLowerCase()));
      };
      const isNotAltName = (alt: string, altNames: string[]): boolean => {
        return altNames.every((altName) => !alt.toLowerCase().includes(altName.toLowerCase()));
      };

      console.debug(`    name: ${name} (${altNames})`);

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
      let img = $('#mw-content-text .mw-parser-output table').first().find('.tab-pane a.image img').first();
      if (!img.length) {
        // fallback query for image
        img = infoBox.find('a.image img');
      }

      console.debug(`    infoBox found: ${infoBox.length}`);
      console.debug(`    img found: ${img.length}`);
      for (let i = 0; i < img.length; i++) {
        const e = img[i];
        const src = $(e).attr('src');
        const alt = $(e).attr('alt') ?? '---';
        if (src) {
          console.debug(`        src: ${src} (${alt})`);
        }
      }

      const levels = getInfoFromInfoBox(infoBox, { title: 'Evolution Stage', text: 'Level' });
      const digimonClasses = getInfoFromInfoBox(infoBox, { title: 'Evolution Stage', text: 'Class' });
      const group = getInfoFromInfoBox(infoBox, { title: 'Group' });
      const types = getInfoFromInfoBox(infoBox, { title: 'Type' });
      const attributes = getInfoFromInfoBox(infoBox, { title: 'Attribute' });
      const fields = getInfoFromInfoBox(infoBox, { title: 'Field' });

      console.debug(`    levels found: ${levels.length}`);
      console.debug(`    digimonClasses found: ${digimonClasses.length}`);
      console.debug(`    types found: ${types.length}`);
      console.debug(`    attributes found: ${attributes.length}`);
      console.debug(`    fields found: ${fields.length}`);
      console.debug(`    group found: ${group.length}`);

      //const nameDubs = getInfoFromInfoBox(nameTable, { text: 'Dub:' });

      const weightTr = infoBox.find('td a[title="Weight"]').closest('tr');
      const weightTgText = weightTr.find('td').eq(1).text().trim().replace('\n', '');
      const minWeights: number[] = weightTgText
        .split('g')
        .filter((g) => g !== '')
        .map((g) => parseInt(g));

      const categorieAs = infoBox.find('th a[title^="Category:"]');

      console.debug(`    minWeights found: ${minWeights.length}`);
      console.debug(`        weightTgText: ${weightTgText}`);

      const preCategories: {
        id: string;
        name: string;
        img?: string;
        title?: string;
        href?: string;
        downloadImageUrl: string;
        img2?: string;
      }[] = [];
      categorieAs.each((i, e) => {
        const catId = hrefToId($(e).attr('href')?.trim().replace('Category:', ''));
        const name = $(e).attr('title')?.trim().replace('Category:', '');
        const imgSrc = $(e).find('img').attr('src');

        if (name && catId && imgSrc) {
          const catDownloadImageUrl = this.baseUrl + imgSrc;
          const catImgFilename = imgSrc ? `img/${catId}.png` : undefined;
          const catImgFilename2 = imgSrc ? `img/cat/${catId}.png` : catImgFilename;

          preCategories.push({
            id: catId,
            name: name,
            img: catImgFilename,
            title: $(e).attr('title'),
            href: this.baseUrl + $(e).attr('href'),
            downloadImageUrl: catDownloadImageUrl,
            img2: catImgFilename2,
          });
        }
      });

      const categories: { id: string; name: string; img?: string; title?: string; href?: string }[] = [];
      for (let i = 0; i < preCategories.length; i++) {
        const cat = preCategories[i];
        if (cat.downloadImageUrl) {
          console.debug(`    cat ${cat.name} download image: ${cat.downloadImageUrl}`);
          const imgResult = await downloadImage(cat.downloadImageUrl, {
            ignoreCache,
            forceCache: CAT_ALWAYS_USE_CACHED,
            polite: POLITE || CAT_ALWAYS_USE_CACHED,
          });
          if ((imgResult?.status === 200 || imgResult?.cached) && imgResult?.imgFile && cat.img) {
            const downloadFilename = imgResult?.imgFile;
            const filename = resolve(__dirname, cat.img);
            if (!fs.existsSync(filename) || !(await isPng(filename))) {
              await sharp(downloadFilename).png().toFile(filename);
              console.debug(`    Saved PNG: ${filename}`);
            }
          }
          if ((imgResult?.status === 200 || imgResult?.cached) && imgResult?.imgFile && cat.img2) {
            const downloadFilename = imgResult?.imgFile;
            const filename = resolve(__dirname, cat.img2);
            if (!fs.existsSync(filename) || !(await isPng(filename))) {
              await sharp(downloadFilename).png().toFile(filename);
              console.debug(`    Saved PNG: ${filename}`);
            }
          }
        } else {
          console.warn('no download image url for ' + cat.name);
          if (TESTING) {
            throw new AssertionError({ message: 'no download image url for ' + cat.name });
          }
        }

        categories.push({
          id: cat.id,
          name: cat.name,
          img: cat.img,
          title: cat.title,
          href: cat.href,
        });
      }

      const references = $('ol.references > li[id^="cite_note"]')
        .map((i, li) => ({
          cite: i + 1,
          text: $(li).find('.reference-text').text().trim(),
        }))
        .get();

      const ignoreEvolvesRegex = /^Any .*(Baby|Child|Adult|Perfect|Ultimate|Super).*Digimon/;
      const evolvesFromLi = $('#Evolves_From').closest('h2').next('ul').children('li');
      const evolvesFrom: DigimonDataEvolveElement[] = [];
      evolvesFromLi.each((i, e) => {
        const eid = hrefToId($(e).find('a').attr('href'));
        const etitle = $(e).find('a').attr('title');
        const canon = $(e).find('b').length > 0;
        if (eid && etitle) {
          const ename = etitle.trim();
          const line = $(e)
            .text()
            .trim()
            .replaceAll('\n', '')
            .replaceAll(/\s+/gm, ' ')
            .replaceAll(/\\[[0-9]+\\]/gm, '');

          const note = (() => {
            const matches = line.match(/\\((.*)\\)/);
            if (matches) {
              return matches[0].replace(etitle?.trim(), '').replaceAll(/\\[[0-9]+\\]/g, '');
            }

            return undefined;
          })();

          // skip Card Games
          if (ename.includes('Card Battle Colors and Level') || ename.includes('Card Game Colors and Level')) {
            return;
          }
          if (ignoreEvolvesRegex.test(ename)) {
            return;
          }
          if ($(e).find('a').attr('href')?.includes('/index.php') || ename.includes('(page does not exist')) {
            return;
          }

          const citeNumbers = line
            .replaceAll('\n', '')
            .matchAll(/\[(\d+)\]/g)
            .map((m) => Number(m[1]))
            .toArray();

          const cites = citeNumbers
            .map((n) => references.find((r) => r.cite === n))
            .filter((r): r is { cite: number; text: string } => r !== undefined);

          evolvesFrom.push({
            id: eid,
            name: ename,
            url: this.baseUrl + $(e).find('a').attr('href'),
            canon: canon,
            note: note,
            line: line,
            cites: cites,
          } as DigimonDataEvolveElement);
        }
      });
      console.debug(`    evolvesFrom found: ${evolvesFrom.length}`);

      const evolvesToLi = $('#Evolves_To').closest('h2').next('ul').children('li');
      const evolvesTo: DigimonDataEvolveElement[] = [];
      evolvesToLi.each((i, e) => {
        const eid = hrefToId($(e).find('a').attr('href'));
        const etitle = $(e).find('a').attr('title');
        const canon = $(e).find('b').length > 0;
        if (eid && etitle) {
          const ename = etitle.trim();
          const line = $(e)
            .text()
            .trim()
            .replaceAll('\n', '')
            .replaceAll(/\s+/gm, ' ')
            .replaceAll(/\\[[0-9]+\\]/gm, '');

          const note = (() => {
            const matches = line.match(/\\(.*\\)/);
            if (matches) {
              return matches[0].replace(etitle?.trim(), '').replaceAll(/\\[[A-Z\s]?[0-9]+\\]/g, '');
            }

            return undefined;
          })();

          // skip Card Games
          if (ename.includes('Card Battle Colors and Level') || ename.includes('Card Game Colors and Level')) {
            return;
          }
          if (ignoreEvolvesRegex.test(ename)) {
            return;
          }
          if ($(e).find('a').attr('href')?.includes('/index.php') || ename.includes('(page does not exist')) {
            return;
          }

          const citeNumbers = line
            .matchAll(/\[(\d+)\]/g)
            .map((m) => Number(m[1]))
            .toArray();

          const cites = citeNumbers
            .map((n) => references.find((r) => r.cite === n))
            .filter((r): r is { cite: number; text: string } => r !== undefined);

          evolvesTo.push({
            id: eid,
            name: ename,
            url: this.baseUrl + $(e).find('a').attr('href'),
            canon: canon,
            note: note,
            line: line,
            cites: cites,
          } as DigimonDataEvolveElement);
        }
      });
      console.debug(`    evolvesTo found: ${evolvesTo.length}`);

      const id = hrefToId(url.replace(this.baseUrl + '/', ''));
      if (id) {
        let imgFilename: string | null = null;
        let downloadImageUrl: string | null = null;
        let image_found = false;

        let fallbackDownloadImageUrl: string | null = null;

        // download img artwork
        for (let i = 0; i < img.length; i++) {
          const e = img[i];
          const src = $(e).attr('src');
          const alt = $(e).attr('alt');
          if (!image_found) {
            console.debug(`   get artwork for '${name}' -- ${src}`);
            if (alt && alt.includes('Digimon noimage') && i === 0) {
              image_found = true;
              break;
            }
            if (alt && isNotAltName(alt, altNames)) continue;
            if (src) {
              downloadImageUrl = this.baseUrl + src;
              if (i === 0) fallbackDownloadImageUrl = downloadImageUrl;
              console.debug(`   '${name}' -- ${url} download image: ${downloadImageUrl}`);
              const imgResult = await downloadImage(downloadImageUrl, {
                ignoreCache: !FORCE_DOWNLOAD_IMAGES && ignoreCache,
                forceCache: !FORCE_DOWNLOAD_IMAGES && ALWAYS_USE_CACHED,
                polite: POLITE,
              });

              if (TESTING) {
                console.debug({ imgResult });
              }

              let downloadFilename: string | null = null;
              if ((imgResult?.status === 200 || imgResult?.cached) && imgResult?.imgFile) {
                imgFilename = `img/${id.replace('/', '')}.png`;
                downloadFilename = imgResult?.imgFile ?? null;
                if (downloadFilename && fs.existsSync(downloadFilename)) {
                  const filename = resolve(__dirname, imgFilename);
                  if (FORCE_DOWNLOAD_IMAGES || !fs.existsSync(filename) || !(await isPng(filename))) {
                    await sharp(downloadFilename).png().toFile(filename);
                    console.debug(`    Saved PNG: ${filename}`);
                  }
                }
              }
              if (imgResult?.status === 404 || (!imgResult?.imgFile && !imgResult?.cached)) {
                downloadFilename = null;
                downloadImageUrl = null;
                image_found = false;
              }
              if (downloadFilename) {
                const filename = resolve(__dirname, `img/${id.replace('/', '')}.png`);
                if (fs.existsSync(filename)) {
                  imgFilename = `img/${id.replace('/', '')}.png`;
                }
                downloadImageUrl = this.baseUrl + src;
                image_found = true;
                console.debug(`    Image found for ${name}: ${imgFilename} (${downloadImageUrl})`);
              }
            } else {
              console.warn(`image not found for ${id}`);
              if (TESTING) {
                //console.debug({img});
                throw new AssertionError({ message: `image not found for ${id}` });
              }
            }
          }
        }
        // still no image ?
        if (!image_found) {
          console.debug(`    still no image - img found (${image_found}): ${img.length}`);
          console.debug(`        downloadImageUrl: ${downloadImageUrl}`);
          for (let i = 0; i < img.length; i++) {
            const e = img[i];
            const src = $(e).attr('src');
            const alt = $(e).attr('alt') ?? '---';
            if (src) {
              console.debug(`        src: ${src} (${alt})`);
            }

            if (!image_found) {
              if (alt && isAltName(alt, altNames)) {
                if (src) {
                  console.debug(`   get artwork for '${name}'`);
                  const newDownloadImageUrl =
                    this.baseUrl + src.replace(/^\/images\/thumb(.*?)([^/]+)\/[^/]+$/, '/images$1$2');
                  console.debug(`   '${name}' -- ${url} download image: ${newDownloadImageUrl}`);
                  const imgResult = await downloadImage(newDownloadImageUrl, {
                    ignoreCache: !FORCE_DOWNLOAD_IMAGES && ignoreCache,
                    forceCache: !FORCE_DOWNLOAD_IMAGES && ALWAYS_USE_CACHED,
                    polite: POLITE,
                  });

                  if (TESTING) {
                    console.debug({ imgResult });
                  }

                  let downloadFilename: string | null = null;
                  if ((imgResult?.status === 200 || imgResult?.cached) && imgResult?.imgFile) {
                    imgFilename = `img/${id.replace('/', '')}.png`;
                    downloadFilename = imgResult?.imgFile ?? null;
                    if (downloadFilename && fs.existsSync(downloadFilename)) {
                      const filename = resolve(__dirname, imgFilename);
                      if (FORCE_DOWNLOAD_IMAGES || !fs.existsSync(filename) || !(await isPng(filename))) {
                        await sharp(downloadFilename).png().toFile(filename);
                        console.debug(`    Saved PNG: ${filename}`);
                      }
                    }

                    if (downloadFilename) {
                      const filename = resolve(__dirname, `img/${id.replace('/', '')}.png`);
                      if (fs.existsSync(filename)) {
                        imgFilename = `img/${id.replace('/', '')}.png`;
                      }
                      downloadImageUrl = newDownloadImageUrl;
                      image_found = true;
                      console.debug(`    Image found for ${name}: ${imgFilename} (${downloadImageUrl}) -- 2. try`);
                    }
                  }
                  if (imgResult?.status === 404 || (!imgResult?.imgFile && !imgResult?.cached)) {
                    downloadFilename = null;
                    downloadImageUrl = null;
                    image_found = false;
                  }
                }
              }
            }
          }
        }
        if (!image_found) {
          console.debug(`    STILL no image - img found (${image_found}): ${img.length}`);
          console.debug(`        downloadImageUrl: ${downloadImageUrl}`);
          img = $('#mw-content-text .mw-parser-output > table .tab-pane a.image img').first();
          for (let i = 0; i < img.length; i++) {
            const e = img[i];
            const src = $(e).attr('src');
            const alt = $(e).attr('alt') ?? '---';
            if (src) {
              console.debug(`        src: ${src} (${alt})`);
            }

            if (TESTING) {
              console.debug({ downloadImageUrl, alt, altNames, is: isAltName(alt, altNames) });
            }

            if (!image_found) {
              if (alt && isAltName(alt, altNames)) {
                if (src) {
                  console.debug(`   get artwork for '${name}'`);
                  const newDownloadImageUrl =
                    this.baseUrl + src.replace(/^\/images\/thumb(.*?)([^/]+)\/[^/]+$/, '/images$1$2');
                  console.debug(`   '${name}' -- ${url} download image: ${newDownloadImageUrl}`);
                  const imgResult = await downloadImage(newDownloadImageUrl, {
                    ignoreCache: !FORCE_DOWNLOAD_IMAGES && ignoreCache,
                    forceCache: !FORCE_DOWNLOAD_IMAGES && ALWAYS_USE_CACHED,
                    polite: POLITE,
                  });

                  if (TESTING) {
                    console.debug({ imgResult });
                  }

                  let downloadFilename: string | null = null;
                  if ((imgResult?.status === 200 || imgResult?.cached) && imgResult?.imgFile) {
                    imgFilename = `img/${id.replace('/', '')}.png`;
                    downloadFilename = imgResult?.imgFile ?? null;
                    if (downloadFilename && fs.existsSync(downloadFilename)) {
                      const filename = resolve(__dirname, imgFilename);
                      if (FORCE_DOWNLOAD_IMAGES || !fs.existsSync(filename) || !(await isPng(filename))) {
                        await sharp(downloadFilename).png().toFile(filename);
                        console.debug(`    Saved PNG: ${filename}`);
                      }
                    }
                    if (downloadFilename) {
                      const filename = resolve(__dirname, `img/${id.replace('/', '')}.png`);
                      if (fs.existsSync(filename)) {
                        imgFilename = `img/${id.replace('/', '')}.png`;
                      }
                      downloadImageUrl = newDownloadImageUrl;
                      image_found = true;
                      console.debug(`    Image found for ${name}: ${imgFilename} (${downloadImageUrl}) -- 3. try`);
                    }
                  }
                  if (imgResult?.status === 404 || (!imgResult?.imgFile && !imgResult?.cached)) {
                    downloadFilename = null;
                    downloadImageUrl = null;
                    image_found = false;
                  }
                }
              }
            }
          }
        }

        if (!image_found && fallbackDownloadImageUrl) {
          console.debug(`    STILL NO image - img found (${image_found})`);
          console.debug(`        downloadImageUrl: ${downloadImageUrl}`);
          console.debug(`   get artwork for '${name}' -- ${fallbackDownloadImageUrl}`);
          console.debug(`   '${name}' -- ${url} download image: ${fallbackDownloadImageUrl}`);

          const imgResult = await downloadImage(fallbackDownloadImageUrl, {
            ignoreCache: !FORCE_DOWNLOAD_IMAGES && ignoreCache,
            forceCache: !FORCE_DOWNLOAD_IMAGES && (!cached || ALWAYS_USE_CACHED),
            polite: POLITE || cached,
          });

          if (TESTING) {
            console.debug({ imgResult });
          }

          let downloadFilename: string | null = null;
          if ((imgResult?.status === 200 || imgResult?.cached) && imgResult?.imgFile) {
            imgFilename = `img/${id.replace('/', '')}.png`;
            downloadFilename = imgResult?.imgFile ?? null;
            if (downloadFilename && fs.existsSync(downloadFilename)) {
              const filename = resolve(__dirname, imgFilename);
              if (FORCE_DOWNLOAD_IMAGES || !fs.existsSync(filename) || !(await isPng(filename))) {
                await sharp(downloadFilename).png().toFile(filename);
                console.debug(`    Saved PNG: ${filename}`);
              }
            }
          }
          if (imgResult?.status === 404 || (!imgResult?.imgFile && !imgResult?.cached)) {
            downloadFilename = null;
            downloadImageUrl = null;
            image_found = false;
          }
          if (downloadFilename) {
            const filename = resolve(__dirname, `img/${id.replace('/', '')}.png`);
            if (fs.existsSync(filename)) {
              imgFilename = `img/${id.replace('/', '')}.png`;
            }
            downloadImageUrl = fallbackDownloadImageUrl;
            image_found = true;
            console.debug(`    Image found for ${name}: ${imgFilename} (${downloadImageUrl})`);
          }
        }

        if (!downloadImageUrl || !image_found) {
          const filename = resolve(__dirname, `img/${id.replace('/', '')}.png`);
          if (fs.existsSync(filename)) {
            imgFilename = `img/${id.replace('/', '')}.png`;
            image_found = true;
          } else {
            imgFilename = null;
          }
        }
        if (TESTING) {
          if (!image_found) {
            throw new AssertionError({ message: `image not found for ${url} (${id}): ${downloadImageUrl}` });
          }
        }

        logInfo(`Scrapped Digimon: ${name} (${levels}) [${attributes}]`);

        const extraVpetProperties: Record<string, any> = {};
        if (this.vpetDevices) {
          for (const [device, vpets] of Object.entries(this.vpetDevices)) {
            // Generate title-cased key name: e.g., evolvesToDm20
            const titleDevice = device.charAt(0).toUpperCase() + device.slice(1);
            extraVpetProperties[`evolvesTo${titleDevice}`] = evolvesTo
              .map(({ id, name, url }) => ({ id, name, url }))
              .filter((vet) => {
                return vpets.find((vpd) => vpd.name === vet.name);
              });

            // Set device match flag: e.g., "dm": true
            extraVpetProperties[device] = extraVpetProperties[`evolvesTo${titleDevice}`].length > 0;
          }
        }

        const evolvesExtend = (evolves: DigimonDataEvolveElement[]): DigimonDataEvolveElement[] => {
          const animeRegex =
            /^(Digimon Adventure|Digimon Adventure 02|Digimon Adventure tri\.|Digimon Tamers|Digimon Frontier|Digimon Data Squad|Digimon Fusion|Digimon Ghost Game|Digimon Beatbreak):/;

          return evolves.map((evol) => {
            const is_x_antibody = evol.name.includes('(X-Antibody)');
            const norm_name = evol.name.replace('(X-Antibody)', 'X');
            const norm_id = evol.id.replace('X_Antibody', 'X');

            return {
              ...evol,
              animes: Array.from(
                new Set(
                  evol.cites
                    ?.map((cit) => cit.text.match(animeRegex)?.[1])
                    .filter((anime): anime is string => !!anime) ?? []
                )
              ),

              dm: !!extraVpetProperties?.evolvesToDm?.find((e: { id: string; name: string }) => e.id === evol.id),
              dm20: !!extraVpetProperties?.evolvesToDm20?.find((e: { id: string; name: string }) => e.id === evol.id),
              dmx: !!extraVpetProperties?.evolvesToDmx?.find(
                (e: { id: string; name: string }) => e.id === evol.id || norm_name === e.name || norm_id === e.id
              ),
              dmc: !!extraVpetProperties?.evolvesToDmc?.find((e: { id: string; name: string }) => e.id === evol.id),
              pen: !!extraVpetProperties?.evolvesToPen?.find((e: { id: string; name: string }) => e.id === evol.id),
              pen20: !!extraVpetProperties?.evolvesToPen20?.find((e: { id: string; name: string }) => e.id === evol.id),
            };
          });
        };

        const evolvesFromExt = evolvesExtend(
          evolvesFrom.filter((evo) => !evo.name.match(/^(Any .*Digimon|Digimon Card Game|Category:)/))
        );
        const evolvesToExt = evolvesExtend(
          evolvesTo.filter((evo) => !evo.name.match(/^(Any .*Digimon|Digimon Card Game|Category:)/))
        );

        const ret = {
          href: url,
          id: id,
          name,
          altNames,
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
          evolvesFrom: evolvesFromExt,
          evolvesTo: evolvesToExt,
          xAntibody: is_x_antibody,
          ...extraVpetProperties,
        } as DigimonData;

        const resultFileAlt = resolve(cacheResultDir, `${id.replace('/', '')}.json`);
        await writeFileAsync(resultFile, JSON.stringify(ret));
        await writeFileAsync(resultFileAlt, JSON.stringify(ret, null, 2));
        logInfo(`  Save Digimon: ${name} -- [${resultFile}] (${resultFileAlt})`);

        this.position++;
        return ret;
      }
    }

    this.position++;

    return undefined;
  }

  async scrapeDigimonList(url: string, id: string): Promise<DigimonListElement[]> {
    const hash = crypto.createHash('sha256').update(url).digest('hex');
    const cacheResultDir = resolve(__dirname, '.cache/results');
    if (!existsSync(cacheResultDir)) mkdirSync(cacheResultDir);
    const resultFile = resolve(cacheResultDir, `l_${hash}.json`);
    if (ONLY_BUILD_DB) {
      console.debug(`--- Use cached result ${url} (${id}): [${hash}] -- ${resultFile}`);
      if (fs.existsSync(resultFile)) {
        return JSON.parse(await readFileAsync(resultFile, 'utf8'));
      }
      if (TESTING) {
        throw new AssertionError({ message: `no cache found for ${url} (${id})` });
      }

      return [];
    }

    const result = await fetchFromWebOrCache(url, {
      prefix: 'l_',
      ignoreCache: REDOWNLOAD_LIST,
      forceCache: !REDOWNLOAD_LIST && ALWAYS_USE_CACHED,
    });
    const html = result?.content;
    //const cached = result?.cached ?? false;
    if (!html) return [];

    const $ = load(html);

    const ret: DigimonListElement[] = [];
    $('.mw-category-group a').each((i, e) => {
      if ($(e).attr('href') && $(e).attr('title')) {
        ret.push({
          id: hrefToId($(e).attr('href')) ?? '',
          href: this.baseUrl + $(e).attr('href'),
          name: $(e).attr('title')?.trim() ?? '',
        });
      }
    });

    const resultFileAlt = resolve(cacheResultDir, `${id.replace('/', '')}.json`);
    await writeFileAsync(resultFile, JSON.stringify(ret));
    await writeFileAsync(resultFileAlt, JSON.stringify(ret, null, 2));
    logInfo(`  Save Digimon List: ${id} -- [${resultFile}] (${resultFileAlt})`);

    return ret;
  }
}

async function getBaby1DigimonList() {
  const scraper = new DigimonScraperScraper();

  const tasks = config.baby1Lists.map((url) => () => scraper.scrapeDigimonList(url, 'Baby I'));
  const results = await executePromisesWithLimit<DigimonListElement[]>(tasks, 1);

  const baby1List = flatten(results);

  return baby1List.filter((d) => !d.name.match(/^Baby I$/));
}

async function getBaby2DigimonList() {
  const scraper = new DigimonScraperScraper();

  const tasks = config.baby2Lists.map((url) => () => scraper.scrapeDigimonList(url, 'Baby II'));
  const results = await executePromisesWithLimit<DigimonListElement[]>(tasks, 1);

  const baby2List = flatten(results);

  return baby2List.filter((d) => !d.name.match(/^Baby II$/));
}

async function getChildDigimonList() {
  const scraper = new DigimonScraperScraper();

  const tasks = config.childLists.map((url) => () => scraper.scrapeDigimonList(url, 'Child'));
  const results = await executePromisesWithLimit<DigimonListElement[]>(tasks, 1);

  const childList = flatten(results);

  return childList.filter((d) => !d.name.match(/^Child$/));
}

async function getAdultDigimonList() {
  const scraper = new DigimonScraperScraper();

  const tasks = config.adultLists.map((url) => () => scraper.scrapeDigimonList(url, 'Adult'));
  const results = await executePromisesWithLimit<DigimonListElement[]>(tasks, 1);

  const adultList = flatten(results);

  return adultList.filter((d) => !d.name.match(/^Adult$/));
}

async function getPerfectDigimonList() {
  const scraper = new DigimonScraperScraper();

  const tasks = config.perfectLists.map((url) => () => scraper.scrapeDigimonList(url, 'Perfect'));
  const results = await executePromisesWithLimit<DigimonListElement[]>(tasks, 1);

  const perfectList = flatten(results);

  return perfectList.filter((d) => !d.name.match(/^Perfect$/));
}

async function getUltimateDigimonList() {
  const scraper = new DigimonScraperScraper();

  const tasks = config.ultimateLists.map((url) => () => scraper.scrapeDigimonList(url, 'Ultimate'));
  const results = await executePromisesWithLimit<DigimonListElement[]>(tasks, 1);

  const ultimateList = flatten(results);

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

  {
    const cacheResultDir = resolve(__dirname, '.cache/results');
    if (!existsSync(cacheResultDir)) mkdirSync(cacheResultDir);
  }
  {
    const imgResultDir = resolve(__dirname, 'img');
    if (!existsSync(imgResultDir)) mkdirSync(imgResultDir);
  }
  {
    const imgResultDir = resolve(__dirname, 'img/cat');
    if (!existsSync(imgResultDir)) mkdirSync(imgResultDir);
  }

  if (TESTING) {
    /*
    console.debug(await scraper.scrapeDigimon('https://wikimon.net/Agumon'));
    console.debug(await scraper.scrapeDigimon('https://wikimon.net/Agumon_(2006_Anime_Version)'));
    console.debug(await scraper.scrapeDigimon('https://wikimon.net/Agumon_(Black)_(2006_Anime_Version)'));
    console.debug(await scraper.scrapeDigimon('https://wikimon.net/Agnimon'));
    console.debug(await scraper.scrapeDigimon('https://wikimon.net/Xuanwumon'));
    await asyncRandomSleep(2025, 5125);
    console.debug(await scraper.scrapeDigimon('https://wikimon.net/Agumon', { ignoreCache: !ALWAYS_USE_CACHED }));
    await asyncRandomSleep(2026, 5125);
    console.debug(
      await scraper.scrapeDigimon('https://wikimon.net/Cherubimon_(Virtue)', { ignoreCache: !ALWAYS_USE_CACHED })
    );
    await asyncRandomSleep(3254, 4523);
    console.debug(
      await scraper.scrapeDigimon('https://wikimon.net/Unnamed_Trailmon_1', { ignoreCache: !ALWAYS_USE_CACHED })
    );
    await asyncRandomSleep(1234, 4567);
    console.debug(await scraper.scrapeDigimon('https://wikimon.net/L%C3%B6wemon', { ignoreCache: !ALWAYS_USE_CACHED }));
    await asyncRandomSleep(2468, 5461);
    console.debug(
      await scraper.scrapeDigimon('https://wikimon.net/Herakle_Kabuterimon', { ignoreCache: !ALWAYS_USE_CACHED })
    );
    await asyncRandomSleep(1234, 4567);
    console.debug(await scraper.scrapeDigimon('https://wikimon.net/Zino_Garurumon'));
    await asyncRandomSleep(1234, 4567);
    console.debug(await scraper.scrapeDigimon('https://wikimon.net/Agumon_(X-Antibody)'));
    await asyncRandomSleep(4536, 5642);

    console.debug(await scraper.scrapeDigimon('https://wikimon.net/Algomon_(Baby_I)'));
    await asyncRandomSleep(3124, 3875);
    console.debug(await scraper.scrapeDigimon('https://wikimon.net/Yggdrasill_7D6'));
    await asyncRandomSleep(1234, 2436);

    console.debug(await scraper.scrapeDigimon('https://wikimon.net/Bombmon'));
    await asyncRandomSleep(5462, 6423);
    console.debug(await scraper.scrapeDigimon('https://wikimon.net/Algomon_(Baby_II)'));
    await asyncRandomSleep(5462, 6423);
    console.debug(await scraper.scrapeDigimon('https://wikimon.net/Kodokugumon_Baby'));
    await asyncRandomSleep(5462, 6423);
    console.debug(await scraper.scrapeDigimon('https://wikimon.net/Tokomon_(X-Antibody)'));
    await asyncRandomSleep(5462, 6423);
    console.debug(await scraper.scrapeDigimon('https://wikimon.net/Baalmon'));
    await asyncRandomSleep(2134, 3214);
    console.debug(await scraper.scrapeDigimon('https://wikimon.net/Magna_Garurumon'));
    await asyncRandomSleep(2134, 6845);

    console.debug(await scraper.scrapeDigimon('https://wikimon.net/Andiramon'));
    await asyncRandomSleep(4213, 5487);
    console.debug(await scraper.scrapeDigimon('https://wikimon.net/Super_Dark_Knightmon'));
    await asyncRandomSleep(1489, 2145);
    console.debug(await scraper.scrapeDigimon('https://wikimon.net/Enbarrmon'));
    await asyncRandomSleep(3467, 6452);
    console.debug(await scraper.scrapeDigimon('https://wikimon.net/Cannonbeemon'));
    await asyncRandomSleep(3467, 6452);
    console.debug(await scraper.scrapeDigimon('https://wikimon.net/Beowolfmon'));
    await asyncRandomSleep(1234, 7896);
    console.debug(await scraper.scrapeDigimon('https://wikimon.net/Aldamon'));
    await asyncRandomSleep(3452, 2341);
    console.debug(await scraper.scrapeDigimon('https://wikimon.net/Leomon'));
    await asyncRandomSleep(3214, 4512);
    console.debug(await scraper.scrapeDigimon('https://wikimon.net/Fuukashita_Medal'));
    await asyncRandomSleep(1243, 3124);
    */

    /*
    console.debug(await scraper.scrapeDigimon('https://wikimon.net/Angemon'));
    await asyncRandomSleep(3241, 4582);
    */

    console.debug(await scraper.scrapeDigimon('https://wikimon.net/Agumon'));

    return;
  }

  const baby1List = await getBaby1DigimonList();
  logInfo(`Get Baby I Digimon List: ${baby1List.length}`);

  await asyncRandomSleep(1234, 4567);
  const baby2List = await getBaby2DigimonList();
  logInfo(`Get Baby II Digimon List: ${baby2List.length}`);

  await asyncRandomSleep(1100, 4861);
  const childList = await getChildDigimonList();
  logInfo(`Get Child Digimon List: ${childList.length}`);

  await asyncRandomSleep(2356, 8745);
  const adultList = await getAdultDigimonList();
  logInfo(`Get Adult Digimon List: ${adultList.length}`);

  await asyncRandomSleep(3254, 3652);
  const perfectList = await getPerfectDigimonList();
  logInfo(`Get Perfect Digimon List: ${perfectList.length}`);

  await asyncRandomSleep(5684, 6543);
  const ultimateList = await getUltimateDigimonList();
  logInfo(`Get Ultimate Digimon List: ${ultimateList.length}`);

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
  logInfo(`Load ${allDigimonUrls.length} Digimons...`);

  const loadSlice = async (start: number, end: number) => {
    const slice = allDigimonUrls.slice(start, end);
    if (slice.length) {
      const results = await executePromisesWithLimit<DigimonData | undefined>(
        slice.map((d) => async () => scraper.scrapeDigimon(d, { ignoreCache: false, forceCache: ALWAYS_USE_CACHED })),
        POLITE && !ALWAYS_USE_CACHED ? 1 : 5 // concurrency
      );
      db.digimons.push(...(results.filter(Boolean) as DigimonData[]));
    }
  };

  const loadBatch = POLITE ? 1 : 10;
  for (let i = 0; i < allDigimonUrls.length; i += loadBatch) {
    await loadSlice(i, i + loadBatch);
  }

  // load rest/all
  // safer version: only creates at most 2 promises at a time
  const tasks = allDigimonUrls.map(
    (d) => async () => scraper.scrapeDigimon(d, { ignoreCache: false, forceCache: ALWAYS_USE_CACHED })
  );
  const results = await executePromisesWithLimit<DigimonData | undefined>(tasks, POLITE && !ALWAYS_USE_CACHED ? 1 : 5);
  db.digimons.push(...(results.filter(Boolean) as DigimonData[]));

  logInfo('clean up Digimons...');

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

  db.digimons.forEach((d) => {
    if (!d.img) {
      console.warn(`No Image found for '${d.name}': ${d.imgOrigin} -- ${d.href}`);
    }
  });

  logInfo(`Save ${db.digimons.length} Digimons...`);
  saveData('digimon.db', db);
}

main();
