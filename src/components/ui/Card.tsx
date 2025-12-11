import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  isSelected?: boolean;
  isHovered?: boolean;
}

export default function Card({
  children,
  className,
  onClick,
  onMouseEnter,
  onMouseLeave,
  isSelected,
  isHovered,
}: CardProps) {
  const clickableClasses = onClick
    ? "cursor-pointer transition hover:bg-slate-800/60"
    : "";

  const baseClasses = "border-slate-700 bg-slate-900/70";
  const selectedClasses = isSelected ? "border-sky-500 bg-slate-800/70" : "";
  const hoveredClasses =
    !isSelected && isHovered ? "border-amber-400 shadow-[0_0_0_1px_rgba(251,191,36,0.6)]" : "";

  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`rounded-xl border p-4 ${baseClasses} ${selectedClasses} ${hoveredClasses} ${clickableClasses} ${
        className ?? ""
      }`}
    >
      {children}
    </div>
  );
}
