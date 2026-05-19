import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, GraduationCap, Users, BookOpen, Wallet, Settings, School, BarChart3, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/teachers", label: "Giáo viên", icon: GraduationCap },
  { to: "/students", label: "Học sinh", icon: Users },
  { to: "/classes", label: "Lớp học", icon: BookOpen },
  { to: "/schedule", label: "Quản lý lịch dạy", icon: Calendar },
  { to: "/finance", label: "Học phí", icon: Wallet },
  { to: "/master-data", label: "Dữ liệu gốc", icon: Settings },
  { to: "/reports", label: "Báo cáo", icon: BarChart3 },
] as const;

interface AppSidebarProps {
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
}

export function AppSidebar({ collapsed, setCollapsed }: AppSidebarProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className={cn(
      "hidden md:flex shrink-0 border-r border-border bg-card flex-col transition-all duration-300 ease-in-out",
      collapsed ? "w-16" : "w-60"
    )}>
      <div className={cn(
        "h-14 flex items-center border-b border-border",
        collapsed ? "justify-center px-0" : "justify-between px-3"
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="h-8 w-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center shrink-0">
              <School className="h-4 w-4" />
            </div>
            <div className="leading-tight animate-in fade-in duration-200">
              <div className="text-sm font-semibold whitespace-nowrap">STEPS</div>
              <div className="text-[11px] text-muted-foreground whitespace-nowrap">Quản trị trung tâm</div>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
          title={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
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
                  : "text-foreground/70 hover:bg-muted hover:text-foreground",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? it.label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="animate-in fade-in duration-200 whitespace-nowrap">{it.label}</span>}
            </Link>
          );
        })}
      </nav>
      <div className={cn(
        "p-3 border-t border-border text-[11px] text-muted-foreground whitespace-nowrap overflow-hidden text-center",
        !collapsed && "text-left"
      )}>
        {collapsed ? "v1.0" : "Admin • v1.0"}
      </div>
    </aside>
  );
}