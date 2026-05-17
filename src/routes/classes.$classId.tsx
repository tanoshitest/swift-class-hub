import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft, BookOpen, ClipboardCheck, Star, MessageSquare,
  Users, Calendar, DollarSign, TrendingUp, CheckCircle2, XCircle, Clock,
  BookMarked, Layers, Target, Activity, Settings, Plus, Trash2, Award, FileSpreadsheet, Check
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useStore, formatVND, initialSessions, type Attendance, type LessonSession, type StudentSessionRecord } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const Route = createFileRoute("/classes/$classId")({
  head: () => ({ meta: [{ title: "Chi tiết lớp — STEPS" }] }),
  component: ClassDetailPage,
});

type Tab = "overview" | "lesson" | "homework" | "attendance" | "evaluation";

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "overview",   label: "Tổng quan lớp", icon: BookMarked },
  { id: "lesson",     label: "Nội dung dạy",   icon: BookOpen },
  { id: "homework",   label: "Homework",       icon: FileSpreadsheet },
  { id: "attendance", label: "Điểm danh",      icon: ClipboardCheck },
  { id: "evaluation", label: "Điểm & Nhận xét", icon: Star },
];

const ATTENDANCE_CONFIG = {
  present: { label: "Có mặt", color: "emerald", icon: CheckCircle2 },
  late:    { label: "Đi trễ", color: "amber",   icon: Clock },
  absent:  { label: "Vắng",   color: "rose",    icon: XCircle },
} as const;

function ScoreBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted-foreground text-xs">—</span>;
  const color = value >= 8 ? "text-emerald-600 dark:text-emerald-400" : value >= 6.5 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400";
  return <span className={cn("font-bold tabular-nums text-sm", color)}>{value.toFixed(1)}</span>;
}

function AttendancePill({ status }: { status: Attendance }) {
  const cfg = ATTENDANCE_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full",
      status === "present" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
      : status === "late" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
      : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
    )}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

function ClassDetailPage() {
  const { classId } = useParams({ from: "/classes/$classId" });
  const { classes, setClasses, teachers, rooms, students, feeConfigs } = useStore();
  const cls = classes.find((c) => c.id === classId);

  // Initialize interactive sessions list in local state for live persistence within this screen
  const [sessionsList, setSessionsList] = useState<LessonSession[]>(() => 
    initialSessions.filter((s) => s.classId === classId)
  );

  const [sessionId, setSessionId] = useState<string>(sessionsList[0]?.id ?? "");
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [billingMethod, setBillingMethod] = useState<"course" | "month" | any>("month");

  if (!cls) {
    return (
      <div className="p-8">
        <PageHeader title="Không tìm thấy lớp" />
        <Link to="/classes" className="text-sm text-primary inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Quay lại danh sách lớp
        </Link>
      </div>
    );
  }

  const teacher = teachers.find((t) => t.id === cls.teacherId);
  const room = rooms.find((r) => r.id === cls.roomId);
  const classStudents = cls.studentIds.map((id) => students.find((s) => s.id === id)).filter(Boolean) as typeof students;

  const session = sessionsList.find((s) => s.id === sessionId) || sessionsList[0];
  const records = session?.records ?? [];

  // Update a student's session record (attendance, class score, homework score, comment) in state
  const handleUpdateRecord = (sid: string, updates: Partial<StudentSessionRecord>) => {
    if (!session) return;
    setSessionsList(prev => prev.map(s => {
      if (s.id !== session.id) return s;
      return {
        ...s,
        records: s.records.map(r => r.studentId === sid ? { ...r, ...updates } : r)
      };
    }));
  };

  // Stats derived from current session records
  const avgClassScore = records.filter(r => r.classScore !== null).reduce((a, b) => a + (b.classScore ?? 0), 0) / (records.filter(r => r.classScore !== null).length || 1);
  const presentCount = records.filter(r => r.attendance === "present").length;
  const absentCount = records.filter(r => r.attendance === "absent").length;
  const lateCount   = records.filter(r => r.attendance === "late").length;

  const feeConfig = feeConfigs?.find(f => f.id === cls.feeConfigId) || feeConfigs?.[0];

  const handleEnroll = () => {
    if (!selectedStudentId) return;
    if (cls.studentIds.includes(selectedStudentId)) return;

    const updatedStudentIds = [...cls.studentIds, selectedStudentId];
    const currentBillings = cls.studentBillings || [];
    const updatedBillings = [
      ...currentBillings.filter(b => b.studentId !== selectedStudentId),
      { studentId: selectedStudentId, billingMethod }
    ];

    const updatedClass = {
      ...cls,
      studentIds: updatedStudentIds,
      studentBillings: updatedBillings
    };

    setClasses(classes.map(c => c.id === cls.id ? updatedClass : c));
    setEnrollOpen(false);
    setSelectedStudentId("");
  };

  const handleUnenroll = (sid: string) => {
    const updatedStudentIds = cls.studentIds.filter(id => id !== sid);
    const currentBillings = cls.studentBillings || [];
    const updatedBillings = currentBillings.filter(b => b.studentId !== sid);

    const updatedClass = {
      ...cls,
      studentIds: updatedStudentIds,
      studentBillings: updatedBillings
    };

    setClasses(classes.map(c => c.id === cls.id ? updatedClass : c));
  };

  return (
    <div className="p-6 max-w-7xl space-y-6">
      {/* Breadcrumb */}
      <Link to="/classes" className="text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-foreground transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Lớp học
      </Link>

      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{cls.name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5 font-medium">
            GV: {teacher?.name ?? "—"} &bull; {room?.name ?? "—"} &bull; {classStudents.length} học sinh
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-extrabold text-primary tabular-nums">
            {feeConfig ? formatVND(feeConfig.monthFee) : formatVND(cls.feePerMonth)}
          </div>
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">/ tháng (Cấu hình chuẩn)</div>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Tổng buổi đã học", value: sessionsList.length, icon: Layers, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-500/10" },
          { label: "Học sinh xếp lớp",  value: classStudents.length, icon: Users, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10" },
          { label: "TB điểm buổi này", value: records.length ? avgClassScore.toFixed(1) : "—", icon: TrendingUp, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Học phí theo khóa", value: feeConfig ? formatVND(feeConfig.courseFee) : "—", icon: DollarSign, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3 shadow-xs hover:shadow-sm transition-all">
            <div className={cn("rounded-lg p-2.5 shrink-0", c.bg)}>
              <c.icon className={cn("h-5 w-5", c.color)} />
            </div>
            <div className="min-w-0">
              <div className={cn("font-extrabold text-base md:text-lg tabular-nums leading-none mb-1", c.color)}>{c.value}</div>
              <div className="text-[11px] font-semibold text-muted-foreground leading-tight">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Two Column Layout: Left (Sessions & Big Tests Sidebar) - Right (Fixed Tabs Content) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Sidebar: Scrollable Session & Big Test List */}
        <div className="lg:col-span-1 border border-border rounded-xl bg-card shadow-sm flex flex-col h-[700px]">
          <div className="p-4 border-b border-border bg-muted/20">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-primary" />
              Lịch trình bài giảng
            </h3>
            <p className="text-[11px] text-muted-foreground font-medium mt-0.5">30 buổi học & bài kiểm tra Cambridge</p>
          </div>
          
          <div className="overflow-y-auto flex-1 p-2 space-y-1 scrollbar-thin">
            {sessionsList.map((s) => {
              const isSelected = s.id === sessionId;
              const isBigTest = s.sessionNo === 15 || s.sessionNo === 30;
              
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    setSessionId(s.id);
                    // Automatically route to Lesson if user is on Overview to see session contents
                    if (activeTab === "overview") {
                      setActiveTab("lesson");
                    }
                  }}
                  className={cn(
                    "w-full p-2.5 rounded-lg text-left flex flex-col gap-1 transition-all border",
                    isSelected
                      ? "bg-primary/5 text-primary border-primary/20 shadow-xs"
                      : "bg-transparent text-foreground hover:bg-muted/30 border-transparent"
                  )}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className={cn(
                      "text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-full tracking-wider leading-none",
                      isBigTest 
                        ? "bg-rose-500 text-white" 
                        : isSelected 
                          ? "bg-primary/10 text-primary" 
                          : "bg-muted text-muted-foreground"
                    )}>
                      {isBigTest ? "🔥 Big Test" : `Buổi ${s.sessionNo}`}
                    </span>
                    <span className="text-[10px] font-semibold text-muted-foreground">{s.date}</span>
                  </div>
                  
                  <div className="text-xs font-bold truncate pr-1">
                    {s.topic}
                  </div>
                  
                  {isBigTest && (
                    <div className="text-[9px] font-bold text-rose-500 flex items-center gap-1 mt-0.5 leading-none">
                      <Award className="h-3 w-3 shrink-0" />
                      <span>Bài kiểm tra đánh giá năng lực</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Dashboard: Fixed Tab Area */}
        <div className="lg:col-span-3 border border-border rounded-xl bg-card shadow-sm flex flex-col min-h-[700px]">
          
          {/* Tab Selection Row (Fixed Position) */}
          <div className="flex border-b border-border bg-muted/10 overflow-x-auto shrink-0 select-none">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={cn(
                    "flex items-center gap-2 px-5 py-4 text-xs font-bold transition-all border-b-2 -mb-px shrink-0 uppercase tracking-wider",
                    activeTab === t.id
                      ? "border-primary text-primary bg-background shadow-xs"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Dynamic Content Panel (Changes depending on Active Tab, Tab List position remains constant) */}
          <div className="flex-1 p-5 overflow-y-auto">
            
            {/* ── Tab 1: Tổng quan lớp ───────────────────────────────────────── */}
            {activeTab === "overview" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Fee setup banner */}
                <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
                        <Settings className="h-4 w-4 text-primary" />
                        Cấu hình Học phí của Lớp
                      </h3>
                      <p className="text-xs text-muted-foreground">Chi tiết biểu phí áp dụng chuẩn theo danh mục cấu hình độ tuổi</p>
                    </div>
                    <span className="text-[10px] font-extrabold bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20 uppercase tracking-wide">
                      {feeConfig?.name || "Cấu hình tiêu chuẩn"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-lg border border-border p-4 bg-muted/5 space-y-2 hover:border-emerald-500/30 transition-all">
                      <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Học phí theo khóa (Trọn gói)</div>
                      <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {feeConfig ? formatVND(feeConfig.courseFee) : "—"}
                      </div>
                      <p className="text-[11px] text-muted-foreground">Học viên đóng trọn gói một lần duy nhất cho toàn bộ chương trình</p>
                    </div>
                    
                    <div className="rounded-lg border border-border p-4 bg-muted/5 space-y-2 hover:border-primary/30 transition-all">
                      <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Học phí theo tháng (Định kỳ)</div>
                      <div className="text-xl font-extrabold text-primary tabular-nums">
                        {feeConfig ? formatVND(feeConfig.monthFee) : "—"}
                      </div>
                      <p className="text-[11px] text-muted-foreground">Phí tích lũy và thu định kỳ hàng tháng theo kế hoạch đào tạo</p>
                    </div>
                  </div>
                </div>

                {/* Duration & Scheduling Grid */}
                <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      Lịch trình & Lịch học
                    </h3>
                    <p className="text-xs text-muted-foreground">Kế hoạch đào tạo chi tiết và thời hạn kết thúc dự kiến</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="rounded-lg border border-border p-3 bg-muted/5 space-y-1">
                      <div className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Hình thức mặc định</div>
                      <div className="font-extrabold text-foreground">
                        {cls.tuitionType === "course" ? "Theo Khóa" : "Theo Tháng"}
                      </div>
                    </div>

                    <div className="rounded-lg border border-border p-3 bg-muted/5 space-y-1">
                      <div className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Ngày bắt đầu học</div>
                      <div className="font-extrabold text-foreground">
                        {cls.startDate ? new Date(cls.startDate).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—"}
                      </div>
                    </div>

                    <div className="rounded-lg border border-border p-3 bg-muted/5 space-y-1">
                      <div className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Tổng số buổi dạy</div>
                      <div className="font-extrabold text-foreground">
                        {cls.totalSessions || 30} buổi
                      </div>
                    </div>

                    <div className="rounded-lg border border-border p-3 bg-primary/5 border-primary/20 space-y-1">
                      <div className="text-[9px] uppercase font-bold text-primary tracking-wider">Kết thúc (Dự kiến)</div>
                      <div className="font-extrabold text-primary">
                        {cls.endDate ? new Date(cls.endDate).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enrolled Students Table */}
                <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
                  <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-muted/5">
                    <div>
                      <h3 className="text-sm font-bold">Danh sách học viên đang xếp lớp</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Quản lý phân loại hình thức đóng phí chi tiết của học viên</p>
                    </div>
                    <Dialog open={enrollOpen} onOpenChange={setEnrollOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-primary hover:bg-primary/95 text-white font-semibold">
                          <Plus className="h-4 w-4 mr-1.5" /> Xếp lớp học viên
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Xếp lớp cho Học viên mới</DialogTitle>
                          <DialogDescription>
                            Bắt buộc chọn hình thức thu phí khi xếp lớp học viên vào lớp.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-3">
                          <div className="grid gap-2">
                            <Label htmlFor="student">Chọn Học viên</Label>
                            <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                              <SelectTrigger id="student">
                                <SelectValue placeholder="Chọn học viên..." />
                              </SelectTrigger>
                              <SelectContent>
                                {students
                                  .filter(s => !cls.studentIds.includes(s.id))
                                  .map(s => (
                                    <SelectItem key={s.id} value={s.id}>{s.name} (PH: {s.parentName})</SelectItem>
                                  ))}
                                {students.filter(s => !cls.studentIds.includes(s.id)).length === 0 && (
                                  <div className="p-2 text-xs text-muted-foreground text-center">Tất cả học viên đã được xếp lớp</div>
                                )}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="grid gap-3">
                            <Label className="text-[10px] font-extrabold text-foreground uppercase tracking-wider">Hình thức thu phí</Label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => setBillingMethod("course")}
                                className={cn(
                                  "flex flex-col items-center justify-between rounded-lg border p-4 text-center cursor-pointer hover:bg-muted/50 transition-all",
                                  billingMethod === "course" ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/20" : "border-border bg-card text-foreground"
                                )}
                              >
                                <Layers className="mb-2 h-5 w-5 text-emerald-600" />
                                <span className="font-bold text-xs">Trọn gói theo khóa</span>
                                <span className="text-[10px] text-muted-foreground mt-1 tabular-nums">{feeConfig ? formatVND(feeConfig.courseFee) : "—"}</span>
                              </button>
                              
                              <button
                                type="button"
                                onClick={() => setBillingMethod("month")}
                                className={cn(
                                  "flex flex-col items-center justify-between rounded-lg border p-4 text-center cursor-pointer hover:bg-muted/50 transition-all",
                                  billingMethod === "month" ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/20" : "border-border bg-card text-foreground"
                                )}
                              >
                                <Calendar className="mb-2 h-5 w-5 text-primary" />
                                <span className="font-bold text-xs">Theo tháng</span>
                                <span className="text-[10px] text-muted-foreground mt-1 tabular-nums">{feeConfig ? formatVND(feeConfig.monthFee) : "—"}/tháng</span>
                              </button>
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" size="sm" onClick={() => setEnrollOpen(false)}>Hủy</Button>
                          <Button size="sm" onClick={handleEnroll} disabled={!selectedStudentId}>Xác nhận xếp lớp</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
                      <tr>
                        <th className="text-left px-5 py-2.5 font-bold w-10">#</th>
                        <th className="text-left px-5 py-2.5 font-bold">Tên Học sinh</th>
                        <th className="text-left px-5 py-2.5 font-bold">Phụ huynh liên hệ</th>
                        <th className="text-left px-5 py-2.5 font-bold">Hình thức đóng phí</th>
                        <th className="w-16 px-5 py-2.5"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {classStudents.map((stu, idx) => {
                        const billing = cls.studentBillings?.find(b => b.studentId === stu.id)?.billingMethod || "month";
                        return (
                          <tr key={stu.id} className="hover:bg-muted/15 transition-colors">
                            <td className="px-5 py-3.5 text-muted-foreground tabular-nums">{idx + 1}</td>
                            <td className="px-5 py-3.5 font-bold text-foreground">
                              <div>{stu.name}</div>
                              <div className="text-[10px] font-medium text-muted-foreground mt-0.5">{stu.dob || "—"}</div>
                            </td>
                            <td className="px-5 py-3.5 text-muted-foreground text-xs">
                              <div className="font-semibold text-foreground/80">{stu.parentName}</div>
                              <div className="font-mono mt-0.5">{stu.parentPhone}</div>
                            </td>
                            <td className="px-5 py-3.5">
                              {billing === "course" ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                  <Layers className="h-3 w-3" /> Theo khóa
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                  <Calendar className="h-3 w-3" /> Theo tháng
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <button className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors" onClick={() => handleUnenroll(stu.id)}>
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {classStudents.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-5 py-10 text-center text-sm text-muted-foreground">Chưa có học viên nào trong lớp này</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* If there is no session matching and user is NOT on General tab, show fallback banner */}
            {!session && activeTab !== "overview" && (
              <div className="p-12 text-center space-y-3">
                <BookOpen className="h-10 w-10 text-muted-foreground/60 mx-auto" />
                <h3 className="font-semibold text-sm">Chưa có dữ liệu buổi học nào</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">Vui lòng chọn hoặc thiết lập lộ trình các buổi dạy trước.</p>
              </div>
            )}

            {/* Render session dependent tabs */}
            {session && activeTab !== "overview" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                
                {/* Active Session Summary Header */}
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase bg-primary text-primary-foreground px-2 py-0.5 rounded-full leading-none tracking-wider">
                        {session.sessionNo === 15 || session.sessionNo === 30 ? "🔥 Big Test" : `Buổi học số ${session.sessionNo}`}
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground">{session.date}</span>
                    </div>
                    <h2 className="text-base font-extrabold text-foreground mt-1 line-clamp-1">{session.topic}</h2>
                  </div>
                  <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 uppercase tracking-wide whitespace-nowrap hidden sm:block">
                    Hệ Cambridge (CAM)
                  </div>
                </div>

                {/* ── Tab 2: Nội dung dạy ────────────────────────────────────────── */}
                {activeTab === "lesson" && (
                  <div className="grid md:grid-cols-2 gap-5 text-sm">
                    {/* Objectives */}
                    <div className="space-y-3 border border-border p-4 rounded-xl bg-card">
                      <div className="flex items-center gap-2 pb-2 border-b border-dashed border-border">
                        <Target className="h-4 w-4 text-violet-500" />
                        <span className="font-bold text-foreground">Mục tiêu bài học (Objectives)</span>
                      </div>
                      <ul className="space-y-2">
                        {session.objectives.map((o, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0 animate-pulse" />
                            <span className="text-xs text-foreground font-medium leading-relaxed">{o}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Materials */}
                    <div className="space-y-3 border border-border p-4 rounded-xl bg-card">
                      <div className="flex items-center gap-2 pb-2 border-b border-dashed border-border">
                        <Layers className="h-4 w-4 text-blue-500" />
                        <span className="font-bold text-foreground">Tài liệu & Học cụ (Materials)</span>
                      </div>
                      <ul className="space-y-2">
                        {session.materials.map((m, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <span className="inline-block w-5 h-5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <span className="text-xs text-foreground font-medium leading-relaxed">{m}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Activities */}
                    <div className="md:col-span-2 space-y-3 border border-border p-4 rounded-xl bg-card">
                      <div className="flex items-center gap-2 pb-2 border-b border-dashed border-border">
                        <Activity className="h-4 w-4 text-amber-500" />
                        <span className="font-bold text-foreground">Hoạt động trên lớp (Classroom Activities)</span>
                      </div>
                      <ol className="space-y-2.5">
                        {session.activities.map((a, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="inline-block min-w-[22px] h-[22px] rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-extrabold text-center leading-[22px] shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <span className="text-xs text-foreground font-medium leading-relaxed">{a}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                )}

                {/* ── Tab 3: Homework ───────────────────────────────────────────── */}
                {activeTab === "homework" && (
                  <div className="space-y-4">
                    {/* Homework description banner */}
                    <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-2">
                      <h3 className="text-xs uppercase font-extrabold tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5 leading-none">
                        <FileSpreadsheet className="h-4 w-4" />
                        Nhiệm vụ & Bài tập về nhà
                      </h3>
                      <p className="text-sm font-bold text-foreground leading-relaxed">{session.homework}</p>
                    </div>

                    {/* Grade status overview table */}
                    <div className="rounded-xl border border-border shadow-xs overflow-hidden">
                      <div className="p-3 bg-muted/20 border-b border-border flex items-center justify-between">
                        <span className="text-xs font-bold">Trạng thái nộp & Chấm điểm bài tập</span>
                        <span className="text-[10px] font-extrabold text-muted-foreground uppercase">Hệ thống CAM</span>
                      </div>
                      <table className="w-full text-sm">
                        <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
                          <tr>
                            <th className="text-left px-4 py-2 font-bold w-10">#</th>
                            <th className="text-left px-4 py-2 font-bold">Học sinh</th>
                            <th className="text-center px-4 py-2 font-bold">Trạng thái nộp</th>
                            <th className="text-center px-4 py-2 font-bold">Điểm số BTVN</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {classStudents.map((stu, i) => {
                            const rec = records.find(r => r.studentId === stu.id);
                            return (
                              <tr key={stu.id} className="hover:bg-muted/15 transition-colors">
                                <td className="px-4 py-3 text-muted-foreground tabular-nums">{i + 1}</td>
                                <td className="px-4 py-3 font-bold text-foreground">{stu.name}</td>
                                <td className="px-4 py-3 text-center">
                                  {rec?.attendance === "absent" ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-muted-foreground bg-muted/40 px-2.5 py-0.5 rounded-full uppercase">
                                      Vắng có phép
                                    </span>
                                  ) : rec && rec.homeworkScore !== null ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full uppercase">
                                      Đã nộp & Chấm điểm
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full uppercase">
                                      Chưa nộp
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <ScoreBadge value={rec?.homeworkScore ?? null} />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ── Tab 4: Điểm danh ──────────────────────────────────────────── */}
                {activeTab === "attendance" && (
                  <div className="space-y-4">
                    {/* Stat summaries */}
                    <div className="flex gap-3 flex-wrap">
                      {[
                        { label: "Có mặt", count: presentCount, bg: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" },
                        { label: "Đi trễ", count: lateCount,   bg: "bg-amber-500/10 text-amber-700 border-amber-500/20" },
                        { label: "Vắng mặt", count: absentCount, bg: "bg-rose-500/10 text-rose-700 border-rose-500/20" },
                      ].map(({ label, count, bg }) => (
                        <div key={label} className={cn("flex items-center gap-3 px-4 py-2 border rounded-xl text-xs font-bold shadow-xs", bg)}>
                          <span className="text-xl font-extrabold tabular-nums leading-none">{count}</span>
                          <span className="opacity-90 leading-none uppercase tracking-wider text-[10px]">{label}</span>
                        </div>
                      ))}
                    </div>

                    {/* Attendance roster grid */}
                    <div className="rounded-xl border border-border shadow-xs overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
                          <tr>
                            <th className="text-left px-4 py-2.5 font-bold w-10">#</th>
                            <th className="text-left px-4 py-2.5 font-bold">Học sinh</th>
                            <th className="text-left px-4 py-2.5 font-bold">Trạng thái hiện tại</th>
                            <th className="text-center px-4 py-2.5 font-bold w-[340px]">Điểm danh nhanh</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {classStudents.map((stu, idx) => {
                            const rec = records.find(r => r.studentId === stu.id);
                            const currentStatus = rec?.attendance ?? "present";
                            
                            return (
                              <tr key={stu.id} className="hover:bg-muted/15 transition-colors">
                                <td className="px-4 py-3.5 text-muted-foreground tabular-nums">{idx + 1}</td>
                                <td className="px-4 py-3.5 font-bold text-foreground">
                                  <div>{stu.name}</div>
                                  <div className="text-[10px] font-medium text-muted-foreground mt-0.5">PH: {stu.parentName}</div>
                                </td>
                                <td className="px-4 py-3.5">
                                  <AttendancePill status={currentStatus} />
                                </td>
                                <td className="px-4 py-3.5 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    {(["present", "late", "absent"] as Attendance[]).map((status) => {
                                      const isActive = currentStatus === status;
                                      const cfg = ATTENDANCE_CONFIG[status];
                                      
                                      return (
                                        <button
                                          key={status}
                                          type="button"
                                          onClick={() => handleUpdateRecord(stu.id, { attendance: status })}
                                          className={cn(
                                            "px-3 py-1.5 rounded-lg border text-xs font-bold transition-all shadow-xs shrink-0 select-none",
                                            isActive
                                              ? status === "present"
                                                ? "bg-emerald-600 text-white border-emerald-600"
                                                : status === "late"
                                                  ? "bg-amber-500 text-white border-amber-500"
                                                  : "bg-rose-600 text-white border-rose-600"
                                              : status === "present"
                                                ? "border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                                                : status === "late"
                                                  ? "border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
                                                  : "border-rose-500/30 text-rose-600 hover:bg-rose-500/10"
                                          )}
                                        >
                                          {cfg.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ── Tab 5: Nhập Điểm & Nhận xét ─────────────────────────────── */}
                {activeTab === "evaluation" && (
                  <div className="space-y-4">
                    {/* Auto-saved indicator header */}
                    <div className="flex items-center justify-between pb-2 border-b border-border">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cập nhật kết quả bài tập & nhận xét</span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md leading-none border border-emerald-500/20">
                        <Check className="h-3 w-3" /> Tự động lưu tức thì
                      </span>
                    </div>

                    {/* Student cards list with inputs */}
                    <div className="space-y-3.5">
                      {classStudents.map((stu, idx) => {
                        const rec = records.find(r => r.studentId === stu.id);
                        const isAbsent = rec?.attendance === "absent";
                        
                        return (
                          <div
                            key={stu.id}
                            className={cn(
                              "p-4 border rounded-xl shadow-xs transition-all space-y-3 bg-card",
                              isAbsent 
                                ? "border-muted bg-muted/10 opacity-70" 
                                : "border-border hover:border-primary/30"
                            )}
                          >
                            {/* Card top banner */}
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                                  {stu.name.split(" ").pop()?.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-extrabold text-sm">{stu.name}</div>
                                  <div className="text-[10px] font-medium text-muted-foreground mt-0.5">PH: {stu.parentName} • {stu.parentPhone}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {isAbsent && (
                                  <span className="text-[10px] font-bold text-rose-600 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20 uppercase tracking-wide">
                                    Vắng học
                                  </span>
                                )}
                                <AttendancePill status={rec?.attendance ?? "present"} />
                              </div>
                            </div>

                            {/* Scoring inputs */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                              {/* In-class score */}
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Điểm số trên lớp</label>
                                <div className="relative">
                                  <input
                                    type="number"
                                    min="0"
                                    max="10"
                                    step="0.1"
                                    value={rec?.classScore ?? ""}
                                    disabled={isAbsent}
                                    onChange={(e) => {
                                      const val = e.target.value === "" ? null : Math.min(10, Math.max(0, Number(e.target.value) || 0));
                                      handleUpdateRecord(stu.id, { classScore: val });
                                    }}
                                    className="w-full bg-background border border-input rounded-lg h-9 px-3 text-xs font-bold tabular-nums text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                                    placeholder="N/A"
                                  />
                                </div>
                              </div>

                              {/* Homework score */}
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Điểm số Homework</label>
                                <div className="relative">
                                  <input
                                    type="number"
                                    min="0"
                                    max="10"
                                    step="0.1"
                                    value={rec?.homeworkScore ?? ""}
                                    disabled={isAbsent}
                                    onChange={(e) => {
                                      const val = e.target.value === "" ? null : Math.min(10, Math.max(0, Number(e.target.value) || 0));
                                      handleUpdateRecord(stu.id, { homeworkScore: val });
                                    }}
                                    className="w-full bg-background border border-input rounded-lg h-9 px-3 text-xs font-bold tabular-nums text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                                    placeholder="N/A"
                                  />
                                </div>
                              </div>

                              {/* Overall comments */}
                              <div className="space-y-1 sm:col-span-1">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Nhận xét buổi học</label>
                                <input
                                  type="text"
                                  value={rec?.comment ?? ""}
                                  onChange={(e) => handleUpdateRecord(stu.id, { comment: e.target.value })}
                                  className="w-full bg-background border border-input rounded-lg h-9 px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                                  placeholder="Nhập nhận xét nhanh về thái độ, học lực..."
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}