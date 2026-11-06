# Scraper

## Run

```bash
NODE_OPTIONS="--max-old-space-size=8192" pnpm tsx ./scripts/scraper.ts
cp ./scripts/digimon.db.json src/db/digimon.db.json

cp ./scripts/img/cat/*.png public/img/.
#cp ./scripts/img/cat/*.jpg public/img/.

mogrify -path public/img/ -thumbnail '320x320>' -background white -gravity center -extent 320x320 ./scripts/img/*.png
mogrify -path public/img/ -thumbnail '320x320>' -background white -gravity center -extent 320x320 ./scripts/img/*.jpg
```

_generate database file_

---

- https://github.com/tvanantwerp/scraper-example