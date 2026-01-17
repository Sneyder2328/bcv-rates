interface SectionDividerProps {
  label: string;
}

export function SectionDivider({ label }: SectionDividerProps) {
  return (
    <div className="relative py-0.5 sm:py-2">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-zinc-800/50"></div>
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-[#121215] px-2 text-zinc-600 font-medium">
          {label}
        </span>
      </div>
    </div>
  );
}
