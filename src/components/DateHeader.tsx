interface Props {
  date: Date;
}

export function DateHeader({ date }: Props) {
  const weekday = date.toLocaleDateString(undefined, { weekday: "long" });
  const day = date.toLocaleDateString(undefined, { day: "numeric", month: "long" });

  return (
    <div className="sticky top-[72px] z-10 -mx-4 border-b border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:top-[80px]">
      <div className="flex items-baseline gap-3">
        <span className="text-sm font-bold uppercase tracking-[0.2em] text-primary">
          {weekday}
        </span>
        <span className="text-sm text-muted-foreground">{day}</span>
      </div>
    </div>
  );
}