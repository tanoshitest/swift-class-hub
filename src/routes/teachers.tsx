import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Search, Phone, Mail, Pencil } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { useStore, uid, type Teacher } from "@/lib/mock-data";

export const Route = createFileRoute("/teachers")({
  head: () => ({ meta: [{ title: "Giáo viên — EduCenter" }] }),
  component: TeachersPage,
});

function TeachersPage() {
  const { teachers, setTeachers, classes } = useStore();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);

  const filtered = teachers.filter((t) =>
    [t.name, t.phone, t.specialization].join(" ").toLowerCase().includes(q.toLowerCase())
  );

  const openNew = () => { setEditing({ id: "", name: "", phone: "", specialization: "", email: "" }); setOpen(true); };
  const openEdit = (t: Teacher) => { setEditing({ ...t }); setOpen(true); };

  const save = () => {
    if (!editing) return;
    if (editing.id) setTeachers(teachers.map((t) => (t.id === editing.id ? editing : t)));
    else setTeachers([...teachers, { ...editing, id: uid() }]);
    setOpen(false);
  };

  const remove = () => {
    if (!editing?.id) return;
    setTeachers(teachers.filter((t) => t.id !== editing.id));
    setOpen(false);
  };

  const teacherClasses = editing?.id ? classes.filter((c) => c.teacherId === editing.id) : [];

  return (
    <div className="p-8 max-w-7xl">
      <PageHeader
        title="Quản lý giáo viên"
        subtitle={`${teachers.length} giáo viên`}
        actions={
          <Button onClick={openNew} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Thêm giáo viên
          </Button>
        }
      />

      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8 h-9" placeholder="Tìm theo tên, SĐT, chuyên môn…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="text-left font-medium px-4 py-2.5">Họ tên</th>
              <th className="text-left font-medium px-4 py-2.5">Chuyên môn</th>
              <th className="text-left font-medium px-4 py-2.5">Số điện thoại</th>
              <th className="text-left font-medium px-4 py-2.5">Email</th>
              <th className="text-left font-medium px-4 py-2.5">Số lớp</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((t) => {
              const count = classes.filter((c) => c.teacherId === t.id).length;
              return (
                <tr key={t.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => openEdit(t)}>
                  <td className="px-4 py-2.5 font-medium">{t.name}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{t.specialization}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{t.phone}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{t.email}</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center rounded-md bg-accent text-accent-foreground px-2 py-0.5 text-xs">{count}</span>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground"><Pencil className="h-3.5 w-3.5" /></td>
                </tr>
              );
            })}
            {!filtered.length && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground text-sm">Không có giáo viên</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {editing && (
            <>
              <SheetHeader>
                <SheetTitle>{editing.id ? "Sửa giáo viên" : "Thêm giáo viên"}</SheetTitle>
                <SheetDescription>Thông tin hồ sơ và lớp đang phụ trách.</SheetDescription>
              </SheetHeader>
              <div className="grid gap-3 py-4">
                <div className="grid gap-1.5">
                  <Label>Họ và tên</Label>
                  <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                </div>
                <div className="grid gap-1.5">
                  <Label>Chuyên môn</Label>
                  <Input value={editing.specialization} onChange={(e) => setEditing({ ...editing, specialization: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label>Số điện thoại</Label>
                    <Input value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Email</Label>
                    <Input value={editing.email ?? ""} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
                  </div>
                </div>

                {editing.id && (
                  <div className="mt-4">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Lớp đang phụ trách</div>
                    <div className="rounded-md border border-border divide-y divide-border">
                      {teacherClasses.length ? teacherClasses.map((c) => (
                        <div key={c.id} className="px-3 py-2 text-sm flex items-center justify-between">
                          <span className="font-medium">{c.name}</span>
                          <span className="text-xs text-muted-foreground">{c.studentIds.length} học sinh</span>
                        </div>
                      )) : <div className="px-3 py-4 text-sm text-muted-foreground text-center">Chưa có lớp</div>}
                    </div>
                    <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {editing.phone || "—"}</span>
                      <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {editing.email || "—"}</span>
                    </div>
                  </div>
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