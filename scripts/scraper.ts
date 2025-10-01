/* eslint no-console: off */

import axios from 'axios';
import cheerio from 'cheerio';
import crypto from 'crypto';
import fs, { existsSync, mkdirSync } from 'fs';
import { copy } from 'fs-extra';
import { writeFile } from 'fs/promises';
import { AssertionError } from 'node:assert';
import { dirname, resolve } from 'path';
import { getRandom } from 'random-useragent';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TESTING = true;
const POLITE = true;
// don't check for 304, just assume cached is always right
const ALWAYS_USE_CACHED = true;
const REDOWNLOAD_LIST = true;
// Crawl-delay: 60

const start_position = 0;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function assert(condition: boolean, msg?: string): asserts condition {
  if (!condition) {
    throw new AssertionError({ message: msg ?? '' });
  }
}

const config = {
  wikimonUrl: 'https://wikimon.net',
  baby1Lists: ['https://wikimon.net/Category:Baby_I_Level'],
  baby2Lists: ['https://wikimon.net/Category:Baby_II_Level'],
  childLists: [
    'https://wikimon.net/Category:Child_Level',
    'https://wikimon.net/index.php?title=Category:Child_Level&pagefrom=Spadamon#mw-pages',
  ],
  adultList: [
    'https://wikimon.net/index.php?title=Category:Adult_Level',
    'https://wikimon.net/index.php?title=Category:Adult_Level&pagefrom=Liskmon#mw-pages',
    'https://wikimon.net/index.php?title=Category:Adult_Level&pagefrom=Woodmon#mw-pages',
  ],
  perfectList: [
    'https://wikimon.net/Category:Perfect_Level',
    'https://wikimon.net/index.php?title=Category:Perfect_Level&pagefrom=Mega+Seadramon#mw-pages',
  ],
  ultimateList: [
    'https://wikimon.net/Category:Ultimate_Level',
    'https://wikimon.net/index.php?title=Category:Ultimate_Level&pagefrom=Imperialdramon%3A+Dragon+Mode+%28Black%29#mw-pages',
    'https://wikimon.net/index.php?title=Category:Ultimate_Level&pagefrom=Susanoomon#mw-pages',
  ],
};

const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);

function getBaseHeaders() {
  return {
    'User-Agent': POLITE
      ? 'digimon-partner-kit-scrapper/1.1 (+https://furudbat.github.io/digimon-partner-kit)'
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

type SafeRequestOptions = {
  polite?: boolean;
};
async function safeRequest<T>(
  url: string,
  fn: () => Promise<T>,
  options: SafeRequestOptions = {},
  retries: number = 3
): Promise<T | null> {
  const { polite } = { ...{ polite: POLITE }, ...options };
  try {
    console.debug(`----safeRequest (${retries})... ${url}`);

    return await fn();
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      console.error('-----Axios error message:', err.message);
      console.error('-----Axios error code:', err.code);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      if (retries > 0 && (err.response?.status === 429 || err.response?.status >= 500)) {
        const wait = polite ? 60 * 1000 : getRandomValue(3000, 7000);
        console.warn(`-----Rate limited, retrying after ${wait}ms...`);

        await asyncRandomSleep(wait, wait + 2000);

        return safeRequest(url, fn, options, retries - 1);
      }

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      if (retries > 0 && err.response?.status === 404) {
        console.warn(`-----Not Found: ${err.config?.url}`);

        const wait = polite ? 60 * 1000 : getRandomValue(3000, 7000);
        console.warn(`-----retrying after ${wait}ms...`);

        await asyncRandomSleep(wait, wait + 2000);

        return null;
      }
    }
    throw err;
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
  // eslint-disable-next-line prefer-const
  let { prefix, ignoreCache, forceCache } = {
    ...{ prefix: undefined, ignoreCache: false, forceCache: false },
    ...options,
  };
  const hash = crypto.createHash('sha256').update(url).digest('hex');
  const cacheDir = resolve(__dirname, '.cache');
  if (!existsSync(cacheDir)) mkdirSync(cacheDir);

  const metaFile = resolve(cacheDir, `${prefix || ''}${hash}.meta.json`);
  const htmlFile = resolve(cacheDir, `${prefix || ''}${hash}.html`);

  const headers: Record<string, string> = await getHeaders(metaFile, ignoreCache);

  //console.debug({ url, metaFile, htmlFile, ignoreCache, exists: fs.existsSync(htmlFile) });
  if (forceCache) {
    if (!ignoreCache && fs.existsSync(htmlFile)) {
      console.info(`----Using cache: [${hash}] (${url})`);

      if (fs.existsSync(htmlFile)) {
        return { content: await readFileAsync(htmlFile, 'utf8'), cached: true, status: undefined };
      } else {
        console.error(`----Cached file for ${url} not found`);
      }
    }

    return { content: null, cached: false, status: undefined };
  }

  if (ignoreCache || !fs.existsSync(htmlFile)) {
    try {
      console.debug(`--Download HTML... ${url}`);
      let response = await safeRequest(url, () => axios.get(url, { headers, validateStatus: (s) => s < 500 }));
      if (response?.status === 304) {
        console.info(
          `--304 Not Modified, using cache (${url}) -- etag:${headers['If-None-Match']}, lastModified:${headers['If-Modified-Since']}`
        );
        if (!fs.existsSync(htmlFile)) {
          const newHeaders: Record<string, string> = await getHeaders(metaFile, false);
          response = await safeRequest(url, () =>
            axios.get(url, { headers: newHeaders, validateStatus: (s) => s < 500 })
          );
        } else {
          const savedMeta = await getMetaData(metaFile);
          const newMeta = {
            etag: response.headers['etag'] || (savedMeta?.etag ?? ''),
            lastModified: response.headers['last-modified'] || (savedMeta?.lastModified ?? ''),
          };
          if (savedMeta && (savedMeta.etag !== newMeta.etag || savedMeta.lastModified !== newMeta.lastModified)) {
            console.debug(
              `Metadata changed: etag [${savedMeta.etag}] → [${newMeta.etag}], lastModified [${savedMeta.lastModified}] → [${newMeta.lastModified}]`
            );
            ignoreCache = true; // force redownload, invalidated cache
          } else if (savedMeta && fs.existsSync(htmlFile)) {
            // cached content
            return { content: await readFileAsync(htmlFile, 'utf8'), cached: true, status: response.status };
          }
        }
      }
      if (response?.status === 200) {
        await writeFileAsync(htmlFile, response.data, 'utf8');
        await writeFileAsync(
          metaFile,
          JSON.stringify(
            {
              etag: response.headers.etag,
              lastModified: response.headers['last-modified'],
            },
            null,
            2
          )
        );
        console.info(`--Cached saved: [${hash}] (${url}) -- ${response.headers['last-modified']}`);
        if (POLITE) {
          const wait = getRandomValue(60 * 1000, 60 * 1234);
          console.info(`---Polite wait ${wait}ms...`);

          await asyncRandomSleep(wait, wait + 2000);
        }

        return { content: response?.data ?? null, cached: false, status: response.status };
      } else {
        return { content: response?.data ?? null, cached: false, status: response?.status };
      }
    } catch (err) {
      console.warn(`Error fetching ${url}, fallback to cache`);
    }
  }

  if (!ignoreCache && fs.existsSync(htmlFile)) {
    console.info(`----Using cache: [${hash}] (${url})`);

    if (fs.existsSync(htmlFile)) {
      return { content: await readFileAsync(htmlFile, 'utf8'), cached: true, status: undefined };
    } else {
      console.error(`----Cached file for ${url} not found`);
    }
  }

  // Fallback: fresh fetch
  const newHeaders: Record<string, string> = await getHeaders(metaFile, true);
  console.debug(`--Download HTML... ${url}`);
  const response = await safeRequest(url, () =>
    axios.get(url, { headers: newHeaders, validateStatus: (s) => s < 500 })
  );
  if (response?.status === 200) {
    await writeFileAsync(htmlFile, response.data, 'utf8');
    await writeFileAsync(
      metaFile,
      JSON.stringify(
        {
          etag: response.headers.etag,
          lastModified: response.headers['last-modified'],
        },
        null,
        2
      )
    );
  }

  return { content: response?.data ?? null, cached: false, status: response !== null ? response.status : 404 };
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
  // eslint-disable-next-line prefer-const
  let { ignoreCache, forceCache, polite } = {
    ...{ ignoreCache: false, forceCache: false, polite: POLITE },
    ...options,
  };

  const hash = crypto.createHash('sha256').update(url).digest('hex');
  const cacheDir = resolve(__dirname, '.cache');
  if (!existsSync(cacheDir)) mkdirSync(cacheDir);

  const metaFile = resolve(cacheDir, `i_${hash}.meta.json`);
  const imgFile = resolve(cacheDir, `i_${hash}.png`);

  const headers: Record<string, string> = await getHeaders(metaFile);

  if (forceCache && fs.existsSync(imgFile)) {
    if (!ignoreCache && fs.existsSync(imgFile)) {
      console.info(`----Using cache: [${hash}] (${url})`);

      if (fs.existsSync(imgFile)) {
        return { imgFile, cached: true, status: undefined };
      } else {
        console.error(`----Cached file for ${url} not found`);
      }
    }

    return { imgFile: null, cached: false, status: undefined };
  }

  if (ignoreCache || !fs.existsSync(imgFile)) {
    try {
      const response = await safeRequest(
        url,
        () => {
          return axios.get(url, { headers, responseType: 'stream', validateStatus: (s) => s < 500 });
        },
        { polite },
        5
      );
      if (response?.status === 304) {
        console.info(`--Image 304 Not Modified, using cache: [${hash}]`);

        return { imgFile, cached: true, status: response.status };
      }
      if (response?.status === 404) {
        return { imgFile: null, cached: false, status: response.status };
      }
      if (response?.status === 200) {
        const writer = fs.createWriteStream(imgFile);
        response.data.pipe(writer);
        await new Promise((res) => writer.on('finish', res));

        await writeFileAsync(
          metaFile,
          JSON.stringify(
            {
              etag: response.headers.etag,
              lastModified: response.headers['last-modified'],
            },
            null,
            2
          )
        );

        return { imgFile, cached: false, status: response.status };
      }
    } catch (err) {
      console.warn(`Error fetching ${url}, fallback to cached image`);
    }

    if (fs.existsSync(imgFile)) {
      return { imgFile, cached: true, status: undefined };
    }

    return { imgFile, cached: false, status: undefined };
  }

  // No cache -> fresh download
  const newHeaders: Record<string, string> = await getHeaders(metaFile, true);
  const response = await safeRequest(url, () => axios.get(url, { headers: newHeaders, responseType: 'stream' }));
  if (response?.status == 200) {
    const writer = fs.createWriteStream(imgFile);
    response.data.pipe(writer);
    await new Promise((res) => writer.on('finish', res));

    await writeFileAsync(
      metaFile,
      JSON.stringify(
        {
          etag: response.headers.etag,
          lastModified: response.headers['last-modified'],
        },
        null,
        2
      )
    );

    return { imgFile, cached: false, status: response.status };
  }

  return { imgFile: null, cached: false, status: response?.status !== null ? response?.status : undefined };
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
  position = 0;

  async scrapeDigimon(url: string, ignoreCache: boolean = false, forceCache: boolean = false) {
    let result: { content: string | null; cached: boolean; status: number | undefined } | undefined = undefined;
    if (this.position < start_position) {
      console.info(`Skip Digimon: ${url} ... (${this.position})`);
      result = await fetchFromWebOrCache(url, { ignoreCache, forceCache: true });

      return undefined;
    }
    console.info(`Scrap Digimon: ${url} ... (${this.position})`);

    if (!isAllowedUrl(url)) {
      throw new Error(`URL disallowed by robots: ${url}`);
    }
    result = await fetchFromWebOrCache(url, { ignoreCache, forceCache });
    const html = result?.content;
    const cached = result?.cached ?? false;
    //console.verbose({result});
    if (!html) return undefined;

    const $ = cheerio.load(html);

    const no_article = $('#bodyContent .noarticletext');
    const no_article_text = $('#bodyContent .noarticletext p').text().trim();
    if (no_article.length && no_article_text.includes('There is currently no text in this page.')) {
      console.info(`Not Article found for Digimon: ${url} ... (${this.position})`);

      return undefined;
    }

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
      console.info(`  Parse Digimon: ${url} ...`);

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
      let img = infoBox.find('a.image img');
      if (!img.length) {
        img = $('#mw-content-text .mw-parser-output > table .tab-pane a.image img').first();
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

      const categories: { id: string; name: string; img?: string; title?: string; href?: string }[] = [];
      for (let i = 0; i < preCategories.length; i++) {
        const cat = preCategories[i];
        if (cat.downloadImageUrl) {
          console.debug(`    cat ${cat.name} download image: ${cat.downloadImageUrl}`);
          const imgResult = await downloadImage(cat.downloadImageUrl, {
            ignoreCache,
            forceCache: !cached,
            polite: POLITE || cached || ALWAYS_USE_CACHED,
          });
          const downloadFilename = imgResult?.imgFile;
          if (imgResult?.status === 200 && downloadFilename && cat.img) {
            const filename = resolve(__dirname, cat.img);
            if (!fs.existsSync(filename)) {
              await copy(downloadFilename, filename);
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
      console.debug(`    evolvesFrom found: ${evolvesFrom.length}`);

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
      console.debug(`    evolvesTo found: ${evolvesTo.length}`);

      const id = hrefToId(url.replace(this.baseUrl + '/', ''));
      if (id) {
        let downloadFilename: string | null = null;
        let imgFilename: string | null = null;
        let downloadImageUrl: string | null = null;
        for (let i = 0; i < img.length; i++) {
          const e = img[i];
          const src = $(e).attr('src');
          if (!downloadFilename) {
            if (src) {
              downloadImageUrl = this.baseUrl + src;
              console.debug(`   '${name}' -- ${url} download image: ${downloadImageUrl}`);
              const imgResult = await downloadImage(downloadImageUrl, {
                ignoreCache,
                forceCache: !cached,
                polite: POLITE || cached || ALWAYS_USE_CACHED,
              });
              if (imgResult?.status === 200 && imgResult?.imgFile) {
                imgFilename = `img/${id.replace('/', '')}.png`;
                downloadFilename = imgResult?.imgFile ?? null;
                const filename = resolve(__dirname, imgFilename);
                if (!fs.existsSync(filename)) {
                  await copy(downloadFilename, filename);
                }
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

        console.info(`Scrapped Digimon: ${name} (${levels}) [${attributes}]`);

        this.position++;

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

    this.position++;

    return undefined;
  }

  async scrapeDigimonList(url: string) {
    const result = await fetchFromWebOrCache(url, {
      prefix: 'l_',
      ignoreCache: REDOWNLOAD_LIST,
      forceCache: !REDOWNLOAD_LIST && ALWAYS_USE_CACHED,
    });
    const html = result?.content;
    //const cached = result?.cached ?? false;
    if (!html) return [];

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

  if (TESTING) {
    console.debug(await scraper.scrapeDigimon('https://wikimon.net/Agumon'));
    console.debug(await scraper.scrapeDigimon('https://wikimon.net/Agumon_(2006_Anime_Version)'));
    console.debug(await scraper.scrapeDigimon('https://wikimon.net/Agumon_(Black)_(2006_Anime_Version)'));
    console.debug(await scraper.scrapeDigimon('https://wikimon.net/Agnimon'));
    console.debug(await scraper.scrapeDigimon('https://wikimon.net/Xuanwumon'));
    await asyncRandomSleep(2025, 5125);
    console.debug(await scraper.scrapeDigimon('https://wikimon.net/Agumon', true));
    await asyncRandomSleep(2026, 5125);
    console.debug(await scraper.scrapeDigimon('https://wikimon.net/Herakle_Kabuterimon', true));
    await asyncRandomSleep(1234, 4567);
    console.debug(await scraper.scrapeDigimon('https://wikimon.net/Cherubimon_(Virtue)', true));
    await asyncRandomSleep(3254, 4523);
    console.debug(await scraper.scrapeDigimon('https://wikimon.net/Unnamed_Trailmon_1', true));
    await asyncRandomSleep(1234, 4567);

    return;
  }

  const baby1List = await getBaby1DigimonList();
  console.info(`Get Baby I Digimon List: ${baby1List.length}`);

  await asyncRandomSleep(1234, 4567);
  const baby2List = await getBaby2DigimonList();
  console.info(`Get Baby II Digimon List: ${baby2List.length}`);

  await asyncRandomSleep(1100, 4861);
  const childList = await getChildDigimonList();
  console.info(`Get Child Digimon List: ${childList.length}`);

  await asyncRandomSleep(2356, 8745);
  const adultList = await getAdultDigimonList();
  console.info(`Get Adult Digimon List: ${adultList.length}`);

  await asyncRandomSleep(3254, 3652);
  const perfectList = await getPerfectDigimonList();
  console.info(`Get Perfect Digimon List: ${perfectList.length}`);

  await asyncRandomSleep(5684, 6543);
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
      const promises = slice.map(async (d) => scraper.scrapeDigimon(d, false, ALWAYS_USE_CACHED));
      db.digimons = db.digimons.concat((await executePromisesWithLimit(promises, 2)).filter((d) => d) as DigimonData[]);
    }
  };

  const loadBatch = POLITE ? 1 : 10;
  let i = 0;
  while (i < allDigimonUrls.length) {
    await loadSlice(i, i + loadBatch);
    i += loadBatch;
  }
  // load rest/all
  const promises = allDigimonUrls.map(async (d) => scraper.scrapeDigimon(d, false, ALWAYS_USE_CACHED));
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
