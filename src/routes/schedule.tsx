import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar, User, MapPin, ExternalLink, RefreshCw, Plus, Trash2, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useStore } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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

// Calculate extended class end date considering active holidays
function getExtendedEndDate(cls: any, holidayList: Array<{ date: string; name: string }>) {
  const baseEnd = new Date(cls.endDate);
  
  // Count how many holidays fall on class teaching days between startDate and endDate (inclusive)
  let holidayCount = 0;
  holidayList.forEach((h) => {
    const hDate = new Date(h.date);
    hDate.setHours(0,0,0,0);
    const start = new Date(cls.startDate);
    start.setHours(0,0,0,0);
    const end = new Date(cls.endDate);
    end.setHours(23,59,59,999);
    
    if (hDate >= start && hDate <= end) {
      const jsDay = hDate.getDay();
      const schedDay = jsDay === 0 ? 7 : jsDay;
      const isTeachingDay = cls.schedule.some((s: any) => {
        const dayVal = s.day;
        return dayVal === schedDay ||
               (dayVal === "Thứ 2" && schedDay === 1) ||
               (dayVal === "Thứ 3" && schedDay === 2) ||
               (dayVal === "Thứ 4" && schedDay === 3) ||
               (dayVal === "Thứ 5" && schedDay === 4) ||
               (dayVal === "Thứ 6" && schedDay === 5) ||
               (dayVal === "Thứ 7" && schedDay === 6) ||
               (dayVal === "Chủ Nhật" && schedDay === 7) ||
               (dayVal === 1 && schedDay === 1) ||
               (dayVal === 2 && schedDay === 2) ||
               (dayVal === 3 && schedDay === 3) ||
               (dayVal === 4 && schedDay === 4) ||
               (dayVal === 5 && schedDay === 5) ||
               (dayVal === 6 && schedDay === 6) ||
               (dayVal === 7 && schedDay === 7);
      });
      if (isTeachingDay) {
        holidayCount++;
      }
    }
  });

  if (holidayCount === 0) return baseEnd;

  // Extend the endDate by holidayCount teaching days!
  let currentEnd = new Date(baseEnd);
  let daysExtended = 0;
  while (daysExtended < holidayCount) {
    currentEnd.setDate(currentEnd.getDate() + 1);
    const jsDay = currentEnd.getDay();
    const schedDay = jsDay === 0 ? 7 : jsDay;
    const isTeachingDay = cls.schedule.some((s: any) => {
      const dayVal = s.day;
      return dayVal === schedDay ||
             (dayVal === "Thứ 2" && schedDay === 1) ||
             (dayVal === "Thứ 3" && schedDay === 2) ||
             (dayVal === "Thứ 4" && schedDay === 3) ||
             (dayVal === "Thứ 5" && schedDay === 4) ||
             (dayVal === "Thứ 6" && schedDay === 5) ||
             (dayVal === "Thứ 7" && schedDay === 6) ||
             (dayVal === "Chủ Nhật" && schedDay === 7) ||
             (dayVal === 1 && schedDay === 1) ||
             (dayVal === 2 && schedDay === 2) ||
             (dayVal === 3 && schedDay === 3) ||
             (dayVal === 4 && schedDay === 4) ||
             (dayVal === 5 && schedDay === 5) ||
             (dayVal === 6 && schedDay === 6) ||
             (dayVal === 7 && schedDay === 7);
    });
    if (isTeachingDay) {
      daysExtended++;
    }
  }
  return currentEnd;
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

  // Holidays state: pre-populate with a holiday on May 20th, 2026 (falls on Wednesday of the first week)
  const [holidays, setHolidays] = useState<Array<{ date: string; name: string }>>([
    { date: "2026-05-20", name: "Lễ Giải Phóng miền Nam" }
  ]);
  const [holidayOpen, setHolidayOpen] = useState(false);
  const [newHolidayDate, setNewHolidayDate] = useState("");
  const [newHolidayName, setNewHolidayName] = useState("");

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
    <div className="p-4 sm:p-8 max-w-[1440px] mx-auto space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <PageHeader title="Quản lý lịch dạy" subtitle="Theo dõi và quản lý thời khóa biểu giảng dạy hàng tuần của trung tâm" />
        
        {/* Navigation Actions */}
        <div className="flex flex-wrap items-center gap-3 bg-card border border-border p-2 rounded-xl shadow-sm self-start">
          <button
            onClick={prevWeek}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all border border-border"
            title="Lùi 1 tuần"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <span className="text-sm font-bold text-foreground min-w-[180px] text-center whitespace-nowrap">
            {formatDate(monday)} — {formatDate(sunday)}
          </span>
          
          <button
            onClick={nextWeek}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all border border-border"
            title="Tới 1 tuần"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          
          <div className="h-5 w-px bg-border/80 mx-1 hidden sm:block" />
          
          <button
            onClick={resetToToday}
            className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-muted transition-all flex items-center gap-1.5"
          >
            <RefreshCw className="h-3 w-3" /> Trở về mốc gốc
          </button>

          <button
            onClick={() => setHolidayOpen(true)}
            className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Calendar className="h-3.5 w-3.5 text-rose-500" /> Cấu hình nghỉ lễ
          </button>
        </div>
      </div>

      {/* Main Google Calendar Grid */}
      <div className="rounded-xl border border-border bg-card shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[1000px] divide-y divide-border">
            
            {/* Header row: Days of the week */}
            <div className="grid grid-cols-8 bg-muted/40 text-xs font-bold text-muted-foreground text-center border-b border-border">
              {/* Top-left empty slot */}
              <div className="py-4 border-r border-border/70 flex flex-col justify-center items-center">
                <Calendar className="h-4 w-4 text-muted-foreground/60 mb-0.5" />
                <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-extrabold">Ca học</span>
              </div>
              
              {weekDates.map((w) => {
                const isCurrent = formatDate(w.date) === formatDate(new Date("2026-05-18")); // mock today highlight
                const holiday = holidays.find(h => {
                  const hD = new Date(h.date);
                  hD.setHours(0,0,0,0);
                  const wD = new Date(w.date);
                  wD.setHours(0,0,0,0);
                  return hD.getTime() === wD.getTime();
                });

                return (
                  <div key={w.key} className={cn("py-3 border-r border-border/70 flex flex-col items-center justify-center gap-0.5", holiday ? "bg-rose-500/[0.06] text-rose-600 dark:text-rose-400" : isCurrent && "bg-primary/5")}>
                    <span className={cn("text-[11px] font-extrabold uppercase tracking-wide", holiday ? "text-rose-600 dark:text-rose-400" : isCurrent ? "text-primary" : "text-muted-foreground")}>
                      {w.label}
                    </span>
                    <span className={cn("text-base font-extrabold rounded-full px-2 py-0.5 min-w-[32px] text-center", holiday ? "bg-rose-500/20 text-rose-700 dark:text-rose-300" : isCurrent ? "bg-primary text-primary-foreground" : "text-foreground")}>
                      {formatDateShort(w.date)}
                    </span>
                    {holiday && (
                      <span className="text-[9px] font-extrabold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 px-1 py-0.5 rounded max-w-[110px] truncate leading-none mt-1">
                        🎉 {holiday.name}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Shifts & Schedule slots rows */}
            {SHIFTS.map((shift) => (
              <div key={shift.id} className="grid grid-cols-8 min-h-[120px]">
                
                {/* Left shift metadata */}
                <div className="p-3 border-r border-border/70 bg-muted/20 flex flex-col justify-center items-center text-center gap-0.5">
                  <span className="text-xs font-extrabold text-foreground">{shift.label}</span>
                  <span className="text-[10px] text-muted-foreground font-medium whitespace-nowrap">{shift.time}</span>
                </div>

                {/* Grid columns for each weekday */}
                {weekDates.map((day) => {
                  const holiday = holidays.find(h => {
                    const hD = new Date(h.date);
                    hD.setHours(0,0,0,0);
                    const dD = new Date(day.date);
                    dD.setHours(0,0,0,0);
                    return hD.getTime() === dD.getTime();
                  });

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
                        "p-1.5 border-r border-border/70 bg-background/50 hover:bg-muted/10 transition-colors flex flex-col gap-1.5 overflow-hidden justify-center",
                        holiday ? "bg-rose-500/[0.02]" : formatDate(day.date) === formatDate(new Date("2026-05-18")) && "bg-primary/5/10"
                      )}
                    >
                      {scheduledClasses.map((c) => {
                        if (holiday) {
                          const extendedEnd = getExtendedEndDate(c, holidays);
                          return (
                            <div
                              key={c.id}
                              className="p-2.5 rounded-lg border border-amber-300 dark:border-amber-900 bg-amber-50/70 dark:bg-amber-950/20 flex flex-col text-left shadow-xs transition-all select-none border-l-4 border-l-amber-500 leading-snug"
                              title={`Buổi học của lớp ${c.name} bị trùng lịch nghỉ lễ.`}
                            >
                              <div className="text-[10px] font-extrabold text-amber-700 dark:text-amber-300 flex items-center gap-1 mb-0.5">
                                <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                                Nghỉ lễ: {holiday.name}
                              </div>
                              <div className="text-[10px] font-bold text-foreground line-clamp-1">
                                {c.name}
                              </div>
                              <div className="text-[9px] font-extrabold text-rose-600 dark:text-rose-400 mt-1">
                                ❌ Đóng lớp &bull; Tự động dời buổi (+1)
                              </div>
                              <div className="text-[9px] text-muted-foreground font-semibold leading-tight pt-1 mt-1 border-t border-dashed border-amber-200 dark:border-amber-900/50">
                                📅 Bế giảng mới: {formatDate(extendedEnd)}
                              </div>
                            </div>
                          );
                        }

                        return (
                          <Link
                            key={c.id}
                            to={`/classes/${c.id}`}
                            className={cn(
                              "p-2 rounded-lg border border-border/40 flex flex-col justify-between text-left shadow-xs cursor-pointer group transition-all duration-200 select-none",
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
                        );
                      })}
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

      {/* Holiday Dialog Configurator */}
      <Dialog open={holidayOpen} onOpenChange={setHolidayOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <Calendar className="h-5 w-5" /> Cấu hình ngày nghỉ lễ trung tâm
            </DialogTitle>
            <DialogDescription className="text-xs">
              Thêm các ngày nghỉ lễ. Hệ thống sẽ tự động dời buổi học, cộng dồn +1 buổi học và tự động dời ngày bế giảng của lớp học tương ứng.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3 text-sm">
            {/* Form to Add */}
            <div className="grid grid-cols-1 gap-3 p-3 rounded-lg border border-border bg-muted/20">
              <div className="space-y-1">
                <Label htmlFor="hol-date" className="text-xs font-bold">Ngày nghỉ lễ</Label>
                <Input
                  id="hol-date"
                  type="date"
                  value={newHolidayDate}
                  onChange={(e) => setNewHolidayDate(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="hol-name" className="text-xs font-bold">Tên ngày nghỉ lễ</Label>
                <Input
                  id="hol-name"
                  placeholder="Ví dụ: Tết Nguyên Đán, Giỗ Tổ Hùng Vương..."
                  value={newHolidayName}
                  onChange={(e) => setNewHolidayName(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <Button
                size="sm"
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold h-9 text-xs flex items-center justify-center gap-1.5 mt-1"
                onClick={() => {
                  if (!newHolidayDate || !newHolidayName) return;
                  setHolidays([...holidays, { date: newHolidayDate, name: newHolidayName }]);
                  setNewHolidayDate("");
                  setNewHolidayName("");
                }}
              >
                <Plus className="h-3.5 w-3.5" /> Thêm ngày nghỉ lễ & Đồng bộ lịch
              </Button>
            </div>

            {/* List */}
            <div className="space-y-2">
              <Label className="text-xs font-extrabold text-foreground">Ngày nghỉ đang áp dụng</Label>
              <div className="border border-border rounded-lg overflow-hidden max-h-[160px] overflow-y-auto divide-y divide-border">
                {holidays.map((h, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 text-xs hover:bg-muted/10 transition-colors">
                    <div className="space-y-0.5">
                      <div className="font-extrabold text-foreground">{h.name}</div>
                      <div className="text-[10px] text-muted-foreground font-mono font-medium">{formatDate(new Date(h.date))}</div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-md"
                      onClick={() => setHolidays(holidays.filter((_, idx) => idx !== i))}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                {!holidays.length && (
                  <div className="p-4 text-center text-xs text-muted-foreground italic font-medium">Chưa có ngày nghỉ lễ nào.</div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setHolidayOpen(false)}>Hủy</Button>
            <Button size="sm" className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold" onClick={() => setHolidayOpen(false)}>Áp dụng cấu hình</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
