import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Search, Pencil } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { useStore, uid, formatVND, type Student } from "@/lib/mock-data";

export const Route = createFileRoute("/students")({
  head: () => ({ meta: [{ title: "Học sinh — STEPS" }] }),
  component: StudentsPage,
});

function StudentsPage() {
  const { students, setStudents, classes, invoices } = useStore();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);

  const filtered = students.filter((s) =>
    [s.name, s.parentName, s.parentPhone].join(" ").toLowerCase().includes(q.toLowerCase())
  );

  const openNew = () => { setEditing({ id: "", name: "", parentName: "", parentPhone: "", dob: "" }); setOpen(true); };
  const openEdit = (s: Student) => { setEditing({ ...s }); setOpen(true); };

  const save = () => {
    if (!editing) return;
    if (editing.id) setStudents(students.map((s) => (s.id === editing.id ? editing : s)));
    else setStudents([...students, { ...editing, id: uid() }]);
    setOpen(false);
  };

  const remove = () => {
    if (!editing?.id) return;
    setStudents(students.filter((s) => s.id !== editing.id));
    setOpen(false);
  };

  const enrolled = editing?.id ? classes.filter((c) => c.studentIds.includes(editing.id)) : [];
  const debt = editing?.id
    ? invoices.filter((i) => i.studentId === editing.id).reduce((a, i) => a + (i.amountDue - i.amountPaid), 0)
    : 0;

  const debtOf = (sid: string) =>
    invoices.filter((i) => i.studentId === sid).reduce((a, i) => a + (i.amountDue - i.amountPaid), 0);

  return (
    <div className="p-8 max-w-7xl">
      <PageHeader
        title="Quản lý học sinh"
        subtitle={`${students.length} học sinh`}
        actions={
          <Button onClick={openNew} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Thêm học sinh
          </Button>
        }
      />

      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8 h-9" placeholder="Tìm theo tên học sinh, phụ huynh, SĐT…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="text-left font-medium px-4 py-2.5">Họ tên</th>
              <th className="text-left font-medium px-4 py-2.5">Phụ huynh</th>
              <th className="text-left font-medium px-4 py-2.5">SĐT</th>
              <th className="text-left font-medium px-4 py-2.5">Số lớp</th>
              <th className="text-right font-medium px-4 py-2.5">Còn nợ</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((s) => {
              const d = debtOf(s.id);
              const c = classes.filter((cl) => cl.studentIds.includes(s.id)).length;
              return (
                <tr key={s.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => openEdit(s)}>
                  <td className="px-4 py-2.5 font-medium">{s.name}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{s.parentName}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{s.parentPhone}</td>
                  <td className="px-4 py-2.5"><span className="inline-flex items-center rounded-md bg-accent text-accent-foreground px-2 py-0.5 text-xs">{c}</span></td>
                  <td className={`px-4 py-2.5 text-right tabular-nums ${d > 0 ? "text-destructive font-medium" : "text-muted-foreground"}`}>{formatVND(d)}</td>
                  <td className="px-4 py-2.5 text-muted-foreground"><Pencil className="h-3.5 w-3.5" /></td>
                </tr>
              );
            })}
            {!filtered.length && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground text-sm">Không có học sinh</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {editing && (
            <>
              <SheetHeader>
                <SheetTitle>{editing.id ? "Sửa học sinh" : "Thêm học sinh"}</SheetTitle>
                <SheetDescription>Hồ sơ học sinh, phụ huynh và học phí.</SheetDescription>
              </SheetHeader>
              <div className="grid gap-3 py-4">
                <div className="grid gap-1.5">
                  <Label>Họ và tên</Label>
                  <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label>Ngày sinh</Label>
                    <Input type="date" value={editing.dob ?? ""} onChange={(e) => setEditing({ ...editing, dob: e.target.value })} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Phụ huynh</Label>
                    <Input value={editing.parentName} onChange={(e) => setEditing({ ...editing, parentName: e.target.value })} />
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label>SĐT phụ huynh</Label>
                  <Input value={editing.parentPhone} onChange={(e) => setEditing({ ...editing, parentPhone: e.target.value })} />
                </div>

                {editing.id && (
                  <>
                    <div className="mt-4">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Lớp đã đăng ký</div>
                      <div className="rounded-md border border-border divide-y divide-border">
                        {enrolled.length ? enrolled.map((c) => (
                          <div key={c.id} className="px-3 py-2 text-sm flex items-center justify-between">
                            <span className="font-medium">{c.name}</span>
                            <span className="text-xs text-muted-foreground tabular-nums">{formatVND(c.feePerMonth)}/tháng</span>
                          </div>
                        )) : <div className="px-3 py-4 text-sm text-muted-foreground text-center">Chưa đăng ký lớp</div>}
                      </div>
                    </div>
                    <div className="rounded-md border border-border p-3 flex items-center justify-between">
                      <div className="text-sm">Học phí còn nợ</div>
                      <div className={`text-base font-semibold tabular-nums ${debt > 0 ? "text-destructive" : "text-success"}`}>{formatVND(debt)}</div>
                    </div>
                  </>
                )}
              </div>
              <SheetFooter className="gap-2 sm:justify-between flex-row">
                {editing.id ? <Button variant="destructive" onClick={remove}>Xóa</Button> : <span />}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
                  <Button onClick={save}>Lưu</Button>
                </div>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}