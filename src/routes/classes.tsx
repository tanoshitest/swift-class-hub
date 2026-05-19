import { createFileRoute, Link, Outlet, useMatchRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, X, Users } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore, uid, formatVND, DAYS, type ClassEntity, calculateEndDate } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/classes")({
  head: () => ({ meta: [{ title: "Lớp học — STEPS" }] }),
  component: ClassesPage,
});

const emptyClass = (): ClassEntity => ({
  id: "",
  name: "",
  teacherId: "",
  roomId: "",
  studentIds: [],
  schedule: [],
  feePerMonth: 1200000,
  feePerCourse: 10000000,
  studentBillings: [],
  tuitionType: "month",
  startDate: new Date().toISOString().split("T")[0],
  totalSessions: 30,
  endDate: "",
  nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
});

function ClassesPage() {
  const { classes, setClasses, teachers, rooms, students, slots } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ClassEntity | null>(null);

  const updateClassWithEndDate = (updatedClass: ClassEntity): ClassEntity => {
    const newEndDate = calculateEndDate(
      updatedClass.startDate || "",
      updatedClass.totalSessions || 0,
      updatedClass.schedule
    );
    return { ...updatedClass, endDate: newEndDate };
  };

  const openNew = () => {
    const fresh = emptyClass();
    setEditing(updateClassWithEndDate(fresh));
    setOpen(true);
  };

  const openEdit = (c: ClassEntity) => {
    const editObj: ClassEntity = {
      ...c,
      schedule: [...c.schedule],
      studentIds: [...c.studentIds],
      tuitionType: c.tuitionType || "month",
      startDate: c.startDate || new Date().toISOString().split("T")[0],
      totalSessions: c.totalSessions || 30,
      endDate: c.endDate || "",
      nextPaymentDate: c.nextPaymentDate || (c.startDate ? new Date(new Date(c.startDate).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] : "")
    };
    setEditing(updateClassWithEndDate(editObj));
    setOpen(true);
  };

  const save = () => {
    if (!editing) return;
    const newStudentIds = editing.studentIds;

    let nextClasses = classes;
    if (editing.id) {
      nextClasses = nextClasses.map((c) => {
        if (c.id === editing.id) {
          return editing;
        } else {
          return {
            ...c,
            studentIds: c.studentIds.filter((id) => !newStudentIds.includes(id)),
            studentBillings: c.studentBillings?.filter((b) => !newStudentIds.includes(b.studentId)) || []
          };
        }
      });
    } else {
      const newId = uid();
      nextClasses = nextClasses.map((c) => ({
        ...c,
        studentIds: c.studentIds.filter((id) => !newStudentIds.includes(id)),
        studentBillings: c.studentBillings?.filter((b) => !newStudentIds.includes(b.studentId)) || []
      }));
      nextClasses.push({ ...editing, id: newId });
    }
    setClasses(nextClasses);
    setOpen(false);
  };

  const remove = () => {
    if (!editing?.id) return;
    setClasses(classes.filter((c) => c.id !== editing.id));
    setOpen(false);
  };

  const toggleCell = (slotId: string, day: number) => {
    if (!editing) return;
    const exists = editing.schedule.some((s) => s.slotId === slotId && s.day === day);
    const newSchedule = exists
      ? editing.schedule.filter((s) => !(s.slotId === slotId && s.day === day))
      : [...editing.schedule, { slotId, day }];
    
    setEditing(updateClassWithEndDate({
      ...editing,
      schedule: newSchedule,
    }));
  };

  const toggleStudent = (sid: string) => {
    if (!editing) return;
    const currentBillings = editing.studentBillings || [];
    const isAdding = !editing.studentIds.includes(sid);
    setEditing({
      ...editing,
      studentIds: isAdding
        ? [...editing.studentIds, sid]
        : editing.studentIds.filter((x) => x !== sid),
      studentBillings: isAdding
        ? [...currentBillings.filter((b) => b.studentId !== sid), { studentId: sid, billingMethod: editing.tuitionType || "month" }]
        : currentBillings.filter((b) => b.studentId !== sid),
    });
  };

  const matchRoute = useMatchRoute();
  const isChild = matchRoute({ to: "/classes/$classId", fuzzy: true });

  if (isChild) return <Outlet />;

  return (
    <div className="p-8 max-w-7xl">
      <PageHeader
        title="Quản lý lớp học"
        subtitle={`${classes.length} lớp`}
        actions={
          <Button onClick={openNew} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Thêm lớp
          </Button>
        }
      />

      <div className="space-y-3">
        {classes.map((c) => {
          const t = teachers.find((x) => x.id === c.teacherId);
          const r = rooms.find((x) => x.id === c.roomId);
          return (
            <div key={c.id} className="rounded-xl border border-border bg-card p-4 hover:border-primary/45 hover:shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Link to="/classes/$classId" params={{ classId: c.id }} className="text-base font-bold text-foreground hover:text-primary transition-colors">
                    {c.name}
                  </Link>
                  {c.tuitionType === "course" ? (
                    <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/25">
                      Thu theo Khóa: {formatVND(c.feePerCourse)}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/25">
                      Thu theo Tháng: {formatVND(c.feePerMonth)}/tháng
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-semibold text-foreground">GV: {t?.name ?? "—"}</span>
                  <span>&bull;</span>
                  <span>Phòng: {r?.name ?? "—"}</span>
                  <span>&bull;</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-foreground"><Users className="h-3.5 w-3.5 mr-0.5 text-blue-500" /> {c.studentIds.length} học sinh</span>
                </div>
                <div className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5 pt-0.5">
                  <span className="bg-emerald-500/10 text-emerald-600 font-medium px-1.5 py-0.5 rounded text-[10px]">
                    Bắt đầu: {c.startDate ? new Date(c.startDate).toLocaleDateString("vi-VN") : "—"}
                  </span>
                  <span className="bg-blue-500/10 text-blue-600 font-medium px-1.5 py-0.5 rounded text-[10px]">
                    Kết thúc: {c.endDate ? new Date(c.endDate).toLocaleDateString("vi-VN") : "—"}
                  </span>
                  <span className="bg-violet-500/10 text-violet-600 font-medium px-1.5 py-0.5 rounded text-[10px]">
                    Tổng số: {c.totalSessions || 30} buổi học
                  </span>
                  {c.nextPaymentDate && (
                    <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium px-1.5 py-0.5 rounded text-[10px]">
                      Hạn đóng tiếp theo: {new Date(c.nextPaymentDate).toLocaleDateString("vi-VN")}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1.5">
                  {c.schedule.map((s, i) => {
                    const slot = slots.find((sl) => sl.id === s.slotId);
                    return (
                      <span key={i} className="text-[10px] bg-accent/75 text-accent-foreground font-semibold rounded px-2 py-0.5 border border-border/60">
                        {DAYS[s.day - 1]} • {slot?.name}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 md:pl-2">
                <button
                  onClick={(e) => { e.stopPropagation(); openEdit(c); }}
                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border border-transparent hover:border-border"
                  aria-label="Sửa lớp"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="sm:max-w-3xl overflow-y-auto">
          {editing && (
            <>
              <SheetHeader>
                <SheetTitle>{editing.id ? "Sửa lớp học" : "Tạo lớp học mới"}</SheetTitle>
                <SheetDescription>Thông tin lớp, khung lịch cố định, và danh sách học sinh.</SheetDescription>
              </SheetHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5 col-span-2">
                    <Label>Tên lớp</Label>
                    <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Giáo viên</Label>
                    <Select value={editing.teacherId} onValueChange={(v) => setEditing({ ...editing, teacherId: v })}>
                      <SelectTrigger><SelectValue placeholder="Chọn giáo viên" /></SelectTrigger>
                      <SelectContent>{teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Phòng học</Label>
                    <Select value={editing.roomId} onValueChange={(v) => setEditing({ ...editing, roomId: v })}>
                      <SelectTrigger><SelectValue placeholder="Chọn phòng" /></SelectTrigger>
                      <SelectContent>{rooms.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  {/* Lựa chọn hình thức thu học phí */}
                  <div className="grid gap-1.5 col-span-2">
                    <div className="flex items-center justify-between">
                      <Label className="font-bold text-xs uppercase text-muted-foreground">Hình thức thu học phí áp dụng</Label>
                      {editing.id && (
                        <span className="text-[10px] text-amber-500 font-semibold italic">* Không thể thay đổi hình thức thu phí sau khi tạo</span>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        disabled={!!editing.id}
                        onClick={() => setEditing(updateClassWithEndDate({ ...editing, tuitionType: "month" }))}
                        className={cn(
                          "flex-1 py-2.5 rounded-lg border text-sm font-semibold transition-all text-center",
                          editing.tuitionType === "month"
                            ? "bg-primary/5 border-primary text-primary shadow-sm"
                            : "border-border bg-background hover:bg-muted text-foreground",
                          editing.id && editing.tuitionType !== "month" && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        Thu theo Tháng (Định kỳ)
                      </button>
                      <button
                        type="button"
                        disabled={!!editing.id}
                        onClick={() => setEditing(updateClassWithEndDate({ ...editing, tuitionType: "course" }))}
                        className={cn(
                          "flex-1 py-2.5 rounded-lg border text-sm font-semibold transition-all text-center",
                          editing.tuitionType === "course"
                            ? "bg-primary/5 border-primary text-primary shadow-sm"
                            : "border-border bg-background hover:bg-muted text-foreground",
                          editing.id && editing.tuitionType !== "course" && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        Thu theo Khóa (Trọn gói)
                      </button>
                    </div>
                  </div>

                  {/* Hiển thị input tương ứng với lựa chọn */}
                  {editing.tuitionType === "month" ? (
                    <>
                      <div className="grid gap-1.5 col-span-2">
                        <Label>Học phí / tháng (VND)</Label>
                        <Input
                          type="number"
                          value={editing.feePerMonth}
                          onChange={(e) => setEditing(updateClassWithEndDate({ ...editing, feePerMonth: Number(e.target.value) || 0 }))}
                          placeholder="Nhập số tiền đóng theo tháng..."
                        />
                      </div>
                      <div className="grid gap-1.5 col-span-2">
                        <Label>Ngày đóng học phí tiếp theo (Hàng tháng)</Label>
                        <Input
                          type="date"
                          value={editing.nextPaymentDate || ""}
                          onChange={(e) => setEditing(updateClassWithEndDate({ ...editing, nextPaymentDate: e.target.value }))}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid gap-1.5 col-span-2">
                        <Label>Học phí / khóa (VND)</Label>
                        <Input
                          type="number"
                          value={editing.feePerCourse}
                          onChange={(e) => setEditing(updateClassWithEndDate({ ...editing, feePerCourse: Number(e.target.value) || 0 }))}
                          placeholder="Nhập học phí trọn gói theo khóa..."
                        />
                      </div>
                      <div className="grid gap-1.5 col-span-2">
                        <Label>Ngày đóng học phí tiếp theo (Theo khóa)</Label>
                        <Input
                          type="date"
                          value={editing.nextPaymentDate || ""}
                          onChange={(e) => setEditing(updateClassWithEndDate({ ...editing, nextPaymentDate: e.target.value }))}
                        />
                      </div>
                    </>
                  )}

                  {/* Cấu hình thời gian học */}
                  <div className="grid grid-cols-3 gap-3 col-span-2 bg-muted/20 p-4 rounded-xl border border-border/60">
                    <div className="grid gap-1.5">
                      <Label className="font-semibold text-xs">Ngày bắt đầu</Label>
                      <Input
                        type="date"
                        value={editing.startDate || ""}
                        onChange={(e) => setEditing(updateClassWithEndDate({ ...editing, startDate: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="font-semibold text-xs">Số buổi học</Label>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={editing.totalSessions || ""}
                        onChange={(e) => setEditing(updateClassWithEndDate({ ...editing, totalSessions: Number(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="font-semibold text-xs text-primary">Ngày kết thúc (Tự động)</Label>
                      <Input
                        type="text"
                        readOnly
                        disabled
                        value={editing.endDate ? editing.endDate : "Chưa xác định"}
                        className="bg-muted text-muted-foreground font-mono font-bold border-dashed text-center"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Khung lịch cố định theo tuần</div>
                  <div className="rounded-lg border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 text-xs">
                        <tr>
                          <th className="text-left font-medium px-3 py-2 w-32">Ca học</th>
                          {DAYS.map((d) => <th key={d} className="font-medium px-2 py-2 text-center">{d}</th>)}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {slots.map((slot) => (
                          <tr key={slot.id} className="hover:bg-muted/20">
                            <td className="px-3 py-2">
                              <div className="font-medium">{slot.name}</div>
                              <div className="text-[11px] text-muted-foreground">{slot.start}–{slot.end}</div>
                            </td>
                            {DAYS.map((_, idx) => {
                              const day = idx + 1;
                              const checked = editing.schedule.some((s) => s.slotId === slot.id && s.day === day);
                              return (
                                <td key={day} className={cn("text-center px-1 py-2 cursor-pointer transition-colors", checked && "bg-primary/10")} onClick={() => toggleCell(slot.id, day)}>
                                  <Checkbox checked={checked} onCheckedChange={() => toggleCell(slot.id, day)} className="mx-auto" />
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2 flex items-center justify-between">
                    <span>Danh sách học sinh</span>
                    <span>{editing.studentIds.length} đã chọn</span>
                  </div>
                  <div className="rounded-lg border border-border max-h-64 overflow-y-auto divide-y divide-border">
                    {students.map((s) => {
                      const on = editing.studentIds.includes(s.id);
                      const otherClass = classes.find((cl) => cl.id !== editing.id && cl.studentIds.includes(s.id));
                      return (
                        <label key={s.id} className={cn("flex items-center justify-between px-3 py-2 text-sm cursor-pointer hover:bg-muted/30", on && "bg-primary/5")}>
                          <div className="flex items-center gap-2.5">
                            <Checkbox checked={on} onCheckedChange={() => toggleStudent(s.id)} />
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {s.name}
                                {otherClass && (
                                  <span className="text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20">
                                    Đang học lớp: {otherClass.name}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-muted-foreground">PH: {s.parentName} • {s.parentPhone}</div>
                            </div>
                          </div>
                          {on && <X className="h-3.5 w-3.5 text-muted-foreground" />}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <SheetFooter className="gap-2 sm:justify-between flex-row">
                {editing.id ? <Button variant="destructive" onClick={remove}>Xóa lớp</Button> : <span />}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
                  <Button onClick={save}>Lưu lớp</Button>
                </div>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}