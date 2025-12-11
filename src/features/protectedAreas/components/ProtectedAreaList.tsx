import Card from "../../../components/ui/Card";
import type { ProtectedArea } from "../types";

interface ProtectedAreaListProps {
  areas: ProtectedArea[];
  onAreaClick?: (area: ProtectedArea) => void;
  onAreaHover?: (area: ProtectedArea | null) => void;
  selectedAreaId?: number | null;
  hoveredAreaId?: number | null;
}

export default function ProtectedAreaList({
  areas,
  onAreaClick,
  onAreaHover,
  selectedAreaId,
  hoveredAreaId,
}: ProtectedAreaListProps) {
  if (areas.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        No protected areas match your current filters.
      </p>
    );
  }

  return (
    <section className="grid gap-4 md:grid-cols-2">
      {areas.map((area) => {
        const isSelected =
          selectedAreaId != null && selectedAreaId === area.id;
        const isHovered =
          hoveredAreaId != null && hoveredAreaId === area.id;

        return (
          <Card
            key={area.id}
            onClick={onAreaClick ? () => onAreaClick(area) : undefined}
            onMouseEnter={
              onAreaHover ? () => onAreaHover(area) : undefined
            }
            onMouseLeave={onAreaHover ? () => onAreaHover(null) : undefined}
            isSelected={isSelected}
            isHovered={isHovered}
          >
            <h2 className="text-lg font-semibold text-slate-50">
              {area.name}
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              {area.state} · {area.type}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Managing authority type: {area.managingBody}
            </p>

            {typeof area.distanceKm === "number" && (
              <p className="mt-1 text-xs text-slate-400">
                Approx. {area.distanceKm.toFixed(0)} km away
              </p>
            )}
          </Card>
        );
      })}
    </section>
  );
}
