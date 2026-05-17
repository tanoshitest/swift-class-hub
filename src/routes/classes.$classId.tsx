import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Calendar, Check, X as XIcon, Save } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore, DAYS, formatVND } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/classes/$classId")({
  head: () => ({ meta: [{ title: "Chi tiết lớp — STEPS" }] }),
  component: ClassDetailPage,
});

type SessionRow = {
  key: string;
  date: Date;
  day: number;
  slotId: string;
  label: string;
};

type Attendance = "present" | "absent" | "late";
type Record = { attendance: Attendance; classScore: string; homeworkScore: string; note: string };

function buildSessions(schedule: { slotId: string; day: number }[], slots: { id: string; name: string; start: string; end: string }[]): SessionRow[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const out: SessionRow[] = [];
  for (let offset = -28; offset <= 14; offset++) {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    // JS getDay(): 0=Sun..6=Sat; our day: 1=Mon..7=Sun
    const jsDay = d.getDay();
    const ourDay = jsDay === 0 ? 7 : jsDay;
    for (const cell of schedule) {
      if (cell.day !== ourDay) continue;
      const slot = slots.find((s) => s.id === cell.slotId);
      if (!slot) continue;
      const dateStr = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
      out.push({
        key: `${d.toISOString().slice(0, 10)}_${cell.slotId}`,
        date: new Date(d),
        day: ourDay,
        slotId: cell.slotId,
        label: `${dateStr} • ${DAYS[ourDay - 1]} • ${slot.name} (${slot.start}–${slot.end})`,
      });
    }
  }
  return out.sort((a, b) => b.date.getTime() - a.date.getTime());
}

function ClassDetailPage() {
  const { classId } = useParams({ from: "/classes/$classId" });
  const { classes, teachers, rooms, students, slots } = useStore();
  const cls = classes.find((c) => c.id === classId);

  const sessions = useMemo(() => (cls ? buildSessions(cls.schedule, slots) : []), [cls, slots]);
  const defaultSession = sessions.find((s) => s.date.getTime() <= Date.now())?.key ?? sessions[0]?.key ?? "";
  const [sessionKey, setSessionKey] = useState(defaultSession);

  // records: sessionKey -> studentId -> Record
  const [data, setData] = useState<{ [k: string]: { [sid: string]: Record } }>({});

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

  const getRec = (sid: string): Record =>
    data[sessionKey]?.[sid] ?? { attendance: "present", classScore: "", homeworkScore: "", note: "" };

  const setRec = (sid: string, patch: Partial<Record>) => {
    setData((prev) => ({
      ...prev,
      [sessionKey]: {
        ...(prev[sessionKey] ?? {}),
        [sid]: { ...getRec(sid), ...patch },
      },
    }));
  };

  const save = () => toast.success("Đã lưu buổi học", { description: sessions.find((s) => s.key === sessionKey)?.label });

  const present = classStudents.filter((s) => getRec(s.id).attendance === "present").length;
  const absent = classStudents.filter((s) => getRec(s.id).attendance === "absent").length;
  const late = classStudents.filter((s) => getRec(s.id).attendance === "late").length;

  return (
    <div className="p-8 max-w-7xl">
      <Link to="/classes" className="text-xs text-muted-foreground inline-flex items-center gap-1 mb-3 hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Lớp học
      </Link>

      <PageHeader
        title={cls.name}
        subtitle={`GV: ${teacher?.name ?? "—"} • ${room?.name ?? "—"} • ${classStudents.length} học sinh • ${formatVND(cls.feePerMonth)}/tháng`}
        actions={
          <Button size="sm" onClick={save}>
            <Save className="h-4 w-4 mr-1" /> Lưu buổi học
          </Button>
        }
      />

      <div className="rounded-lg border border-border bg-card p-4 mb-4">
        <div className="flex flex-col md:flex-row md:items-end gap-3">
          <div className="grid gap-1.5 flex-1">
            <label className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> Chọn buổi học
            </label>
            <Select value={sessionKey} onValueChange={setSessionKey}>
              <SelectTrigger className="md:max-w-md">
                <SelectValue placeholder="Chọn buổi" />
              </SelectTrigger>
              <SelectContent>
                {sessions.length === 0 && <div className="px-3 py-2 text-sm text-muted-foreground">Lớp chưa có lịch</div>}
                {sessions.map((s) => (
                  <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="px-2.5 py-1.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium">Có mặt: {present}</span>
            <span className="px-2.5 py-1.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium">Trễ: {late}</span>
            <span className="px-2.5 py-1.5 rounded-md bg-rose-500/10 text-rose-700 dark:text-rose-400 font-medium">Vắng: {absent}</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs">
            <tr>
              <th className="text-left font-medium px-3 py-2.5 w-12">#</th>
              <th className="text-left font-medium px-3 py-2.5">Học sinh</th>
              <th className="text-center font-medium px-3 py-2.5 w-56">Điểm danh</th>
              <th className="text-center font-medium px-3 py-2.5 w-28">Điểm trên lớp</th>
              <th className="text-center font-medium px-3 py-2.5 w-28">Điểm BTVN</th>
              <th className="text-left font-medium px-3 py-2.5 w-64">Ghi chú</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {classStudents.map((s, i) => {
              const rec = getRec(s.id);
              return (
                <tr key={s.id} className="hover:bg-muted/20">
                  <td className="px-3 py-2 text-muted-foreground tabular-nums">{i + 1}</td>
                  <td className="px-3 py-2">
                    <div className="font-medium">{s.name}</div>
                    <div className="text-[11px] text-muted-foreground">PH: {s.parentName} • {s.parentPhone}</div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-center gap-1">
                      {(["present", "late", "absent"] as Attendance[]).map((a) => {
                        const on = rec.attendance === a;
                        const styles =
                          a === "present"
                            ? on ? "bg-emerald-500 text-white border-emerald-500" : "hover:bg-emerald-500/10"
                            : a === "late"
                            ? on ? "bg-amber-500 text-white border-amber-500" : "hover:bg-amber-500/10"
                            : on ? "bg-rose-500 text-white border-rose-500" : "hover:bg-rose-500/10";
                        return (
                          <button
                            key={a}
                            onClick={() => setRec(s.id, { attendance: a })}
                            className={cn("text-xs px-2 py-1 rounded border border-border transition-colors", styles)}
                          >
                            {a === "present" ? (<span className="inline-flex items-center gap-1"><Check className="h-3 w-3" />Có mặt</span>) : a === "late" ? "Trễ" : (<span className="inline-flex items-center gap-1"><XIcon className="h-3 w-3" />Vắng</span>)}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number" min={0} max={10} step={0.1}
                      value={rec.classScore}
                      onChange={(e) => setRec(s.id, { classScore: e.target.value })}
                      placeholder="—"
                      className="h-8 text-center tabular-nums"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number" min={0} max={10} step={0.1}
                      value={rec.homeworkScore}
                      onChange={(e) => setRec(s.id, { homeworkScore: e.target.value })}
                      placeholder="—"
                      className="h-8 text-center tabular-nums"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      value={rec.note}
                      onChange={(e) => setRec(s.id, { note: e.target.value })}
                      placeholder="Ghi chú..."
                      className="h-8"
                    />
                  </td>
                </tr>
              );
            })}
            {classStudents.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-12 text-center text-sm text-muted-foreground">Lớp chưa có học sinh</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}