import { useState, useRef } from "react";
import { useProtectedAreas } from "../hooks/useProtectedAreas";
import type { ProtectedArea } from "../types";
import ProtectedAreaList from "./ProtectedAreaList";
import ProtectedAreasMap from "./ProtectedAreasMap";

import { haversineDistanceKm } from "../../../utils/distance";
import {
  geocodeTownInAustralia,
  type GeocodedPlace,
} from "../../../api/geocoding";
import type { IpaFeatureCollection } from "../../../api/protectedAreas";

// Human-readable labels for AUTHORITY codes
const AUTHORITY_LABELS: Record<string, string> = {
  IMG: "Indigenous Management Group",
  LALC: "Local Aboriginal Land Council",
  TSRA: "Torres Strait Regional Authority",
  // Add more as needed as you discover other codes
};

export default function ProtectedAreasPage() {
  // 1. Load real API data via the hook
  const { data, isLoading, isError, error } = useProtectedAreas();

  // 2. Local UI state: IPA name + state filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedState, setSelectedState] = useState<string>("ALL");

  // 3. Local UI state: town-based search via geocoding
  const [townQuery, setTownQuery] = useState("");
  const [geocodedTown, setGeocodedTown] = useState<GeocodedPlace | null>(
    null
  );
  const [isTownSearching, setIsTownSearching] = useState(false);
  const [townError, setTownError] = useState<string | null>(null);

  // 4. Local UI state: which IPA is selected + hovered
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);
  const [hoveredAreaId, setHoveredAreaId] = useState<number | null>(null);

  // 5. Local UI state: map focus key (forces zoom when re-clicking selected marker)
  const [mapFocusKey, setMapFocusKey] = useState(0);

  // 6. Ref for the map section (smooth scroll target)
  const mapSectionRef = useRef<HTMLElement | null>(null);

  // 7. Loading state
  if (isLoading) {
    return (
      <p className="text-slate-300">
        Loading Indigenous Protected Areas…
      </p>
    );
  }

  // 8. Error state
  if (isError) {
    return (
      <p className="text-sm text-red-400">
        Failed to load dataset: {error?.message}
      </p>
    );
  }

  // 9. Guard for missing data
  if (!data || !data.features) {
    return (
      <p className="text-sm text-slate-400">
        No data available from the Indigenous Protected Areas service.
      </p>
    );
  }

  const featureCollection = data as IpaFeatureCollection;

  // 10. Transform features → clean ProtectedArea[]
  const areas: ProtectedArea[] = featureCollection.features.map(
    (feature, index) => {
      const props = feature.properties;

      const lat =
        typeof props.LATITUDE === "number" ? props.LATITUDE : null;
      const lng =
        typeof props.LONGITUDE === "number" ? props.LONGITUDE : null;

      const authorityCode =
        typeof props.AUTHORITY === "string" ? props.AUTHORITY.trim() : "";

      const authorityLabel =
        authorityCode && AUTHORITY_LABELS[authorityCode]
          ? `${AUTHORITY_LABELS[authorityCode]} (${authorityCode})`
          : authorityCode || "Unknown";

      return {
        id: index,
        name: String(props.NAME ?? "Unnamed Area"),
        state: String(props.STATE ?? "Unknown"),
        type: String(props.TYPE ?? "Unknown Type"),
        managingBody: authorityLabel,
        lat,
        lng,
      };
    }
  );

  // 11. Derive unique state options for the dropdown
  const states = Array.from(new Set(areas.map((area) => area.state))).sort();

  // 12. Apply IPA name + state filtering
  const search = searchTerm.toLowerCase();

  const filteredAreas = areas.filter((area) => {
    const matchesName =
      search === "" || area.name.toLowerCase().includes(search);
    const matchesState =
      selectedState === "ALL" || area.state === selectedState;

    return matchesName && matchesState;
  });

  // Only show IPA list once the user has interacted with filters
  const hasIpaFilter =
    searchTerm.trim() !== "" || selectedState !== "ALL";

  // 13. Selected IPA (for convenience)
  const selectedArea: ProtectedArea | null =
    selectedAreaId != null
      ? areas.find((a) => a.id === selectedAreaId) ?? null
      : null;

  function selectAreaById(id: number) {
    setSelectedAreaId(id);
    setHoveredAreaId(null);
    setMapFocusKey((key) => key + 1); // bump focus key to force map re-zoom

    // Smooth scroll to the map section
    if (mapSectionRef.current) {
      mapSectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }

  function handleAreaClick(area: ProtectedArea) {
    selectAreaById(area.id);
  }

  function handleAreaHover(area: ProtectedArea | null) {
    setHoveredAreaId(area ? area.id : null);
  }

  function handleMapSelect(id: number) {
    selectAreaById(id);
  }

  function handleClearSelection() {
    setSelectedAreaId(null);
    setHoveredAreaId(null);
    setMapFocusKey((key) => key + 1);
  }

  // 14. Town search: geocode the town name and find nearby IPAs
  async function handleTownSearchSubmit(event: React.FormEvent) {
    event.preventDefault();

    const query = townQuery.trim();
    if (!query) {
      setGeocodedTown(null);
      setTownError(null);
      return;
    }

    try {
      setIsTownSearching(true);
      setTownError(null);
      setGeocodedTown(null);

      const place = await geocodeTownInAustralia(query, selectedState);

      if (!place) {
        setTownError(
          "We could not find that town in Australia. Try a nearby larger town name or check the spelling."
        );
        return;
      }

      setGeocodedTown(place);
      // Normalise the input to the geocoded place name (optional)
      setTownQuery(place.displayName);
    } catch (err) {
      setTownError(
        err instanceof Error
          ? err.message
          : "Something went wrong while looking up that town."
      );
    } finally {
      setIsTownSearching(false);
    }
  }

  // 15. Compute nearest IPAs to the geocoded town (if any)
  let nearbyAreas: ProtectedArea[] = [];

  if (geocodedTown) {
    const candidates = areas.filter(
      (area) =>
        typeof area.lat === "number" &&
        typeof area.lng === "number"
    );

    nearbyAreas = [...candidates]
      .map((area) => {
        const distanceKm = haversineDistanceKm(
          geocodedTown.lat,
          geocodedTown.lng,
          area.lat as number,
          area.lng as number
        );
        return { ...area, distanceKm };
      })
      .sort((a, b) => (a.distanceKm! - b.distanceKm!))
      .slice(0, 5);
  }

  // 16. Render UI
  return (
    <div className="space-y-8">
      {/* Heading */}
      <header>
        <h1 className="text-2xl font-semibold">
          Indigenous Protected Areas
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          Visualising Indigenous Protected Areas using the Australian
          Government IPA service. Boundaries are indicative only, and
          authority codes reflect management types, not specific organisations.
        </p>
      </header>

      {/* Filters row (IPA name + state) */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Search by IPA name */}
        <div>
          <label
            htmlFor="search"
            className="block text-sm font-medium text-slate-200"
          >
            IPAs matching your filters
          </label>
          <input
            id="search"
            type="search"
            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
            placeholder='Start by typing part of an IPA name… e.g. "Ngunya"'
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        {/* Filter by state */}
        <div>
          <label
            htmlFor="state"
            className="block text-sm font-medium text-slate-200"
          >
            Filter by state/territory
          </label>
          <select
            id="state"
            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
            value={selectedState}
            onChange={(event) => setSelectedState(event.target.value)}
          >
            <option value="ALL">All states/territories</option>
            {states.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main IPA list: only show once user has interacted */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-100">
          IPAs matching your filters
        </h2>

        {!hasIpaFilter && (
          <p className="text-sm text-slate-400">
            Start by typing part of an IPA name or selecting a state/territory
            above to see matching Indigenous Protected Areas.
          </p>
        )}

        {<p className="text-lg font-semibold text-slate-100">OR</p>}

        {hasIpaFilter && (
          <ProtectedAreaList
            areas={filteredAreas}
            onAreaClick={handleAreaClick}
            onAreaHover={handleAreaHover}
            selectedAreaId={selectedAreaId}
            hoveredAreaId={hoveredAreaId}
          />
        )}
      </section>

      {/* Town-based search */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-100">
          Find IPAs near a town or community
        </h2>

        <p className="text-sm text-slate-400">
          Type any Australian town or
          community name in the box below. We&apos;ll look up its approximate
          location and show nearby Indigenous Protected Areas, using indicative
          coordinates only.
        </p>

        <form
          className="flex flex-col gap-3 md:flex-row md:items-end"
          onSubmit={handleTownSearchSubmit}
        >
          <div className="flex-1">
            <label
              htmlFor="town"
              className="block text-sm font-medium text-slate-200"
            >
              Town / community name
            </label>
            <input
              id="town"
              type="text"
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder='e.g. "Ballina"'
              value={townQuery}
              onChange={(event) => setTownQuery(event.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={isTownSearching}
            className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            {isTownSearching ? "Searching…" : "Find nearby IPAs"}
          </button>
        </form>

        {townError && (
          <p className="text-xs text-red-400">
            {townError}
          </p>
        )}

        {geocodedTown && (
          <div className="space-y-2">
            <p className="text-sm text-slate-200">
              Nearest Indigenous Protected Areas to{" "}
              <span className="font-semibold">
                {geocodedTown.displayName}
              </span>
              :
            </p>
            <ProtectedAreaList
              areas={nearbyAreas}
              onAreaClick={handleAreaClick}
              onAreaHover={handleAreaHover}
              selectedAreaId={selectedAreaId}
              hoveredAreaId={hoveredAreaId}
            />
          </div>
        )}
      </section>

      {/* Map visualisation at the bottom */}
      <section ref={mapSectionRef} className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-100">
            Map view
          </h2>
          <button
            type="button"
            onClick={handleClearSelection}
            className="rounded-md border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800"
          >
            Clear selection
          </button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
          <div className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full border border-slate-700 bg-sky-500" />
            <span>Selected IPA (click blue marker to zoom in or the + sign on the map)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full border border-slate-700 bg-amber-300" />
            <span>Hovered IPA (from card or marker)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full border border-slate-700 bg-orange-400" />
            <span>Other IPAs with coordinates</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full border border-slate-700 bg-emerald-400" />
            <span>Town / community</span>
          </div>
        </div>

        <p className="text-sm text-slate-300">
          All IPAs with available coordinates are shown on the map. Hover a card
          to glow its marker, or hover/click any marker to see its details.
          Click a blue marker (selected IPA) to centre and zoom the map on that
          area. Locations and boundaries are indicative and not legally
          definitive.
        </p>

        <ProtectedAreasMap
          areas={areas}
          selectedAreaId={selectedAreaId}
          hoveredAreaId={hoveredAreaId}
          featureCollection={featureCollection}
          geocodedTown={geocodedTown}
          focusKey={mapFocusKey}
          onAreaSelect={handleMapSelect}
          onAreaHover={(id) => setHoveredAreaId(id)}
        />

        {selectedArea && (
          <p className="mt-1 text-xs text-slate-400">
            Currently focused IPA:{" "}
            <span className="font-semibold">{selectedArea.name}</span>{" "}
            ({selectedArea.state})
          </p>
        )}
      </section>
    </div>
  );
}
