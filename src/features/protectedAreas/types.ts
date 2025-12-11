// Clean internal model used by the UI
export interface ProtectedArea {
  id: number;
  name: string;
  state: string;
  type: string;
  managingBody: string;
  lat?: number | null;
  lng?: number | null;

  // Optional: used only when showing "nearby" IPAs
  distanceKm?: number;
}
