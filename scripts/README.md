# Scraper

## Run

```bash
NODE_OPTIONS="--max-old-space-size=8192" npx ts-node ./scripts/scraper.ts
cp ./scripts/digimon.db.json src/db/digimon.db.json
cp ./scripts/img/*.png public/img/.
```

_generate database file_

---

- https://github.com/tvanantwerp/scraper-example