interface FooterProps {
  attribution: string;
  caveats: string;
}

export default function Footer({ attribution, caveats }: FooterProps) {
  return (
    <footer className="w-full border-t border-slate-800 bg-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-3">
        <p className="text-xs text-slate-300">
          {attribution}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          {caveats}
        </p>
      </div>
    </footer>
  );
}
