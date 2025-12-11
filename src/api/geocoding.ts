// src/api/geocoding.ts

// Simple type for a geocoded place
export type GeocodedPlace = {
  displayName: string;
  lat: number;
  lng: number;
};

/**
 * Geocode a town or locality in Australia.
 *
 * For this small project we use the OpenStreetMap Nominatim search API.
 * In production you would usually proxy this via a backend and respect
 * rate limits and usage policies.
 */
export async function geocodeTownInAustralia(
  query: string,
  stateAbbrev?: string
): Promise<GeocodedPlace | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  // Build a query string. If a state is selected, include it to bias results.
  const q =
    stateAbbrev && stateAbbrev !== "ALL"
      ? `${trimmed}, ${stateAbbrev}, Australia`
      : `${trimmed}, Australia`;

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "au");
  url.searchParams.set("q", q);

  // Nominatim expects a proper User-Agent / Referer; the browser will send one.
  const response = await fetch(url.toString(), {
    headers: {
      // Helps identify your app politely
      "Accept-Language": "en-AU",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to geocode town: ${response.status}`);
  }

  const results = (await response.json()) as Array<{
    display_name: string;
    lat: string;
    lon: string;
  }>;

  if (!results || results.length === 0) {
    return null;
  }

  const first = results[0];

  const lat = Number(first.lat);
  const lng = Number(first.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return {
    displayName: first.display_name,
    lat,
    lng,
  };
}
