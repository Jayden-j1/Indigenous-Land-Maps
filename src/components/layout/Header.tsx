interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  return (
    <header className="w-full border-b border-slate-800 bg-slate-900">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div>
          <h1 className="text-lg font-bold text-white">
            {title}
          </h1>
          <p className="text-sm text-slate-200">
            A small project – visualising Indigenous Protected Areas
          </p>
        </div>
      </div>
    </header>
  );
}
