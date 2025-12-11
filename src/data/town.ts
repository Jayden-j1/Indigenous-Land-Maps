// src/data/towns.ts

export interface Town {
  id: number;
  name: string;
  state: string; // e.g. "NSW", "NT"
  lat: number;
  lng: number;
}

// Small sample dataset – extend as needed
export const TOWNS: Town[] = [
  {
    id: 1,
    name: "Dubbo",
    state: "NSW",
    lat: -32.2569,
    lng: 148.6011,
  },
  {
    id: 2,
    name: "Alice Springs",
    state: "NT",
    lat: -23.6980,
    lng: 133.8807,
  },
  {
    id: 3,
    name: "Cairns",
    state: "QLD",
    lat: -16.9186,
    lng: 145.7781,
  },
  {
    id: 4,
    name: "Broome",
    state: "WA",
    lat: -17.9614,
    lng: 122.2359,
  },
];
