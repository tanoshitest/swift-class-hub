import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar, User, MapPin, ExternalLink, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useStore } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/schedule")({
  head: () => ({ meta: [{ title: "Quản lý lịch dạy — STEPS" }] }),
  component: SchedulePage,
});

// Define 5 Standard Teaching Slots (Ca học)
const SHIFTS = [
  { id: "Ca 1", label: "Ca 1", time: "08:00 - 09:30" },
  { id: "Ca 2", label: "Ca 2", time: "09:45 - 11:15" },
  { id: "Ca 3", label: "Ca 3", time: "14:00 - 15:30" },
  { id: "Ca 4", label: "Ca 4", time: "16:00 - 17:30" },
  { id: "Ca 5", label: "Ca 5", time: "18:00 - 19:30" },
] as const;

// Weekdays mapping
const DAYS_OF_WEEK = [
  { key: "Thứ 2", label: "Thứ Hai" },
  { key: "Thứ 3", label: "Thứ Ba" },
  { key: "Thứ 4", label: "Thứ Tư" },
  { key: "Thứ 5", label: "Thứ Năm" },
  { key: "Thứ 6", label: "Thứ Sáu" },
  { key: "Thứ 7", label: "Thứ Bảy" },
  { key: "Chủ Nhật", label: "Chủ Nhật" },
] as const;

// Get Monday of the week of a given date
function getMonday(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(date.setDate(diff));
}

// Add days to a date
function addDays(d: Date, days: number) {
  const date = new Date(d);
  date.setDate(date.getDate() + days);
  return date;
}

// Format date as DD/MM/YYYY
function formatDate(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// Format date as DD/MM
function formatDateShort(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
}

// Check if a date falls within class duration
function isClassActiveInWeek(classStartStr: string, classEndStr: string, startOfWeek: Date, endOfWeek: Date) {
  const classStart = new Date(classStartStr);
  const classEnd = new Date(classEndStr);
  
  // Clear time for precise day comparison
  classStart.setHours(0, 0, 0, 0);
  classEnd.setHours(23, 59, 59, 999);
  
  const weekStart = new Date(startOfWeek);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(endOfWeek);
  weekEnd.setHours(23, 59, 59, 999);

  return classStart <= weekEnd && classEnd >= weekStart;
}

// Color matching function for clean visual appearance
function getClassStyle(classId: string) {
  switch (classId) {
    case "c1":
      return "bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-l-4 border-blue-500 hover:bg-blue-100/70 dark:hover:bg-blue-900/50";
    case "c2":
      return "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-l-4 border-emerald-500 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/50";
    case "c3":
      return "bg-violet-50 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300 border-l-4 border-violet-500 hover:bg-violet-100/70 dark:hover:bg-violet-900/50";
    case "c4":
      default:
      return "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-l-4 border-amber-500 hover:bg-amber-100/70 dark:hover:bg-amber-900/50";
  }
}

function SchedulePage() {
  const { classes, teachers } = useStore();
  const [currentDate, setCurrentDate] = useState<Date>(new Date("2026-05-18")); // default to first class start date

  // Calculate selected week monday and Sunday
  const monday = getMonday(currentDate);
  const sunday = addDays(monday, 6);

  // Generate weekday dates for the column headers
  const weekDates = DAYS_OF_WEEK.map((day, idx) => {
    return {
      ...day,
      date: addDays(monday, idx),
    };
  });

  const teacherName = (id: string) => teachers.find((t) => t.id === id)?.name ?? "—";

  const prevWeek = () => setCurrentDate(addDays(currentDate, -7));
  const nextWeek = () => setCurrentDate(addDays(currentDate, 7));
  const resetToToday = () => setCurrentDate(new Date("2026-05-18"));

  return (
    <div className="p-8 max-w-7xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <PageHeader title="Quản lý lịch dạy" subtitle="Theo dõi và quản lý thời khóa biểu giảng dạy hàng tuần của trung tâm" />
        
        {/* Navigation Actions */}
        <div className="flex items-center gap-3 bg-card border border-border p-2 rounded-xl shadow-sm self-start">
          <button
            onClick={prevWeek}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all border border-border"
            title="Lùi 1 tuần"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <span className="text-sm font-bold text-foreground min-w-[200px] text-center whitespace-nowrap">
            {formatDate(monday)} — {formatDate(sunday)}
          </span>
          
          <button
            onClick={nextWeek}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all border border-border"
            title="Tới 1 tuần"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          
          <div className="h-5 w-px bg-border/80 mx-1" />
          
          <button
            onClick={resetToToday}
            className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-muted transition-all flex items-center gap-1.5"
          >
            <RefreshCw className="h-3 w-3" /> Trở về mốc gốc
          </button>
        </div>
      </div>

      {/* Main Google Calendar Grid */}
      <div className="rounded-xl border border-border bg-card shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[900px] divide-y divide-border">
            
            {/* Header row: Days of the week */}
            <div className="grid grid-cols-8 bg-muted/40 text-xs font-bold text-muted-foreground text-center border-b border-border">
              {/* Top-left empty slot */}
              <div className="py-4 border-r border-border/70 flex flex-col justify-center items-center">
                <Calendar className="h-4 w-4 text-muted-foreground/60 mb-0.5" />
                <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-extrabold">Ca học</span>
              </div>
              
              {weekDates.map((w) => {
                const isCurrent = formatDate(w.date) === formatDate(new Date("2026-05-18")); // mock today highlight
                return (
                  <div key={w.key} className={cn("py-3 border-r border-border/70 flex flex-col items-center justify-center gap-0.5", isCurrent && "bg-primary/5")}>
                    <span className={cn("text-[11px] font-extrabold uppercase tracking-wide", isCurrent ? "text-primary" : "text-muted-foreground")}>
                      {w.label}
                    </span>
                    <span className={cn("text-base font-extrabold rounded-full px-2 py-0.5 min-w-[32px] text-center", isCurrent ? "bg-primary text-primary-foreground" : "text-foreground")}>
                      {formatDateShort(w.date)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Shifts & Schedule slots rows */}
            {SHIFTS.map((shift) => (
              <div key={shift.id} className="grid grid-cols-8 min-h-[110px]">
                
                {/* Left shift metadata */}
                <div className="p-3 border-r border-border/70 bg-muted/20 flex flex-col justify-center items-center text-center gap-0.5">
                  <span className="text-xs font-extrabold text-foreground">{shift.label}</span>
                  <span className="text-[10px] text-muted-foreground font-medium whitespace-nowrap">{shift.time}</span>
                </div>

                {/* Grid columns for each weekday */}
                {weekDates.map((day) => {
                  const scheduledClasses = classes.filter((c) => {
                    const isActive = isClassActiveInWeek(c.startDate, c.endDate, monday, sunday);
                    if (!isActive) return false;
                    
                    return c.schedule.some((sch: any) => {
                      const dayMatch = 
                        sch.day === day.key || 
                        (sch.day === 1 && day.key === "Thứ 2") ||
                        (sch.day === 2 && day.key === "Thứ 3") ||
                        (sch.day === 3 && day.key === "Thứ 4") ||
                        (sch.day === 4 && day.key === "Thứ 5") ||
                        (sch.day === 5 && day.key === "Thứ 6") ||
                        (sch.day === 6 && day.key === "Thứ 7") ||
                        (sch.day === 7 && day.key === "Chủ Nhật");
                        
                      const slotMatch = 
                        sch.slot === shift.id ||
                        (sch.slotId === "s1" && shift.id === "Ca 1") ||
                        (sch.slotId === "s2" && shift.id === "Ca 2") ||
                        (sch.slotId === "s3" && shift.id === "Ca 3") ||
                        (sch.slotId === "s4" && shift.id === "Ca 4") ||
                        (sch.slotId === "s5" && shift.id === "Ca 5") ||
                        (sch.slot === "s1" && shift.id === "Ca 1") ||
                        (sch.slot === "s2" && shift.id === "Ca 2") ||
                        (sch.slot === "s3" && shift.id === "Ca 3") ||
                        (sch.slot === "s4" && shift.id === "Ca 4") ||
                        (sch.slot === "s5" && shift.id === "Ca 5");
                        
                      return dayMatch && slotMatch;
                    });
                  });

                  return (
                    <div
                      key={day.key}
                      className={cn(
                        "p-1.5 border-r border-border/70 bg-background/50 hover:bg-muted/10 transition-colors flex flex-col gap-1.5 overflow-hidden",
                        formatDate(day.date) === formatDate(new Date("2026-05-18")) && "bg-primary/5/10"
                      )}
                    >
                      {scheduledClasses.map((c) => (
                        <Link
                          key={c.id}
                          to={`/classes/${c.id}`}
                          className={cn(
                            "flex-1 p-2 rounded-lg border border-border/40 flex flex-col justify-between text-left shadow-xs cursor-pointer group transition-all duration-200 select-none",
                            getClassStyle(c.id)
                          )}
                          title={`Xem chi tiết lớp ${c.name}`}
                        >
                          <div className="space-y-1">
                            <div className="text-[11px] font-extrabold tracking-tight line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                              {c.name}
                            </div>
                            <div className="flex items-center gap-1 text-[9px] font-medium opacity-85">
                              <User className="h-2.5 w-2.5 shrink-0" />
                              <span className="truncate">{teacherName(c.teacherId)}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[9px] font-medium opacity-85">
                              <MapPin className="h-2.5 w-2.5 shrink-0" />
                              <span className="truncate">{c.room}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-1 pt-1 border-t border-current/10 text-[8px] font-semibold tracking-wider uppercase opacity-75">
                            <span>CAM System</span>
                            <ExternalLink className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend guide */}
      <div className="flex flex-wrap items-center justify-center gap-4 bg-muted/20 p-4 rounded-xl border border-border text-xs text-muted-foreground font-semibold">
        <span className="text-foreground uppercase text-[10px] tracking-wider font-extrabold mr-2">Màu sắc các lớp học:</span>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
          <span>Tiếng Anh Cambridge Stage 9</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <span>Tiếng Anh Giao Tiếp Quốc Tế</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-violet-500" />
          <span>Tiếng Anh IELTS Masterclass</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
          <span>Tiếng Anh SAT Prep & Vocab</span>
        </div>
      </div>
    </div>
  );
}
