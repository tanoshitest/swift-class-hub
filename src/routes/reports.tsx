import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { useState } from "react";
import {
  TrendingUp, Users, Calendar, DollarSign, CheckCircle2, XCircle, Clock,
  Award, FileSpreadsheet, Download, Star, Info, Check, Sparkles, BookOpen, User, CreditCard
} from "lucide-react";
import { useStore, formatVND, type LessonSession, type Student } from "@/lib/mock-data";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Báo cáo — STEPS" }] }),
  component: ReportsPage,
});

type ReportTab = "results" | "attendance" | "salary";

function ReportsPage() {
  const { classes, students, sessions, teachers } = useStore();
  const [activeTab, setActiveTab] = useState<ReportTab>("results");
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id ?? "");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const activeClass = classes.find(c => c.id === selectedClassId);
  const classStudents = students.filter(s => activeClass?.studentIds.includes(s.id));
  const filteredStudents = classStudents.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const classSessions = sessions
    .filter(s => s.classId === selectedClassId)
    .sort((a, b) => a.sessionNo - b.sessionNo);

  // Helper to get grade columns per session (1, 2, or 3 class scores + 1 homework column)
  const getSessionGradeColumns = (s: LessonSession) => {
    if (s.isBigTest) {
      return [
        { key: "bigTest", label: "Big Test" },
        { key: "homework", label: "BTVN" }
      ];
    }
    const mod = s.sessionNo % 3;
    if (mod === 0) {
      return [
        { key: "grammar", label: "Ngữ pháp" },
        { key: "homework", label: "BTVN" }
      ];
    } else if (mod === 1) {
      return [
        { key: "listening", label: "Nghe" },
        { key: "speaking", label: "Nói" },
        { key: "homework", label: "BTVN" }
      ];
    } else {
      return [
        { key: "listening", label: "Nghe" },
        { key: "speaking", label: "Nói" },
        { key: "reading", label: "Đọc" },
        { key: "homework", label: "BTVN" }
      ];
    }
  };

  // Helper to fetch deterministic scores for any student, session, and column key
  const getStudentScore = (studentId: string, s: LessonSession, colKey: string) => {
    const rec = s.records.find(r => r.studentId === studentId);
    if (!rec || rec.attendance === "absent") return null;

    if (colKey === "homework") {
      return rec.homeworkScore;
    }
    if (colKey === "bigTest" || colKey === "grammar") {
      return rec.classScore;
    }
    
    // For listening, speaking, reading, calculate dynamic deterministic variations
    const base = rec.classScore ?? 8.0;
    const studentHash = studentId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colHash = colKey.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    let offset = ((studentHash + s.sessionNo + colHash) % 5) * 0.4 - 0.8; // between -0.8 and +0.8
    let score = base + offset;
    if (score > 10) score = 10;
    if (score < 4) score = 4;
    return Math.round(score * 10) / 10;
  };

  // Helper to calculate student GPA (Average of all non-null classScores and homeworkScores)
  const calculateStudentGPA = (studentId: string) => {
    let sum = 0;
    let count = 0;
    classSessions.forEach(s => {
      const rec = s.records.find(r => r.studentId === studentId);
      if (rec) {
        if (rec.classScore !== null) {
          sum += rec.classScore;
          count++;
        }
        if (rec.homeworkScore !== null) {
          sum += rec.homeworkScore;
          count++;
        }
      }
    });
    return count > 0 ? sum / count : null;
  };

  // Helper to calculate student Attendance Stats
  const getAttendanceStats = (studentId: string) => {
    let present = 0;
    let late = 0;
    let absent = 0;
    classSessions.forEach(s => {
      const rec = s.records.find(r => r.studentId === studentId);
      if (rec) {
        if (rec.attendance === "present") present++;
        else if (rec.attendance === "late") late++;
        else if (rec.attendance === "absent") absent++;
      }
    });
    const total = present + late + absent;
    const rate = total > 0 ? ((present + late) / total) * 100 : 0;
    return { present, late, absent, total, rate };
  };

  // Dynamic stats for overview cards
  const totalStudents = classStudents.length;
  const totalSessions = classSessions.length;
  
  const classGPAs = classStudents.map(s => calculateStudentGPA(s.id)).filter(Boolean) as number[];
  const classAverageGPA = classGPAs.length > 0 ? classGPAs.reduce((a, b) => a + b, 0) / classGPAs.length : 0;

  const classAttendanceRates = classStudents.map(s => getAttendanceStats(s.id).rate);
  const classAverageAttendance = classAttendanceRates.length > 0 ? classAttendanceRates.reduce((a, b) => a + b, 0) / classAttendanceRates.length : 0;

  // Teacher salary payroll mock cases
  const teacherPayrollCases = [
    {
      id: "pay_t1",
      teacherName: "Nguyễn Thị Lan",
      email: "lan.nt@edu.vn",
      phone: "0901234567",
      specialization: "Cambridge English",
      contractType: "Hourly Rate (Theo tiếng)",
      hoursTaught: 45.0,
      hourlyRate: 150000,
      basePayCalculation: "45.0 giờ × 150.000đ/giờ",
      baseSalary: 6750000,
      allowance: 500000,
      allowanceDetails: "Thưởng soạn bài giảng chất lượng cao",
      deductions: 200000,
      deductionsDetails: "Thuế TNCN tạm khấu trừ",
      netSalary: 7050000,
      bankName: "Techcombank",
      bankAccount: "19034567890123",
      status: "paid" as const,
      paymentDate: "15/05/2026",
      details: [
        { label: "Hình thức trả lương", value: "Theo giờ dạy thực tế" },
        { label: "Đơn giá giảng dạy", value: "150.000đ / giờ" },
        { label: "Tổng số buổi dạy", value: "30 buổi (1.5 giờ / buổi)" },
        { label: "Tổng giờ dạy quy đổi", value: "45.0 giờ" }
      ]
    },
    {
      id: "pay_t2",
      teacherName: "Trần Văn Minh",
      email: "minh.tv@edu.vn",
      phone: "0912345678",
      specialization: "IELTS Academic Prep",
      contractType: "Monthly Fixed Salary (Lương cứng tháng)",
      hoursTaught: 36.0,
      hourlyRate: 0,
      basePayCalculation: "Lương cứng cố định hợp đồng",
      baseSalary: 12000000,
      allowance: 1800000,
      allowanceDetails: "Thưởng dạy lớp cuối tuần (1.500k) + Hỗ trợ gửi xe tài liệu (300k)",
      deductions: 300000,
      deductionsDetails: "Đóng quỹ phúc lợi & bảo hiểm",
      netSalary: 13500000,
      bankName: "Vietcombank",
      bankAccount: "0071001234567",
      status: "paid" as const,
      paymentDate: "15/05/2026",
      details: [
        { label: "Hình thức trả lương", value: "Lương cứng cố định" },
        { label: "Mức lương cơ bản", value: "12.000.000đ / tháng" },
        { label: "Số lớp phụ trách", value: "2 lớp học chính khóa" },
        { label: "Tổng số buổi dạy thực tế", value: "24 buổi trong tháng" }
      ]
    }
  ];

  const [selectedTeacherPay, setSelectedTeacherPay] = useState<typeof teacherPayrollCases[0] | null>(null);

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <PageHeader title="Báo cáo" subtitle="Báo cáo chuyên cần, kết quả học tập & lương giáo viên" />

      {/* Tabs Selector & Class Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border/80 shadow-xs">
        {/* Dynamic rounded tabs */}
        <div className="flex bg-muted/60 p-1 rounded-xl w-fit border border-muted-foreground/5">
          <button
            onClick={() => setActiveTab("results")}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
              activeTab === "results"
                ? "bg-white dark:bg-zinc-800 text-violet-600 dark:text-violet-400 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Kết quả học tập
          </button>
          <button
            onClick={() => setActiveTab("attendance")}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
              activeTab === "attendance"
                ? "bg-white dark:bg-zinc-800 text-violet-600 dark:text-violet-400 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Chuyên cần lớp
          </button>
          <button
            onClick={() => setActiveTab("salary")}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
              activeTab === "salary"
                ? "bg-white dark:bg-zinc-800 text-violet-600 dark:text-violet-400 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Lương giáo viên
          </button>
        </div>

        {/* Dynamic Class filter & Name Search (hidden on Teacher Salary tab) */}
        {activeTab !== "salary" && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <Label htmlFor="class-select" className="text-xs font-bold text-muted-foreground whitespace-nowrap">Lọc lớp:</Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger id="class-select" className="w-[180px] sm:w-[220px] text-xs font-semibold h-9">
                  <SelectValue placeholder="Chọn lớp..." />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(c => (
                    <SelectItem key={c.id} value={c.id} className="text-xs font-medium">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="name-search" className="text-xs font-bold text-muted-foreground whitespace-nowrap">Tìm học sinh:</Label>
              <input
                id="name-search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nhập tên học sinh..."
                className="w-[160px] sm:w-[180px] h-9 text-xs font-semibold px-3 py-1 bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder-muted-foreground/60 shadow-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Summary Stats Cards (hidden on salary tab) */}
      {activeTab !== "salary" && activeClass && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-200">
          <div className="p-4 rounded-xl border border-border bg-card shadow-xs flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Học sinh lớp</p>
              <p className="text-lg font-extrabold text-foreground mt-0.5">{totalStudents} học sinh</p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card shadow-xs flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Số buổi học</p>
              <p className="text-lg font-extrabold text-foreground mt-0.5">{totalSessions} buổi học</p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card shadow-xs flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">GPA Lớp</p>
              <p className="text-lg font-extrabold text-foreground mt-0.5">{classAverageGPA.toFixed(2)} / 10</p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card shadow-xs flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tỉ lệ chuyên cần</p>
              <p className="text-lg font-extrabold text-foreground mt-0.5">{classAverageAttendance.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 1: BÁO CÁO KẾT QUẢ HỌC TẬP ─────────────────────────────────── */}
      {activeTab === "results" && activeClass && (
        <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden animate-in fade-in duration-200">
          <div className="p-5 border-b border-border/80 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-foreground">Bảng kết quả kiểm tra & đánh giá</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Liệt kê tất cả điểm học tập trên lớp (In Class) & bài tập về nhà theo từng buổi</p>
            </div>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground border border-border px-3 py-1.5 rounded-lg bg-muted/20 select-none shadow-xs transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> Xuất Excel
            </button>
          </div>

          {/* Sticky left table scroll */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-muted/40 border-b border-border/80">
                  <th rowSpan={2} className="sticky left-0 bg-muted/90 px-4 py-3 font-bold text-foreground z-10 w-[180px] shadow-[2px_0_5px_rgba(0,0,0,0.05)] border-r border-border/40 text-center align-middle whitespace-nowrap min-w-[150px]">Học sinh</th>
                  {classSessions.map(s => {
                    const columns = getSessionGradeColumns(s);
                    return (
                      <th
                        key={s.id}
                        colSpan={columns.length}
                        className={cn(
                          "px-3 py-2 font-bold text-center border-r border-border/40 text-[10px] tracking-wider uppercase border-b border-border/30",
                          s.isBigTest ? "bg-rose-500/10 text-rose-700 dark:text-rose-400" : "bg-muted/20 text-muted-foreground"
                        )}
                      >
                        {s.isBigTest ? "🔥 Big Test" : `Buổi ${s.sessionNo}`}
                      </th>
                    );
                  })}
                </tr>
                <tr className="bg-muted/30 border-b border-border/80">
                  {classSessions.map(s => {
                    const columns = getSessionGradeColumns(s);
                    return columns.map((col, idx) => (
                      <th
                        key={`${s.id}_col_${idx}`}
                        className={cn(
                          "px-2 py-1.5 font-bold text-center border-r border-border/40 text-[9px] min-w-[70px]",
                          col.key === "homework" ? "text-violet-600 dark:text-violet-400" : "text-muted-foreground"
                        )}
                      >
                        {col.label}
                      </th>
                    ));
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredStudents.map(student => {
                  return (
                    <tr key={student.id} className="hover:bg-muted/10 transition-colors">
                      {/* Sticky Student Name cell */}
                      <td className="sticky left-0 bg-card/95 font-bold text-foreground px-4 py-3 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)] border-r border-border/40 whitespace-nowrap min-w-[150px]">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-xs leading-none">{student.name}</p>
                          <p className="text-[9px] text-muted-foreground font-normal">ID: {student.id.toUpperCase()}</p>
                        </div>
                      </td>

                      {/* Score cells for each session's grade columns */}
                      {classSessions.map(s => {
                        const rec = s.records.find(r => r.studentId === student.id);
                        const columns = getSessionGradeColumns(s);
                        return columns.map((col, idx) => {
                          const score = getStudentScore(student.id, s, col.key);
                          return (
                            <td
                              key={`${s.id}_score_${idx}`}
                              className={cn(
                                "px-2 py-3 text-center border-r border-border/40 font-bold text-[11px] tabular-nums",
                                s.isBigTest ? "bg-rose-500/[0.01]" : "",
                                col.key === "homework" ? "text-violet-600 dark:text-violet-400" : "text-foreground/90"
                              )}
                            >
                              {rec && rec.attendance === "absent" ? (
                                <span className="text-[9px] font-bold text-rose-500/80 bg-rose-500/10 px-1 py-0.5 rounded">Vắng</span>
                              ) : score !== null ? (
                                score.toFixed(1)
                              ) : (
                                <span className="text-muted-foreground/60 font-normal">—</span>
                              )}
                            </td>
                          );
                        });
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 2: BÁO CÁO CHUYÊN CẦN ────────────────────────────────────── */}
      {activeTab === "attendance" && activeClass && (
        <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden animate-in fade-in duration-200">
          <div className="p-5 border-b border-border/80 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-foreground">Bảng theo dõi điểm danh chuyên cần</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Thông tin chi tiết hiện diện lớp của học sinh tại từng buổi học theo lịch dạy</p>
            </div>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground border border-border px-3 py-1.5 rounded-lg bg-muted/20 select-none shadow-xs transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> Xuất Excel
            </button>
          </div>

          {/* Sticky left table scroll */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-muted/40 border-b border-border/80">
                  <th className="sticky left-0 bg-muted/90 px-4 py-3.5 font-bold text-foreground z-10 w-[180px] shadow-[2px_0_5px_rgba(0,0,0,0.05)] border-r border-border/40 whitespace-nowrap min-w-[150px]">Học sinh</th>
                  <th className="px-4 py-3.5 font-bold text-center text-muted-foreground border-r border-border/40 w-[110px]">Tỉ Lệ Đi Học</th>
                  {classSessions.map(s => (
                    <th key={s.id} className="px-3 py-3.5 font-bold text-center border-r border-border/40 min-w-[70px]">
                      <div className="space-y-0.5">
                        <span className="block text-[10px] text-foreground font-bold">Buổi {s.sessionNo}</span>
                        <span className="block text-[8px] font-semibold text-muted-foreground leading-none">{s.date.split("/").slice(0, 2).join("/")}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredStudents.map(student => {
                  const stats = getAttendanceStats(student.id);
                  return (
                    <tr key={student.id} className="hover:bg-muted/10 transition-colors">
                      {/* Sticky Student Name cell */}
                      <td className="sticky left-0 bg-card/95 font-bold text-foreground px-4 py-4 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)] border-r border-border/40 whitespace-nowrap min-w-[150px]">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-xs leading-none">{student.name}</p>
                          <p className="text-[9px] text-muted-foreground font-normal">ID: {student.id.toUpperCase()}</p>
                        </div>
                      </td>

                      {/* Attendance Payout summary */}
                      <td className="px-4 py-4 text-center border-r border-border/40">
                        <div className="space-y-0.5 font-bold">
                          <span className={cn(
                            "inline-block px-1.5 py-0.5 rounded text-[10px]",
                            stats.rate >= 90 ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                            : stats.rate >= 80 ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                            : "bg-rose-500/15 text-rose-700 dark:text-rose-400"
                          )}>
                            {stats.rate.toFixed(1)}%
                          </span>
                          <span className="block text-[9px] text-muted-foreground font-medium mt-0.5">
                            ({stats.present + stats.late}/{stats.total})
                          </span>
                        </div>
                      </td>

                      {/* Attendance items columns */}
                      {classSessions.map(s => {
                        const rec = s.records.find(r => r.studentId === student.id);
                        const status = rec?.attendance;
                        return (
                          <td key={s.id} className="px-3 py-4 text-center border-r border-border/40">
                            {status === "present" ? (
                              <div className="mx-auto flex items-center justify-center h-5 w-5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10" title="Có mặt">
                                <Check className="h-3 w-3" />
                              </div>
                            ) : status === "late" ? (
                              <div className="mx-auto flex items-center justify-center h-5 w-5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/10" title="Đi trễ">
                                <Clock className="h-3 w-3" />
                              </div>
                            ) : status === "absent" ? (
                              <div className="mx-auto flex items-center justify-center h-5 w-5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/10" title="Vắng">
                                <XCircle className="h-3 w-3" />
                              </div>
                            ) : (
                              <span className="text-muted-foreground/60">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 3: BÁO CÁO LƯƠNG GIÁO VIÊN ───────────────────────────────── */}
      {activeTab === "salary" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header Description */}
          <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/10 flex items-center gap-3">
            <Info className="h-5 w-5 text-violet-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-bold text-violet-800 dark:text-violet-300">Thông tin báo cáo lương giáo viên</h3>
              <p className="text-[11px] text-violet-700/80 dark:text-violet-400/80 leading-relaxed mt-0.5">
                Bảng thanh toán lương tổng hợp cho giáo viên của trung tâm kỳ lương Tháng 5/2026. Bao gồm hai trường hợp mô phỏng hợp đồng: Lương cứng theo tháng và Lương quy đổi theo giờ dạy thực tế.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
            <div className="p-5 border-b border-border/80 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-foreground">Bảng tổng hợp thanh toán lương giáo viên</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Danh sách chi tiết thù lao giảng dạy định kỳ theo tháng & theo giờ dạy thực tế</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-muted/40 border-b border-border/80">
                    <th className="px-5 py-3.5 font-bold text-foreground">Giáo viên</th>
                    <th className="px-5 py-3.5 font-bold text-foreground">Hình thức hợp đồng</th>
                    <th className="px-5 py-3.5 font-bold text-center">Tổng giờ dạy</th>
                    <th className="px-5 py-3.5 font-bold text-right">Lương thực nhận</th>
                    <th className="px-5 py-3.5 font-bold text-center">Trạng thái</th>
                    <th className="px-5 py-3.5 font-bold text-center w-[120px]">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {teacherPayrollCases.map(tc => (
                    <tr key={tc.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-5 py-4 font-bold text-foreground">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center font-extrabold text-xs shrink-0">
                            {tc.teacherName.split(" ").slice(-1)[0][0]}
                          </div>
                          <div>
                            <p className="font-semibold text-xs leading-none">{tc.teacherName}</p>
                            <p className="text-[10px] text-muted-foreground font-normal mt-0.5">{tc.email} — {tc.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-block text-[10px] font-bold uppercase bg-violet-600/10 text-violet-700 dark:text-violet-400 px-2 py-0.5 rounded border border-violet-500/10">
                          {tc.contractType}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center font-bold text-foreground">
                        {tc.hoursTaught.toFixed(1)} giờ
                      </td>
                      <td className="px-5 py-4 text-right font-extrabold text-violet-600 dark:text-violet-400 text-sm">
                        {formatVND(tc.netSalary)}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="inline-block text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          Đã thanh toán
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => setSelectedTeacherPay(tc)}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:text-primary-foreground hover:bg-primary border border-primary/20 px-2.5 py-1.5 rounded-lg transition-all shadow-xs"
                        >
                          <Star className="h-3 w-3 animate-pulse" /> Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Premium Teacher salary receipt detailed popup modal */}
          <Dialog open={selectedTeacherPay !== null} onOpenChange={(open) => { if (!open) setSelectedTeacherPay(null); }}>
            <DialogContent className="sm:max-w-md">
              {selectedTeacherPay && (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                      <span>Phiếu lương chi tiết</span>
                    </DialogTitle>
                    <DialogDescription className="text-left">
                      Thông tin thù lao chi tiết giáo viên {selectedTeacherPay.teacherName} kỳ lương Tháng 5/2026.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-3 text-xs">
                    {/* Contract Details list */}
                    <div className="p-4 rounded-xl bg-muted/30 border border-border grid grid-cols-2 gap-3 text-xs">
                      {selectedTeacherPay.details.map((d, i) => (
                        <div key={i} className="space-y-0.5">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">{d.label}</span>
                          <p className="font-semibold text-foreground">{d.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Breakdown Calculations */}
                    <div className="space-y-3.5">
                      <h5 className="font-bold text-foreground">Chi tiết khoản thanh toán (Payroll Breakdown)</h5>
                      
                      <div className="space-y-2 border-b border-dashed border-border pb-3">
                        {/* Base salary calculation */}
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground font-medium">Lương giảng dạy cơ bản:</span>
                          <div className="text-right">
                            <p className="font-bold text-foreground">{formatVND(selectedTeacherPay.baseSalary)}</p>
                            <p className="text-[10px] text-muted-foreground font-normal">{selectedTeacherPay.basePayCalculation}</p>
                          </div>
                        </div>

                        {/* Allowance */}
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground font-medium">Phụ cấp & Thưởng:</span>
                          <div className="text-right">
                            <p className="font-bold text-emerald-600 dark:text-emerald-400">+{formatVND(selectedTeacherPay.allowance)}</p>
                            <p className="text-[9px] text-muted-foreground font-normal max-w-[200px] leading-tight mt-0.5">{selectedTeacherPay.allowanceDetails}</p>
                          </div>
                        </div>

                        {/* Deductions */}
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground font-medium">Các khoản khấu trừ:</span>
                          <div className="text-right">
                            <p className="font-bold text-rose-600 dark:text-rose-400">-{formatVND(selectedTeacherPay.deductions)}</p>
                            <p className="text-[10px] text-muted-foreground font-normal">{selectedTeacherPay.deductionsDetails}</p>
                          </div>
                        </div>
                      </div>

                      {/* Net payout calculated */}
                      <div className="flex items-center justify-between bg-violet-500/5 p-3.5 rounded-xl border border-violet-500/10">
                        <span className="font-extrabold text-violet-700 dark:text-violet-400">Lương thực nhận (Net):</span>
                        <span className="text-lg font-black text-violet-600 dark:text-violet-400 tabular-nums">
                          {formatVND(selectedTeacherPay.netSalary)}
                        </span>
                      </div>
                    </div>

                    {/* Bank Transfer Receipt */}
                    <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10 grid grid-cols-2 gap-3 text-[10px] text-muted-foreground">
                      <div>
                        <p className="uppercase font-bold tracking-wider opacity-60">Tài khoản nhận</p>
                        <p className="font-bold text-foreground leading-tight mt-0.5">{selectedTeacherPay.bankName} - {selectedTeacherPay.bankAccount}</p>
                      </div>
                      <div>
                        <p className="uppercase font-bold tracking-wider opacity-60">Giao dịch thành công</p>
                        <p className="font-bold text-foreground leading-tight mt-0.5">{selectedTeacherPay.paymentDate}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-border">
                    <Button size="sm" onClick={() => setSelectedTeacherPay(null)}>Đóng phiếu lương</Button>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}