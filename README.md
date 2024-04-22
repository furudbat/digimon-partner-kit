# Digimon Partner Kit

Build your own Digimon-Partner Digivolution line

## Features

- Select your Starter Digimon (Child or Adult Level)
- Select the next/prev. Level from the line
- Chose from the huge library of Digimon from [wikimon](https://wikimon.net) (over 1300 Digimons)


### Limitations

- Only main Levels are available like "Child", "Perfect and "Ultimate". Other Levels like "Armor" are skipped to keep it simple
- Only Evolves From/To the next/prev. Level are possible, no digivolutions to the same Level or skipping Levels



## Development

### Testing

All tests are collocated with the source code inside the same directory. So, it makes it easier to find them. Coverage threshold is set to `70%`. In the `.jest` folder there is a custom provider for the all tests.

### Deploy to production

You can see the results locally in production mode with:

```bash
pnpm build
```

```bash
pnpm start
```

## License

Licensed under the MIT License, Copyright © 2024

See [LICENSE](LICENSE) for more information.

This Project is free fan site and not affiliated with Bandai.
Digimon and other media relating to the franchise are registered trademarks by Bandai.

---

- https://wikimon.net/
- https://digimon-api.com/
- https://github.com/tvanantwerp/scraper-example
- https://www.youtube.com/watch?v=nwgzHrkBZis
