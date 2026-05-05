import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, X, CalendarDays, Users, Bookmark } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
}

export function AppLayout({ children }: Props) {
  const [open, setOpen] = useState(false);
  const [pickedDate, setPickedDate] = useState<Date | undefined>(undefined);
  const navigate = useNavigate();

  const goToDate = () => {
    if (!pickedDate) return;
    const key = `${pickedDate.getFullYear()}-${String(pickedDate.getMonth() + 1).padStart(2, "0")}-${String(pickedDate.getDate()).padStart(2, "0")}`;
    setOpen(false);
    navigate({ to: "/", hash: `date-${key}` });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-4 sm:py-5">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="-ml-1 inline-flex h-9 w-9 items-center justify-center rounded-md text-primary transition-colors hover:bg-card active:scale-95"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/" className="flex flex-col leading-tight">
            <span className="text-xl font-black uppercase tracking-[0.18em] text-primary sm:text-2xl">
              Club Carousel
            </span>
            <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              Tonight & beyond
            </span>
          </Link>
        </div>
      </header>

      {/* Sidebar overlay */}
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[80vw] transform border-r border-border bg-card transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <span className="text-sm font-bold uppercase tracking-[0.2em] text-primary">
            Menu
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="flex flex-col p-2">
          <SidebarLink to="/" icon={<CalendarDays className="h-4 w-4" />} onClick={() => setOpen(false)}>
            Agenda
          </SidebarLink>
          <SidebarLink to="/artists" icon={<Users className="h-4 w-4" />} onClick={() => setOpen(false)}>
            Artists
          </SidebarLink>
          <SidebarLink to="/saved" icon={<Bookmark className="h-4 w-4" />} onClick={() => setOpen(false)}>
            Saved Events
          </SidebarLink>
        </nav>

        <div className="border-t border-border px-3 pb-4 pt-4">
          <div className="px-1 pb-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Filter by date
          </div>
          <Calendar
            mode="single"
            selected={pickedDate}
            onSelect={setPickedDate}
            className={cn("p-2 pointer-events-auto")}
          />
          <button
            type="button"
            onClick={goToDate}
            disabled={!pickedDate}
            className="mt-2 w-full rounded-md bg-primary px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            Go
          </button>
          <p className="mt-2 px-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Scroll up or down to browse other dates
          </p>
        </div>
      </aside>

      <main className="mx-auto max-w-2xl px-4 pb-24 pt-2">{children}</main>
    </div>
  );
}

function SidebarLink({
  to,
  icon,
  children,
  onClick,
}: {
  to: string;
  icon: ReactNode;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      activeOptions={{ exact: to === "/" }}
      activeProps={{ className: "bg-background text-primary" }}
      className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium uppercase tracking-[0.15em] text-foreground transition-colors hover:bg-background hover:text-primary"
    >
      {icon}
      {children}
    </Link>
  );
}