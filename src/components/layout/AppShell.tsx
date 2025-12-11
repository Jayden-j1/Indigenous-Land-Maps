import type { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <Header title="Indigenous Protected Areas Explorer" />

      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-6">
          {children}
        </div>
      </main>

      <Footer
        attribution="Data © Commonwealth of Australia. Indigenous Protected Areas dataset. Licensed under Creative Commons (CC BY)."
        caveats="Boundaries are indicative and not legally definitive. Respecting that Country, language, and community boundaries are complex and living."
      />
    </div>
  );
}
