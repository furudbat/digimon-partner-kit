export type DigimonLevel = 'Baby I' | 'Baby II' | 'Child' | 'Adult' | 'Perfect' | 'Ultimate';

interface DigimonBase {
  id: string;
  name: string;
}

export interface DigimonListElement extends DigimonBase {
  href: string;
}

export interface DigimonDataEvolveElement extends DigimonBase {
  url: string;
  canon?: boolean;
  line?: string;

  cites?: { cite: number; text: string }[];
  animes?: string[];
  // @TODO: add proper properties for each device
  [key: string]: any; // Allow the flexible addition of `dm`, `dm20`, etc.
}

export interface DigimonData {
  href: string;
  id: string;
  name: string;
  description: string;
  img: string | null;
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

  // @TODO: add proper properties for each device
  [key: string]: any; // Allow the flexible addition of `dm`, `dm20`, `evolvesToDm`, etc.
}

export interface DigimonDB {
  lists: {
    baby1: DigimonListElement[];
    baby2: DigimonListElement[];
    child: DigimonListElement[];
    adult: DigimonListElement[];
    perfect: DigimonListElement[];
    ultimate: DigimonListElement[];
    all: DigimonListElement[];
  };
  digimons: DigimonData[];
}
