// src/features/protectedAreas/components/ProtectedAreasMap.tsx

import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  GeoJSON,
} from "react-leaflet";
import type { Feature, Geometry } from "geojson";
import type {
  IpaFeature,
  IpaFeatureCollection,
} from "../../../api/protectedAreas";
import type { ProtectedArea } from "../types";
import type { GeocodedPlace } from "../../../api/geocoding";
import type { LeafletMouseEvent } from "leaflet";

interface ProtectedAreasMapProps {
  areas: ProtectedArea[];
  selectedAreaId: number | null;
  hoveredAreaId?: number | null;
  featureCollection: IpaFeatureCollection;
  geocodedTown?: GeocodedPlace | null;
  focusKey: number; // used to force remount/zoom when selection is re-clicked
  onAreaSelect?: (id: number) => void;
  onAreaHover?: (id: number | null) => void;
}

const DEFAULT_CENTER: [number, number] = [-25.0, 133.0]; // AU-ish
const DEFAULT_ZOOM = 4;
const SELECTED_ZOOM = 7;
const TOWN_ZOOM = 6;

export default function ProtectedAreasMap({
  areas,
  selectedAreaId,
  hoveredAreaId,
  featureCollection,
  geocodedTown,
  focusKey,
  onAreaSelect,
  onAreaHover,
}: ProtectedAreasMapProps) {
  const selectedArea: ProtectedArea | null =
    selectedAreaId != null
      ? areas.find((a) => a.id === selectedAreaId) ?? null
      : null;

  const selectedFeature: IpaFeature | null =
    selectedAreaId != null
      ? featureCollection.features[selectedAreaId] ?? null
      : null;

  // Decide map centre + zoom
  const hasSelectedLatLng =
    selectedArea &&
    typeof selectedArea.lat === "number" &&
    typeof selectedArea.lng === "number";

  let center: [number, number] = DEFAULT_CENTER;
  let zoom = DEFAULT_ZOOM;

  if (hasSelectedLatLng) {
    center = [selectedArea!.lat as number, selectedArea!.lng as number];
    zoom = SELECTED_ZOOM;
  } else if (geocodedTown) {
    center = [geocodedTown.lat, geocodedTown.lng];
    zoom = TOWN_ZOOM;
  }

  const mapKey =
    selectedAreaId != null
      ? `ipa-selected-${selectedAreaId}-${focusKey}`
      : geocodedTown
      ? `town-${geocodedTown.displayName}-${focusKey}`
      : `ipa-default-${focusKey}`;

  // Selected IPA polygon outline, if available
  let selectedFeatureGeoJson: Feature<Geometry> | null = null;

  if (selectedFeature && selectedFeature.geometry) {
    selectedFeatureGeoJson = {
      type: "Feature",
      geometry: selectedFeature.geometry as Geometry,
      properties: {},
    };
  }

  // All IPA markers that have coordinates
  const markerAreas = areas.filter(
    (area) =>
      typeof area.lat === "number" && typeof area.lng === "number"
  );

  const hasTown = Boolean(geocodedTown);

  function handleMarkerMouseOver(
    e: LeafletMouseEvent,
    areaId: number | null
  ) {
    e.target.openPopup();
    if (onAreaHover) onAreaHover(areaId);
  }

  function handleMarkerMouseOut(
    e: LeafletMouseEvent,
    areaId: number | null
  ) {
    e.target.closePopup();
    if (onAreaHover) onAreaHover(areaId);
  }

  return (
    <div className="h-80 w-full overflow-hidden rounded-xl border border-slate-700">
      <MapContainer
        key={mapKey}
        center={center}
        zoom={zoom}
        className="h-full w-full"
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Town marker (no radius) */}
        {hasTown && geocodedTown && (
          <CircleMarker
            center={[geocodedTown.lat, geocodedTown.lng]}
            radius={6}
            pathOptions={{
              color: "#22c55e", // green
              weight: 2,
              fillOpacity: 0.9,
            }}
            eventHandlers={{
              click: (e) => handleMarkerMouseOver(e, null),
              mouseover: (e) => handleMarkerMouseOver(e, null),
              mouseout: (e) => handleMarkerMouseOut(e, null),
            }}
          >
            <Popup>
              <div className="space-y-1">
                <div className="font-semibold text-slate-900">
                  {geocodedTown.displayName}
                </div>
                <div className="text-xs text-slate-900">
                  Town / community
                </div>
              </div>
            </Popup>
          </CircleMarker>
        )}

        {/* All IPA markers */}
        {markerAreas.map((area) => {
          const isSelected =
            selectedAreaId != null && selectedAreaId === area.id;
          const isHovered =
            hoveredAreaId != null && hoveredAreaId === area.id;

          let markerColor = "#f97316"; // orange default
          let radius = 4;
          let weight = 1.5;
          let fillOpacity = 0.7;

          if (isHovered) {
            markerColor = "#fde047"; // amber glow
            radius = 6;
            weight = 2;
            fillOpacity = 0.85;
          }

          if (isSelected) {
            markerColor = "#0ea5e9"; // sky blue
            radius = 7;
            weight = 3;
            fillOpacity = 0.9;
          }

          return (
            <CircleMarker
              key={area.id}
              center={[area.lat as number, area.lng as number]}
              radius={radius}
              pathOptions={{
                color: markerColor,
                weight,
                fillOpacity,
              }}
              eventHandlers={{
                click: (e) => {
                  // select + show popup + zoom (via focusKey)
                  if (onAreaSelect) onAreaSelect(area.id);
                  handleMarkerMouseOver(e, area.id);
                },
                mouseover: (e) => {
                  handleMarkerMouseOver(e, area.id);
                },
                mouseout: (e) => {
                  handleMarkerMouseOut(e, null);
                },
              }}
            >
              <Popup>
                <div className="space-y-1">
                  <div className="font-semibold text-slate-900">
                    {area.name}
                  </div>
                  <div className="text-xs text-slate-900">
                    {area.state} · {area.type}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* Selected IPA polygon outline (if available) */}
        {selectedFeatureGeoJson && (
          <GeoJSON
            data={selectedFeatureGeoJson}
            style={{
              color: "#0ea5e9",
              weight: 2,
              fillOpacity: 0.15,
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
