import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, GraduationCap, Users, BookOpen, Wallet, Settings, School } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/teachers", label: "Giáo viên", icon: GraduationCap },
  { to: "/students", label: "Học sinh", icon: Users },
  { to: "/classes", label: "Lớp học", icon: BookOpen },
  { to: "/finance", label: "Học phí", icon: Wallet },
  { to: "/master-data", label: "Dữ liệu gốc", icon: Settings },
] as const;

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="hidden md:flex w-60 shrink-0 border-r border-border bg-card flex-col">
      <div className="h-14 flex items-center gap-2 px-4 border-b border-border">
        <div className="h-8 w-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
          <School className="h-4 w-4" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold">EduCenter</div>
          <div className="text-[11px] text-muted-foreground">Quản trị trung tâm</div>
        </div>
      </div>
      <nav className="flex-1 p-2 space-y-0.5">
        {items.map((it) => {
          const active = it.to === "/" ? pathname === "/" : pathname.startsWith(it.to);
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                active
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-foreground/70 hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{it.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-border text-[11px] text-muted-foreground">
        Admin • v1.0
      </div>
    </aside>
  );
}