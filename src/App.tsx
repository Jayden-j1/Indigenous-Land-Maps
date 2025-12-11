// src/App.tsx

import AppShell from "./components/layout/AppShell";
import ProtectedAreasPage from "./features/protectedAreas/components/ProtectedAreasPage";

export default function App() {
  return (
    <AppShell>
      <ProtectedAreasPage />
    </AppShell>
  );
}
