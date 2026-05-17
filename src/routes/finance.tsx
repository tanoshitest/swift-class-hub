import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useStore, formatVND, type Invoice } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/finance")({
  head: () => ({ meta: [{ title: "Học phí — STEPS" }] }),
  component: FinancePage,
});

const STATUS_LABEL = { paid: "Đã thanh toán", unpaid: "Chưa thanh toán", partial: "Trả một phần" } as const;

function StatusPill({ status }: { status: Invoice["status"] }) {
  const cls = {
    paid: "bg-success/15 text-success",
    unpaid: "bg-destructive/15 text-destructive",
    partial: "bg-warning/15 text-warning",
  }[status];
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium", cls)}>{STATUS_LABEL[status]}</span>;
}

function FinancePage() {
  const { invoices, setInvoices, students, classes } = useStore();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | Invoice["status"]>("all");
  const [payOpen, setPayOpen] = useState(false);
  const [active, setActive] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState(0);

  const studentName = (id: string) => students.find((s) => s.id === id)?.name ?? "—";
  const className = (id: string) => classes.find((c) => c.id === id)?.name ?? "—";

  const filtered = invoices.filter((i) => {
    if (filter !== "all" && i.status !== filter) return false;
    if (!q) return true;
    const text = `${studentName(i.studentId)} ${className(i.classId)} ${i.period}`.toLowerCase();
    return text.includes(q.toLowerCase());
  });

  const totals = invoices.reduce(
    (a, i) => ({
      due: a.due + i.amountDue,
      paid: a.paid + i.amountPaid,
      pending: a.pending + (i.amountDue - i.amountPaid),
    }),
    { due: 0, paid: 0, pending: 0 }
  );

  const openPay = (inv: Invoice) => { setActive(inv); setPayAmount(inv.amountDue - inv.amountPaid); setPayOpen(true); };
  const submitPay = () => {
    if (!active) return;
    const newPaid = Math.min(active.amountDue, active.amountPaid + payAmount);
    const status: Invoice["status"] = newPaid >= active.amountDue ? "paid" : newPaid > 0 ? "partial" : "unpaid";
    setInvoices(invoices.map((i) => (i.id === active.id ? { ...i, amountPaid: newPaid, status } : i)));
    setPayOpen(false);
  };

  return (
    <div className="p-8 max-w-7xl">
      <PageHeader title="Quản lý học phí" subtitle={`${invoices.length} hóa đơn`} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Tổng phải thu</div>
          <div className="mt-1.5 text-xl font-semibold tabular-nums">{formatVND(totals.due)}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Đã thu</div>
          <div className="mt-1.5 text-xl font-semibold tabular-nums text-success">{formatVND(totals.paid)}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Còn nợ</div>
          <div className="mt-1.5 text-xl font-semibold tabular-nums text-destructive">{formatVND(totals.pending)}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8 h-9" placeholder="Tìm theo học sinh, lớp, kỳ…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex items-center gap-1 text-sm bg-muted rounded-md p-0.5">
          {([
            ["all", "Tất cả"],
            ["unpaid", "Chưa TT"],
            ["partial", "Một phần"],
            ["paid", "Đã TT"],
          ] as const).map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k as any)} className={cn("px-3 py-1 rounded text-xs transition-colors", filter === k ? "bg-card shadow-sm font-medium" : "text-muted-foreground")}>{l}</button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="text-left font-medium px-4 py-2.5">Học sinh</th>
              <th className="text-left font-medium px-4 py-2.5">Lớp</th>
              <th className="text-left font-medium px-4 py-2.5">Kỳ</th>
              <th className="text-right font-medium px-4 py-2.5">Phải thu</th>
              <th className="text-right font-medium px-4 py-2.5">Đã thu</th>
              <th className="text-left font-medium px-4 py-2.5">Trạng thái</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((i) => (
              <tr key={i.id} className="hover:bg-muted/30">
                <td className="px-4 py-2.5 font-medium">{studentName(i.studentId)}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{className(i.classId)}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{i.period}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{formatVND(i.amountDue)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{formatVND(i.amountPaid)}</td>
                <td className="px-4 py-2.5"><StatusPill status={i.status} /></td>
                <td className="px-4 py-2.5 text-right">
                  {i.status !== "paid" && (
                    <Button size="sm" variant="outline" onClick={() => openPay(i)}>
                      <Plus className="h-3.5 w-3.5 mr-1" /> Thanh toán
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground text-sm">Không có hóa đơn</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ghi nhận thanh toán</DialogTitle>
            <DialogDescription>
              {active && <>{studentName(active.studentId)} • {className(active.classId)} • Kỳ {active.period}</>}
            </DialogDescription>
          </DialogHeader>
          {active && (
            <div className="grid gap-3 py-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Còn nợ</span>
                <span className="font-semibold tabular-nums text-destructive">{formatVND(active.amountDue - active.amountPaid)}</span>
              </div>
              <div className="grid gap-1.5">
                <Label>Số tiền thanh toán (VND)</Label>
                <Input type="number" value={payAmount} onChange={(e) => setPayAmount(Number(e.target.value) || 0)} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(false)}>Hủy</Button>
            <Button onClick={submitPay}>Ghi nhận</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}