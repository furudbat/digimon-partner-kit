interface DigimonListElement {
  id: string;
  href: string;
  name: string;
}

export type DigimonLevel = 'Baby I' | 'Baby II' | 'Child' | 'Adult' | 'Perfect' | 'Ultimate';

export interface DigimonDataEvolveElement {
  id: string;
  name: string;
  url: string;
  canon?: boolean;
  line?: string;
}

export interface DigimonData {
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
