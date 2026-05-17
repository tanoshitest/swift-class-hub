import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, X } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore, uid, formatVND, DAYS, type ClassEntity } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/classes")({
  head: () => ({ meta: [{ title: "Lớp học — STEPS" }] }),
  component: ClassesPage,
});

const emptyClass = (): ClassEntity => ({
  id: "", name: "", teacherId: "", roomId: "", studentIds: [], schedule: [], feePerMonth: 1000000,
});

function ClassesPage() {
  const { classes, setClasses, teachers, rooms, students, slots } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ClassEntity | null>(null);

  const openNew = () => { setEditing(emptyClass()); setOpen(true); };
  const openEdit = (c: ClassEntity) => { setEditing({ ...c, schedule: [...c.schedule], studentIds: [...c.studentIds] }); setOpen(true); };

  const save = () => {
    if (!editing) return;
    if (editing.id) setClasses(classes.map((c) => (c.id === editing.id ? editing : c)));
    else setClasses([...classes, { ...editing, id: uid() }]);
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
    setEditing({
      ...editing,
      schedule: exists
        ? editing.schedule.filter((s) => !(s.slotId === slotId && s.day === day))
        : [...editing.schedule, { slotId, day }],
    });
  };

  const toggleStudent = (sid: string) => {
    if (!editing) return;
    setEditing({
      ...editing,
      studentIds: editing.studentIds.includes(sid)
        ? editing.studentIds.filter((x) => x !== sid)
        : [...editing.studentIds, sid],
    });
  };

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {classes.map((c) => {
          const t = teachers.find((x) => x.id === c.teacherId);
          const r = rooms.find((x) => x.id === c.roomId);
          return (
            <div key={c.id} className="rounded-lg border border-border bg-card p-4 hover:border-primary/40 transition-colors cursor-pointer" onClick={() => openEdit(c)}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">GV: {t?.name ?? "—"} • {r?.name ?? "—"}</div>
                </div>
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {c.schedule.map((s, i) => {
                  const slot = slots.find((sl) => sl.id === s.slotId);
                  return (
                    <span key={i} className="text-[11px] bg-accent text-accent-foreground rounded px-1.5 py-0.5">
                      {DAYS[s.day - 1]} • {slot?.name}
                    </span>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>{c.studentIds.length} học sinh</span>
                <span className="tabular-nums">{formatVND(c.feePerMonth)}/tháng</span>
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
                  <div className="grid gap-1.5">
                    <Label>Học phí / tháng (VND)</Label>
                    <Input type="number" value={editing.feePerMonth} onChange={(e) => setEditing({ ...editing, feePerMonth: Number(e.target.value) || 0 })} />
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
                      return (
                        <label key={s.id} className={cn("flex items-center justify-between px-3 py-2 text-sm cursor-pointer hover:bg-muted/30", on && "bg-primary/5")}>
                          <div className="flex items-center gap-2.5">
                            <Checkbox checked={on} onCheckedChange={() => toggleStudent(s.id)} />
                            <div>
                              <div className="font-medium">{s.name}</div>
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