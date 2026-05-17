import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, Settings } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore, uid, formatVND } from "@/lib/mock-data";

export const Route = createFileRoute("/master-data")({
  head: () => ({ meta: [{ title: "Dữ liệu gốc — STEPS" }] }),
  component: MasterData,
});

function MasterData() {
  const { rooms, setRooms, slots, setSlots, feeConfigs, setFeeConfigs } = useStore();
  const [newRoom, setNewRoom] = useState({ name: "", capacity: 20 });
  const [newSlot, setNewSlot] = useState({ name: "", start: "08:00", end: "09:30" });
  const [newFee, setNewFee] = useState({ name: "" });

  return (
    <div className="p-8 max-w-6xl space-y-6">
      <PageHeader title="Dữ liệu gốc" subtitle="Cấu hình phòng học, ca học và cấu hình học phí" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Rooms Card */}
        <div className="rounded-lg border border-border bg-card shadow-sm">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold">Phòng học</h3>
            <span className="text-xs text-muted-foreground">{rooms.length} phòng</span>
          </div>
          <div className="p-3 flex gap-2 border-b border-border bg-muted/30">
            <Input className="h-9" placeholder="Tên phòng" value={newRoom.name} onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })} />
            <Input className="h-9 w-24" type="number" placeholder="SL" value={newRoom.capacity} onChange={(e) => setNewRoom({ ...newRoom, capacity: Number(e.target.value) || 0 })} />
            <Button size="sm" onClick={() => {
              if (!newRoom.name) return;
              setRooms([...rooms, { id: uid(), ...newRoom }]);
              setNewRoom({ name: "", capacity: 20 });
            }}><Plus className="h-4 w-4" /></Button>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr><th className="text-left px-4 py-2 font-medium">Tên phòng</th><th className="text-left px-4 py-2 font-medium">Sức chứa</th><th className="w-10"></th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rooms.map((r) => (
                <tr key={r.id} className="hover:bg-muted/20">
                  <td className="px-4 py-2 font-medium">{r.name}</td>
                  <td className="px-4 py-2 text-muted-foreground">{r.capacity}</td>
                  <td className="px-2 py-2 text-right">
                    <button className="text-muted-foreground hover:text-destructive p-1" onClick={() => setRooms(rooms.filter((x) => x.id !== r.id))}><Trash2 className="h-3.5 w-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TimeSlots Card */}
        <div className="rounded-lg border border-border bg-card shadow-sm">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold">Ca học</h3>
            <span className="text-xs text-muted-foreground">{slots.length} ca</span>
          </div>
          <div className="p-3 flex gap-2 border-b border-border bg-muted/30">
            <Input className="h-9" placeholder="Tên ca (vd: Ca 1)" value={newSlot.name} onChange={(e) => setNewSlot({ ...newSlot, name: e.target.value })} />
            <Input className="h-9 w-24" type="time" value={newSlot.start} onChange={(e) => setNewSlot({ ...newSlot, start: e.target.value })} />
            <Input className="h-9 w-24" type="time" value={newSlot.end} onChange={(e) => setNewSlot({ ...newSlot, end: e.target.value })} />
            <Button size="sm" onClick={() => {
              if (!newSlot.name) return;
              setSlots([...slots, { id: uid(), ...newSlot }]);
              setNewSlot({ name: "", start: "08:00", end: "09:30" });
            }}><Plus className="h-4 w-4" /></Button>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr><th className="text-left px-4 py-2 font-medium">Tên ca</th><th className="text-left px-4 py-2 font-medium">Bắt đầu</th><th className="text-left px-4 py-2 font-medium">Kết thúc</th><th className="w-10"></th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {slots.map((s) => (
                <tr key={s.id} className="hover:bg-muted/20">
                  <td className="px-4 py-2 font-medium">{s.name}</td>
                  <td className="px-4 py-2 text-muted-foreground tabular-nums">{s.start}</td>
                  <td className="px-4 py-2 text-muted-foreground tabular-nums">{s.end}</td>
                  <td className="px-2 py-2 text-right">
                    <button className="text-muted-foreground hover:text-destructive p-1" onClick={() => setSlots(slots.filter((x) => x.id !== s.id))}><Trash2 className="h-3.5 w-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fee Configurations Card */}
      <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/10">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Cấu hình Học phí (Fee Configurations)</h3>
          </div>
          <span className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-medium">{feeConfigs?.length || 0} cấu hình</span>
        </div>
        <div className="p-4 flex items-end gap-3 border-b border-border bg-muted/5">
          <div className="flex-1 min-w-[240px] space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Tên cấu hình học phí</span>
            <Input className="h-9" placeholder="Ví dụ: Cấu hình Tiêu chuẩn, Cấu hình Chất lượng cao..." value={newFee.name} onChange={(e) => setNewFee({ ...newFee, name: e.target.value })} />
          </div>
          <Button size="sm" className="h-9 shrink-0" onClick={() => {
            if (!newFee.name) return;
            // Gán mức học phí mặc định là 10.000.000 VNĐ cho các cấu hình mẫu
            setFeeConfigs([...feeConfigs, { id: uid(), name: newFee.name, courseFee: 10000000, monthFee: 0 }]);
            setNewFee({ name: "" });
          }}><Plus className="h-4 w-4 mr-1" /> Thêm cấu hình</Button>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium">Tên cấu hình</th>
              <th className="text-right px-4 py-2.5 font-medium">Học phí theo khóa (Trọn gói)</th>
              <th className="w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {feeConfigs?.map((f) => (
              <tr key={f.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-semibold text-foreground">{f.name}</td>
                <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">{formatVND(f.courseFee)}</td>
                <td className="px-4 py-3 text-right">
                  <button className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors" onClick={() => setFeeConfigs(feeConfigs.filter((x) => x.id !== f.id))}><Trash2 className="h-3.5 w-3.5" /></button>
                </td>
              </tr>
            ))}
            {!feeConfigs?.length && (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground text-sm">Chưa có cấu hình học phí nào</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}