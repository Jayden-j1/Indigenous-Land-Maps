// src/api/protectedAreas.ts

import type { Geometry } from "geojson";

export type IpaProperties = {
  NAME?: string;
  TYPE?: string;
  STATE?: string;
  AUTHORITY?: string;
  LATITUDE?: number;
  LONGITUDE?: number;
  [key: string]: unknown;
};

export type IpaFeature = {
  type: "Feature";
  properties: IpaProperties;
  geometry: Geometry | null;
};

export type IpaFeatureCollection = {
  type: "FeatureCollection";
  features: IpaFeature[];
};

const IPA_URL =
  "https://gis.environment.gov.au/gispubmap/rest/services/ogc_services/Indigenous_Protected_Areas/MapServer/0/query?f=geojson&where=1=1&outFields=*";

export async function fetchProtectedAreas(): Promise<IpaFeatureCollection> {
  const response = await fetch(IPA_URL);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch Indigenous Protected Areas: ${response.status}`
    );
  }

  const data = (await response.json()) as IpaFeatureCollection;
  return data;
}
