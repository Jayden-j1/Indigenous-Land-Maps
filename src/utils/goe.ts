// src/utils/geo.ts

import type { IpaGeometry } from "../api/protectedAreas";

/**
 * Extracts all [lng, lat] coordinate pairs from a geometry.
 * Supports both:
 * - GeoJSON-style: geometry.coordinates
 * - Esri-style polygons: geometry.rings
 */
function extractPositions(geometry: IpaGeometry | null | undefined): [number, number][] {
  if (!geometry) return [];

  // Prefer standard GeoJSON, fall back to Esri-style rings
  const rawCoords = (geometry.coordinates ?? geometry.rings) as unknown;
  const positions: [number, number][] = [];

  function walk(value: unknown) {
    if (
      Array.isArray(value) &&
      typeof value[0] === "number" &&
      typeof value[1] === "number"
    ) {
      // Treat as [lng, lat]
      positions.push([value[0], value[1]]);
    } else if (Array.isArray(value)) {
      for (const item of value) {
        walk(item);
      }
    }
  }

  walk(rawCoords);
  return positions;
}

/**
 * Computes a simple centroid (average of all points) for a geometry.
 * This is not geodetically perfect, but good enough for "nearest IPAs"
 * in a small educational app.
 */
export function computeFeatureCentroid(
  geometry: IpaGeometry | null | undefined
): { lat: number; lng: number } | null {
  const positions = extractPositions(geometry);
  if (positions.length === 0) return null;

  let sumLat = 0;
  let sumLng = 0;

  for (const [lng, lat] of positions) {
    sumLat += lat;
    sumLng += lng;
  }

  const count = positions.length;
  return {
    lat: sumLat / count,
    lng: sumLng / count,
  };
}

/**
 * Haversine distance between two points (in km).
 */
export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
