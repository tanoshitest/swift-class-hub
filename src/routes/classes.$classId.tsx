import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft, BookOpen, ClipboardCheck, Star, MessageSquare,
  Users, Calendar, DollarSign, TrendingUp, CheckCircle2, XCircle, Clock,
  BookMarked, Layers, Target, Activity, Settings, Plus, Trash2, Award, FileSpreadsheet, Check, ChevronLeft
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useStore, formatVND, initialSessions, type Attendance, type LessonSession, type StudentSessionRecord } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const Route = createFileRoute("/classes/$classId")({
  head: () => ({ meta: [{ title: "Chi tiết lớp — STEPS" }] }),
  component: ClassDetailPage,
});

type Tab = "overview" | "lesson" | "report";

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "overview",   label: "Tổng quan lớp", icon: BookMarked },
  { id: "lesson",     label: "In Class",       icon: BookOpen },
  { id: "report",     label: "Báo cáo",        icon: ClipboardCheck },
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
      "inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md border",
      status === "present" ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30"
      : status === "late" ? "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30"
      : "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30"
    )}>
      <Icon className="h-2.5 w-2.5 shrink-0" />
      {cfg.label}
    </span>
  );
}

function ClassDetailPage() {
  const { classId } = useParams({ from: "/classes/$classId" });
  const { classes, setClasses, teachers, rooms, students, sessions, setSessions } = useStore();
  const cls = classes.find((c) => c.id === classId);

  // Read class-specific sessions from central store
  const sessionsList = sessions.filter((s) => s.classId === classId);
  const setSessionsList = (updateFn: ((prev: LessonSession[]) => LessonSession[]) | LessonSession[]) => {
    setSessions(prev => {
      const thisClassSessions = prev.filter(s => s.classId === classId);
      const otherClassSessions = prev.filter(s => s.classId !== classId);
      const updated = typeof updateFn === "function" ? updateFn(thisClassSessions) : updateFn;
      return [...otherClassSessions, ...updated];
    });
  };

  const [sessionId, setSessionId] = useState<string>(() => {
    const classSessions = initialSessions.filter((s) => s.classId === classId);
    return classSessions[0]?.id ?? "";
  });
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // States for session merging
  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeOtherSessionId, setMergeOtherSessionId] = useState<string>("");
  const [deleteOtherSession, setDeleteOtherSession] = useState<boolean>(true);

  // States for session editing
  const [editOpen, setEditOpen] = useState(false);
  const [editTopic, setEditTopic] = useState("");
  const [editObjectives, setEditObjectives] = useState("");
  const [editMaterials, setEditMaterials] = useState("");
  const [editHomework, setEditHomework] = useState("");
  const [editActivities, setEditActivities] = useState("");

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

  const handleMergeSessions = (otherSessionId: string, deleteOther: boolean) => {
    if (!session) return;
    const otherSession = sessionsList.find(s => s.id === otherSessionId);
    if (!otherSession) return;

    // Append In Class content
    const currentLabel = session.mergedLabel || `Buổi ${session.sessionNo}`;
    const otherLabel = otherSession.mergedLabel || `Buổi ${otherSession.sessionNo}`;
    const newMergedLabel = `${currentLabel} + ${otherLabel}`;

    const mergedTopic = `${session.topic} & ${otherSession.topic}`;
    const mergedObjectives = Array.from(new Set([...session.objectives, ...otherSession.objectives]));
    const mergedMaterials = Array.from(new Set([...session.materials, ...otherSession.materials]));
    const mergedActivities = [...session.activities, ...otherSession.activities];
    const mergedHomework = `${session.homework} | ${otherSession.homework}`;

    setSessionsList(prev => {
      // Sort this class sessions by session number to be certain of order
      const thisClassSessions = prev.filter(s => s.classId === classId).sort((a, b) => a.sessionNo - b.sessionNo);
      const otherClassSessions = prev.filter(s => s.classId !== classId);

      // Extract curriculums immutably
      const originalCurriculums = thisClassSessions.map(s => ({
        id: s.id,
        topic: s.topic,
        objectives: s.objectives,
        materials: s.materials,
        activities: s.activities,
        homework: s.homework,
        mergedLabel: s.mergedLabel,
        isBigTest: s.isBigTest
      }));

      // Find indices
      const currentIdx = thisClassSessions.findIndex(s => s.id === session.id);
      const otherIdx = thisClassSessions.findIndex(s => s.id === otherSessionId);

      // Apply merged curriculum content to current session index
      originalCurriculums[currentIdx] = {
        ...originalCurriculums[currentIdx],
        topic: mergedTopic,
        objectives: mergedObjectives,
        materials: mergedMaterials,
        activities: mergedActivities,
        homework: mergedHomework,
        mergedLabel: newMergedLabel,
        isBigTest: session.isBigTest || otherSession.isBigTest
      };

      if (deleteOther) {
        // Remove the other session's curriculum contents from array
        originalCurriculums.splice(otherIdx, 1);
        
        // Push empty placeholder at the end to keep exactly 30 sessions
        originalCurriculums.push({
          id: `temp_${Math.random()}`,
          topic: "Trống",
          objectives: [],
          materials: [],
          activities: [],
          homework: "Không có bài tập về nhà",
          mergedLabel: undefined,
          isBigTest: false
        });
      }

      // Map back to this class sessions
      const newClassSessions = thisClassSessions.map((s, idx) => {
        const curr = originalCurriculums[idx];
        return {
          ...s,
          topic: curr.topic,
          objectives: curr.objectives,
          materials: curr.materials,
          activities: curr.activities,
          homework: curr.homework,
          mergedLabel: curr.mergedLabel,
          isBigTest: curr.isBigTest
        };
      });

      return [...otherClassSessions, ...newClassSessions].sort((a, b) => {
        if (a.classId !== b.classId) return a.classId.localeCompare(b.classId);
        return a.sessionNo - b.sessionNo;
      });
    });

    setMergeOpen(false);
    setMergeOtherSessionId("");
  };

  const handleOpenEdit = () => {
    if (!session) return;
    setEditTopic(session.topic === "Trống" ? "" : session.topic);
    setEditObjectives(session.objectives.join("\n"));
    setEditMaterials(session.materials.join("\n"));
    setEditHomework(session.homework === "Không có bài tập về nhà" ? "" : session.homework);
    setEditActivities(session.activities.join("\n"));
    setEditOpen(true);
  };

  const handleSaveEdit = () => {
    if (!session) return;

    const parsedObjectives = editObjectives.split("\n").map(line => line.trim()).filter(Boolean);
    const parsedMaterials = editMaterials.split("\n").map(line => line.trim()).filter(Boolean);
    const parsedActivities = editActivities.split("\n").map(line => line.trim()).filter(Boolean);
    const parsedTopic = editTopic.trim() || "Trống";
    const parsedHomework = editHomework.trim() || "Không có bài tập về nhà";

    setSessionsList(prev => prev.map(s => {
      if (s.id !== session.id) return s;
      return {
        ...s,
        topic: parsedTopic,
        objectives: parsedObjectives,
        materials: parsedMaterials,
        homework: parsedHomework,
        activities: parsedActivities
      };
    }));

    setEditOpen(false);
  };

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

  const handleAddGradeColumn = () => {
    if (!session) return;
    const columnName = prompt("Nhập tên cột điểm mới (ví dụ: Chuyên cần, Kiểm tra miệng, 15 phút...):");
    if (!columnName || !columnName.trim()) return;

    const columnId = "col_" + Math.random().toString(36).slice(2, 10);
    
    setSessionsList(prev => prev.map(s => {
      if (s.id !== session.id) return s;
      const existingColumns = s.gradeColumns || [];
      return {
        ...s,
        gradeColumns: [...existingColumns, { id: columnId, name: columnName.trim() }],
        records: s.records.map(r => ({
          ...r,
          grades: {
            ...r.grades,
            [columnId]: null
          }
        }))
      };
    }));
  };

  const handleRemoveGradeColumn = (columnId: string) => {
    if (!session) return;
    if (!confirm("Bạn có chắc chắn muốn xóa cột điểm này? Mọi điểm đã nhập của học sinh cho cột này sẽ bị xóa.")) return;
    
    setSessionsList(prev => prev.map(s => {
      if (s.id !== session.id) return s;
      const updatedColumns = (s.gradeColumns || []).filter(col => col.id !== columnId);
      return {
        ...s,
        gradeColumns: updatedColumns,
        records: s.records.map(r => {
          const nextGrades = { ...r.grades };
          delete nextGrades[columnId];
          return {
            ...r,
            grades: nextGrades
          };
        })
      };
    }));
  };

  const handleUpdateCustomGrade = (sid: string, columnId: string, value: number | null) => {
    if (!session) return;
    setSessionsList(prev => prev.map(s => {
      if (s.id !== session.id) return s;
      return {
        ...s,
        records: s.records.map(r => {
          if (r.studentId !== sid) return r;
          return {
            ...r,
            grades: {
              ...r.grades,
              [columnId]: value
            }
          };
        })
      };
    }));
  };

  // Stats derived from current session records
  const allCustomGrades: number[] = [];
  records.forEach(r => {
    if (r.grades) {
      Object.values(r.grades).forEach(v => {
        if (v !== null) allCustomGrades.push(v);
      });
    }
  });

  const avgClassScore = allCustomGrades.length > 0
    ? allCustomGrades.reduce((a, b) => a + b, 0) / allCustomGrades.length
    : records.filter(r => r.classScore !== null).reduce((a, b) => a + (b.classScore ?? 0), 0) / (records.filter(r => r.classScore !== null).length || 1);

  const presentCount = records.filter(r => r.attendance === "present").length;
  const absentCount = records.filter(r => r.attendance === "absent").length;
  const lateCount   = records.filter(r => r.attendance === "late").length;

  const handleEnroll = () => {
    if (!selectedStudentId) return;
    if (cls.studentIds.includes(selectedStudentId)) return;

    const updatedStudentIds = [...cls.studentIds, selectedStudentId];
    const currentBillings = cls.studentBillings || [];
    const updatedBillings = [
      ...currentBillings.filter(b => b.studentId !== selectedStudentId),
      { studentId: selectedStudentId, billingMethod: cls.tuitionType }
    ];

    const updatedClass = {
      ...cls,
      studentIds: updatedStudentIds,
      studentBillings: updatedBillings
    };

    const nextClasses = classes.map(c => {
      if (c.id === cls.id) {
        return updatedClass;
      } else {
        return {
          ...c,
          studentIds: c.studentIds.filter(id => id !== selectedStudentId),
          studentBillings: c.studentBillings?.filter(b => b.studentId !== selectedStudentId) || []
        };
      }
    });

    setClasses(nextClasses);
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
    <div className="p-6 max-w-full space-y-6">
      {/* Breadcrumb */}
      <Link to="/classes" className="text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-foreground transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Lớp học
      </Link>

      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            {cls.name}
            {!sidebarOpen && (
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="inline-flex items-center gap-1.5 text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1.5 rounded-lg hover:bg-primary/20 transition-all select-none"
                title="Hiện lịch trình giảng dạy"
              >
                <Calendar className="h-3.5 w-3.5" />
                Hiện lịch giảng
              </button>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5 font-medium flex flex-wrap items-center gap-x-2">
            <span>GV: {teacher?.name ?? "—"}</span>
            <span>&bull;</span>
            <span>{room?.name ?? "—"}</span>
            <span>&bull;</span>
            <span>{classStudents.length} học sinh</span>
          </p>
        </div>
      </div>

      {/* Two Column Layout: Left (Sessions & Big Tests Sidebar) - Right (Fixed Tabs Content) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Sidebar: Scrollable Session & Big Test List */}
        {sidebarOpen && (
          <div className="lg:col-span-1 border border-border rounded-xl bg-card shadow-sm flex flex-col h-[700px] animate-in slide-in-from-left duration-200">
            <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-primary" />
                  Lịch trình bài giảng
                </h3>
                <p className="text-[11px] text-muted-foreground font-medium mt-0.5">30 buổi học & Cambridge</p>
              </div>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-all shrink-0"
                title="Ẩn danh sách buổi học"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 p-2 space-y-1 scrollbar-thin">
              {sessionsList.map((s) => {
                const isSelected = s.id === sessionId;
                const isBigTest = !!s.isBigTest;
                
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
                        ? s.mergedLabel
                          ? "bg-violet-500/5 text-violet-700 border-violet-500/40 shadow-xs"
                          : "bg-primary/5 text-primary border-primary/20 shadow-xs"
                        : s.mergedLabel
                          ? "bg-violet-500/5 text-violet-700 hover:bg-violet-500/10 border-violet-200/50 dark:border-violet-500/10"
                          : "bg-transparent text-foreground hover:bg-muted/30 border-transparent"
                    )}
                  >
                    <div className="flex items-center justify-between gap-1">
                      {s.mergedLabel ? (
                        <span className={cn(
                          "text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider leading-none border shrink-0",
                          isSelected 
                            ? "bg-violet-600 text-white border-violet-500/30" 
                            : "bg-violet-500/10 text-violet-700 dark:bg-violet-950/20 dark:text-violet-400 border-violet-500/20"
                        )}>
                          {s.mergedLabel}
                        </span>
                      ) : (
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
                      )}
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
        )}

        {/* Right Dashboard: Fixed Tab Area */}
        <div className={cn(
          "border border-border rounded-xl bg-card shadow-sm flex flex-col min-h-[700px]",
          sidebarOpen ? "lg:col-span-4" : "lg:col-span-5"
        )}>
          
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
                      <div className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Giáo viên phụ trách</div>
                      <div className="font-extrabold text-foreground">
                        {teacher?.name ?? "—"}
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
                      <p className="text-xs text-muted-foreground mt-0.5">Danh sách học viên tham gia học tập</p>
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
                            Chọn học viên để xếp lớp học. Học viên sẽ được tự động áp dụng hình thức đóng phí của lớp học.
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
                                  .map(s => {
                                    const otherClass = classes.find(c => c.studentIds.includes(s.id));
                                    return (
                                      <SelectItem key={s.id} value={s.id}>
                                        {s.name} {otherClass ? `(Đang học lớp: ${otherClass.name})` : `(PH: ${s.parentName})`}
                                      </SelectItem>
                                    );
                                  })}
                                {students.filter(s => !cls.studentIds.includes(s.id)).length === 0 && (
                                  <div className="p-2 text-xs text-muted-foreground text-center">Tất cả học viên đã được xếp lớp</div>
                                )}
                              </SelectContent>
                            </Select>
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
                        <th className="w-16 px-5 py-2.5"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {classStudents.map((stu, idx) => {
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
                          <td colSpan={4} className="px-5 py-10 text-center text-sm text-muted-foreground">Chưa có học viên nào trong lớp này</td>
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
                      {session.mergedLabel ? (
                        <span className="text-[10px] font-extrabold uppercase bg-violet-600 text-white px-2.5 py-1 rounded-full leading-none tracking-wider border border-violet-500/30 shadow-xs flex items-center gap-1 shrink-0">
                          <Layers className="h-3 w-3" />
                          {session.mergedLabel}
                        </span>
                      ) : (
                        <span className="text-[10px] font-extrabold uppercase bg-primary text-primary-foreground px-2 py-0.5 rounded-full leading-none tracking-wider">
                          {session.isBigTest ? "🔥 Big Test" : `Buổi học số ${session.sessionNo}`}
                        </span>
                      )}
                      <span className="text-xs font-semibold text-muted-foreground">{session.date}</span>
                    </div>
                    <h2 className="text-base font-extrabold text-foreground mt-1 line-clamp-1">{session.topic}</h2>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Dialog open={mergeOpen} onOpenChange={setMergeOpen}>
                      <DialogTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 text-[10px] font-bold text-violet-600 dark:text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2.5 py-1.5 rounded-lg hover:bg-violet-500/20 transition-all select-none shadow-xs whitespace-nowrap shrink-0"
                        >
                          <Layers className="h-3.5 w-3.5" /> Gộp buổi học
                        </button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Gộp nội dung buổi học</DialogTitle>
                          <DialogDescription>
                            Gộp nội dung In Class của Buổi {session.sessionNo} hiện tại với một buổi học khác trong danh sách.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4 py-3 text-xs">
                          {/* Target Session Select */}
                          <div className="space-y-2">
                            <Label htmlFor="other-session" className="font-bold text-foreground">Chọn buổi học để gộp:</Label>
                            <Select value={mergeOtherSessionId} onValueChange={setMergeOtherSessionId}>
                              <SelectTrigger id="other-session">
                                <SelectValue placeholder="Chọn buổi học..." />
                              </SelectTrigger>
                              <SelectContent>
                                {sessionsList
                                  .filter(s => s.id !== session.id)
                                  .sort((a, b) => a.sessionNo - b.sessionNo)
                                  .map(s => (
                                    <SelectItem key={s.id} value={s.id}>
                                      Buổi {s.sessionNo}: {s.topic}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Delete Other Session Option */}
                          <div className="space-y-2 pt-1">
                            <Label className="font-bold text-foreground">Sau khi gộp:</Label>
                            <div className="space-y-2">
                              <label className="flex items-center gap-2.5 cursor-pointer font-medium p-2 border border-border rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                                <input
                                  type="radio"
                                  name="deleteOther"
                                  checked={deleteOtherSession === true}
                                  onChange={() => setDeleteOtherSession(true)}
                                  className="text-primary focus:ring-primary"
                                />
                                <span>Xóa luôn buổi học kia & dồn lịch giảng lên (Buổi 30 sẽ hiển thị trống)</span>
                              </label>

                              <label className="flex items-center gap-2.5 cursor-pointer font-medium p-2 border border-border rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                                <input
                                  type="radio"
                                  name="deleteOther"
                                  checked={deleteOtherSession === false}
                                  onChange={() => setDeleteOtherSession(false)}
                                  className="text-primary focus:ring-primary"
                                />
                                <span>Giữ nguyên buổi học cũ trong danh sách</span>
                              </label>
                            </div>
                          </div>
                        </div>

                        <DialogFooter>
                          <Button variant="outline" size="sm" onClick={() => { setMergeOpen(false); setMergeOtherSessionId(""); }}>Hủy</Button>
                          <Button 
                            size="sm" 
                            className="bg-violet-600 hover:bg-violet-700 text-white"
                            onClick={() => handleMergeSessions(mergeOtherSessionId, deleteOtherSession)}
                            disabled={!mergeOtherSessionId}
                          >
                            Xác nhận gộp
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={editOpen} onOpenChange={setEditOpen}>
                      <DialogTrigger asChild>
                        <button
                          type="button"
                          onClick={handleOpenEdit}
                          className="inline-flex items-center gap-1.5 text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1.5 rounded-lg hover:bg-primary/20 transition-all select-none shadow-xs whitespace-nowrap shrink-0"
                        >
                          <Settings className="h-3.5 w-3.5" /> Cấu hình buổi học
                        </button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-xl">
                        <DialogHeader>
                          <DialogTitle>Cấu hình nội dung Buổi {session.sessionNo}</DialogTitle>
                          <DialogDescription>
                            Chỉnh sửa chi tiết nội dung giảng dạy, mục tiêu học tập, bài tập về nhà và tài liệu.
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-3 text-xs max-h-[440px] overflow-y-auto pr-1">
                          {/* Topic Input */}
                          <div className="space-y-1.5">
                            <Label htmlFor="edit-topic" className="font-bold text-foreground">Chủ đề bài học (Topic):</Label>
                            <Input
                              id="edit-topic"
                              value={editTopic}
                              onChange={(e) => setEditTopic(e.target.value)}
                              placeholder="Nhập tên chủ đề bài học..."
                              className="text-xs font-semibold"
                            />
                          </div>

                          {/* Objectives Textarea */}
                          <div className="space-y-1.5">
                            <Label htmlFor="edit-objectives" className="font-bold text-foreground">Mục tiêu bài học (Objectives - Mỗi mục tiêu viết một dòng):</Label>
                            <Textarea
                              id="edit-objectives"
                              value={editObjectives}
                              onChange={(e) => setEditObjectives(e.target.value)}
                              placeholder="Ví dụ:&#10;Hiểu cấu trúc bài viết&#10;Vận dụng thành thạo từ vựng"
                              rows={4}
                              className="text-xs"
                            />
                          </div>

                          {/* Materials Textarea */}
                          <div className="space-y-1.5">
                            <Label htmlFor="edit-materials" className="font-bold text-foreground">Tài liệu & Học cụ (Materials - Mỗi tài liệu viết một dòng):</Label>
                            <Textarea
                              id="edit-materials"
                              value={editMaterials}
                              onChange={(e) => setEditMaterials(e.target.value)}
                              placeholder="Ví dụ:&#10;Sách giáo khoa Cambridge Stage 9&#10;Phiếu bài tập từ vựng"
                              rows={3}
                              className="text-xs"
                            />
                          </div>

                          {/* Homework Input */}
                          <div className="space-y-1.5">
                            <Label htmlFor="edit-homework" className="font-bold text-foreground">Bài tập về nhà (Homework):</Label>
                            <Textarea
                              id="edit-homework"
                              value={editHomework}
                              onChange={(e) => setEditHomework(e.target.value)}
                              placeholder="Nhập yêu cầu bài tập về nhà..."
                              rows={3}
                              className="text-xs"
                            />
                          </div>

                          {/* Classroom Activities Textarea */}
                          <div className="space-y-1.5">
                            <Label htmlFor="edit-activities" className="font-bold text-foreground">Hoạt động trên lớp (Classroom Activities - Mỗi hoạt động một dòng):</Label>
                            <Textarea
                              id="edit-activities"
                              value={editActivities}
                              onChange={(e) => setEditActivities(e.target.value)}
                              placeholder="Ví dụ:&#10;Khởi động & ôn tập từ vựng (15 phút)&#10;Giảng bài mới (30 phút)"
                              rows={4}
                              className="text-xs"
                            />
                          </div>
                        </div>

                        <DialogFooter>
                          <Button variant="outline" size="sm" onClick={() => setEditOpen(false)}>Hủy</Button>
                          <Button 
                            size="sm" 
                            className="bg-primary hover:bg-primary/90 text-white font-semibold"
                            onClick={handleSaveEdit}
                          >
                            Lưu cấu hình
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 uppercase tracking-wide whitespace-nowrap hidden sm:block">
                      Hệ Cambridge (CAM)
                    </div>
                  </div>
                </div>

                {/* ── Tab 2: In Class ────────────────────────────────────────────── */}
                {activeTab === "lesson" && (
                  <div className="space-y-6">
                    {/* Top Row: 3 columns */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 text-sm">
                      {/* Objectives */}
                      <div className="space-y-3 border border-border p-4 rounded-xl bg-card shadow-xs">
                        <div className="flex items-center gap-2 pb-2 border-b border-dashed border-border">
                          <Target className="h-4 w-4 text-violet-500" />
                          <span className="font-bold text-foreground">Mục tiêu bài học (Objectives)</span>
                        </div>
                        <ul className="space-y-2">
                          {session.objectives.length === 0 ? (
                            <li className="text-xs text-muted-foreground italic py-1">Chưa cấu hình mục tiêu bài học</li>
                          ) : (
                            session.objectives.map((o, i) => (
                              <li key={i} className="flex items-start gap-2.5">
                                <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" />
                                <span className="text-xs text-foreground font-medium leading-relaxed">{o}</span>
                              </li>
                            ))
                          )}
                        </ul>
                      </div>

                      {/* Materials */}
                      <div className="space-y-3 border border-border p-4 rounded-xl bg-card shadow-xs">
                        <div className="flex items-center gap-2 pb-2 border-b border-dashed border-border">
                          <Layers className="h-4 w-4 text-blue-500" />
                          <span className="font-bold text-foreground">Tài liệu & Học cụ (Materials)</span>
                        </div>
                        <ul className="space-y-2">
                          {session.materials.length === 0 ? (
                            <li className="text-xs text-muted-foreground italic py-1">Chưa cấu hình tài liệu học cụ</li>
                          ) : (
                            session.materials.map((m, i) => (
                              <li key={i} className="flex items-start gap-2.5">
                                <span className="inline-block w-5 h-5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                                  {i + 1}
                                </span>
                                <span className="text-xs text-foreground font-medium leading-relaxed">{m}</span>
                              </li>
                            ))
                          )}
                        </ul>
                      </div>

                      {/* Homework task banner in its own card */}
                      <div className="space-y-3 border border-rose-500/10 p-4 rounded-xl bg-rose-500/5 shadow-xs">
                        <div className="flex items-center gap-2 pb-2 border-b border-dashed border-rose-500/20">
                          <FileSpreadsheet className="h-4 w-4 text-rose-500" />
                          <span className="font-bold text-rose-700 dark:text-rose-400">Bài tập về nhà (Homework)</span>
                        </div>
                        <p className="text-xs font-semibold text-foreground leading-relaxed">
                          {!session.homework || session.homework === "Không có bài tập về nhà" ? (
                            <span className="text-muted-foreground italic font-normal">Chưa cấu hình bài tập về nhà</span>
                          ) : (
                            session.homework
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Row */}
                    <div className="space-y-3 border border-border p-4 rounded-xl bg-card shadow-xs">
                      <div className="flex items-center gap-2 pb-2 border-b border-dashed border-border">
                        <Activity className="h-4 w-4 text-amber-500" />
                        <span className="font-bold text-foreground">Hoạt động trên lớp (Classroom Activities)</span>
                      </div>
                      <ol className="space-y-2.5">
                        {session.activities.length === 0 ? (
                          <li className="text-xs text-muted-foreground italic py-1">Chưa cấu hình hoạt động trên lớp</li>
                        ) : (
                          session.activities.map((a, i) => (
                            <li key={i} className="flex items-start gap-3">
                              <span className="inline-block min-w-[22px] h-[22px] rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-extrabold text-center leading-[22px] shrink-0 mt-0.5">
                                {i + 1}
                              </span>
                              <span className="text-xs text-foreground font-medium leading-relaxed">{a}</span>
                            </li>
                          ))
                        )}
                      </ol>
                    </div>
                  </div>
                )}

                {/* ── Tab 3: Báo cáo (Điểm danh & Điểm số) ────────────────────────── */}
                {activeTab === "report" && (
                  <div className="space-y-4">
                    {/* Stat summaries and Grade Col Manager */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-muted/5 border border-border p-3 rounded-xl flex-wrap">
                      <div className="flex gap-2 flex-wrap items-center">
                        {[
                          { label: "Có mặt", count: presentCount, bg: "bg-emerald-50/50 text-emerald-700 dark:bg-emerald-950/10 dark:text-emerald-400 border-emerald-200/30" },
                          { label: "Đi trễ", count: lateCount,   bg: "bg-amber-50/50 text-amber-700 dark:bg-amber-950/10 dark:text-amber-400 border-amber-200/30" },
                          { label: "Vắng mặt", count: absentCount, bg: "bg-rose-50/50 text-rose-700 dark:bg-rose-950/10 dark:text-rose-400 border-rose-200/30" },
                        ].map(({ label, count, bg }) => (
                          <div key={label} className={cn("flex items-center gap-2 px-2.5 py-1 border rounded-lg text-[9px] font-bold shadow-xs", bg)}>
                            <span className="text-xs font-extrabold tabular-nums leading-none">{count}</span>
                            <span className="opacity-90 leading-none uppercase tracking-wider text-[8px]">{label}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleAddGradeColumn}
                          className="inline-flex items-center gap-1 text-[10px] font-bold bg-primary text-primary-foreground px-2.5 py-1.5 rounded-lg hover:bg-primary/95 transition-all select-none shadow-xs"
                        >
                          <Plus className="h-3.5 w-3.5" /> Tạo cột điểm
                        </button>
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md leading-none border border-emerald-500/20">
                          <Check className="h-2.5 w-2.5" /> Tự động lưu
                        </span>
                      </div>
                    </div>

                    {/* Gradebook Spreadsheet Table */}
                    <div className="rounded-xl border border-border shadow-xs overflow-hidden bg-card">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                            <tr>
                              <th className="text-left px-3 py-2.5 font-bold w-8 whitespace-nowrap">#</th>
                              <th className="text-left px-3 py-2.5 font-bold w-40 whitespace-nowrap">Học sinh</th>
                              <th className="text-center px-3 py-2.5 font-bold w-48 whitespace-nowrap">Điểm danh nhanh</th>
                              <th className="text-center px-2 py-2.5 font-bold w-12 whitespace-nowrap" title="Clip">Clip</th>
                              <th className="text-center px-2 py-2.5 font-bold w-16 whitespace-nowrap" title="Giáo cụ">Giáo cụ</th>
                              
                              {/* Render added custom grade columns dynamically */}
                              {(session?.gradeColumns || []).map((col) => (
                                <th key={col.id} className="text-center px-3 py-2.5 font-bold w-20 group relative whitespace-nowrap">
                                  <div className="flex items-center justify-center gap-1">
                                    <span className="truncate max-w-[65px]" title={col.name}>{col.name}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveGradeColumn(col.id)}
                                      className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                      title="Xóa cột điểm"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                </th>
                              ))}
                              
                              <th className="text-center px-3 py-2.5 font-bold w-20 whitespace-nowrap">Homework</th>
                              <th className="text-left px-3 py-2.5 font-bold w-48 whitespace-nowrap">Ghi chú</th>
                              <th className="text-left px-3 py-2.5 font-bold whitespace-nowrap">Nhận xét buổi học</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {classStudents.map((stu, idx) => {
                              const rec = records.find(r => r.studentId === stu.id);
                              const currentStatus = rec?.attendance ?? "present";
                              const isAbsent = currentStatus === "absent";
                              const customCols = session?.gradeColumns || [];
                              
                              return (
                                <tr
                                  key={stu.id}
                                  className={cn(
                                    "hover:bg-muted/15 transition-colors",
                                    isAbsent && "bg-muted/10 opacity-70"
                                  )}
                                >
                                  <td className="px-3 py-3 text-muted-foreground tabular-nums text-left">{idx + 1}</td>
                                  <td className="px-3 py-3 font-bold text-foreground text-left">
                                    <div className="text-xs">
                                      {stu.name}
                                      {isAbsent && <span className="text-[10px] font-medium text-rose-500 ml-1">(Vắng)</span>}
                                    </div>
                                    <div className="text-[9px] font-medium text-muted-foreground mt-0.5">
                                      PH: {stu.parentName}
                                    </div>
                                  </td>
                                  
                                  {/* Điểm danh nhanh segmented buttons */}
                                  <td className="px-3 py-3 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      {(["present", "late", "absent"] as Attendance[]).map((status) => {
                                        const isActive = currentStatus === status;
                                        const cfg = ATTENDANCE_CONFIG[status];
                                        
                                        return (
                                          <button
                                            key={status}
                                            type="button"
                                            onClick={() => handleUpdateRecord(stu.id, { attendance: status })}
                                            className={cn(
                                              "px-2 py-0.5 rounded border text-[9px] font-bold transition-all shrink-0 select-none",
                                              isActive
                                                ? status === "present"
                                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50"
                                                  : status === "late"
                                                    ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50"
                                                    : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50"
                                                : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                                            )}
                                          >
                                            {cfg.label}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </td>
                                  
                                  {/* Clip */}
                                  <td className="px-2 py-3 text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateRecord(stu.id, { submittedClip: !rec?.submittedClip })}
                                      className={cn(
                                        "h-4 w-4 rounded border flex items-center justify-center mx-auto transition-all shadow-xs",
                                        rec?.submittedClip
                                          ? "bg-primary border-primary text-white"
                                          : "border-border hover:bg-muted text-muted-foreground/30"
                                      )}
                                    >
                                      {rec?.submittedClip && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                                    </button>
                                  </td>
                                  
                                  {/* Giáo cụ */}
                                  <td className="px-2 py-3 text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateRecord(stu.id, { broughtTools: !rec?.broughtTools })}
                                      className={cn(
                                        "h-4 w-4 rounded border flex items-center justify-center mx-auto transition-all shadow-xs",
                                        rec?.broughtTools
                                          ? "bg-emerald-600 border-emerald-600 text-white"
                                          : "border-border hover:bg-muted text-muted-foreground/30"
                                      )}
                                    >
                                      {rec?.broughtTools && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                                    </button>
                                  </td>
                                  
                                  {/* Custom scores */}
                                  {customCols.map((col) => {
                                    const gradeValue = rec?.grades?.[col.id] ?? null;
                                    return (
                                      <td key={col.id} className="px-2 py-3 text-center">
                                        <input
                                          type="number"
                                          min="0"
                                          max="10"
                                          step="0.1"
                                          value={gradeValue === null ? "" : gradeValue}
                                          disabled={isAbsent}
                                          onChange={(e) => {
                                            const val = e.target.value === "" ? null : Math.min(10, Math.max(0, Number(e.target.value) || 0));
                                            handleUpdateCustomGrade(stu.id, col.id, val);
                                          }}
                                          className="h-7 text-[10px] px-1 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-12 text-center font-bold tabular-nums disabled:opacity-50 disabled:bg-muted/30"
                                          placeholder="—"
                                        />
                                      </td>
                                    );
                                  })}
                                  
                                  {/* Homework Score */}
                                  <td className="px-2 py-3 text-center">
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
                                      className="h-7 text-[10px] px-1 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-12 text-center font-bold tabular-nums disabled:opacity-50 disabled:bg-muted/30"
                                      placeholder="—"
                                    />
                                  </td>
                                  
                                  {/* Ghi chú */}
                                  <td className="px-3 py-3 text-left">
                                    <input
                                      type="text"
                                      value={rec?.notes || ""}
                                      onChange={(e) => handleUpdateRecord(stu.id, { notes: e.target.value })}
                                      className="h-7 text-[10px] px-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full"
                                      placeholder="Ghi chú điểm danh..."
                                    />
                                  </td>
                                  
                                  {/* Nhận xét */}
                                  <td className="px-3 py-3 text-left">
                                    <input
                                      type="text"
                                      value={rec?.comment ?? ""}
                                      disabled={isAbsent}
                                      onChange={(e) => handleUpdateRecord(stu.id, { comment: e.target.value })}
                                      className="h-7 text-[10px] px-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full"
                                      placeholder="Nhận xét thái độ, học lực..."
                                    />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
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