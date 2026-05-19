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
  const { rooms, setRooms, slots, setSlots } = useStore();
  const [newRoom, setNewRoom] = useState({ name: "", capacity: 20 });
  const [newSlot, setNewSlot] = useState({ name: "", start: "08:00", end: "09:30" });

  return (
    <div className="p-8 max-w-6xl space-y-6">
      <PageHeader title="Dữ liệu gốc" subtitle="Cấu hình phòng học và ca học" />

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
    </div>
  );
}