import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Plus, Layers, Calendar, DollarSign, Wallet, ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useStore, formatVND, type Invoice } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/finance")({
  head: () => ({ meta: [{ title: "Tài chính & Học phí — STEPS" }] }),
  component: FinancePage,
});

const STATUS_LABEL = { paid: "Đã thanh toán", unpaid: "Chưa thanh toán", partial: "Trả một phần" } as const;

function StatusPill({ status }: { status: Invoice["status"] }) {
  const cls = {
    paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50",
    unpaid: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-900/50",
    partial: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900/50",
  }[status];
  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold shadow-sm", cls)}>{STATUS_LABEL[status]}</span>;
}

function FinancePage() {
  const { invoices, setInvoices, students, classes } = useStore();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | Invoice["status"]>("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [payOpen, setPayOpen] = useState(false);
  const [active, setActive] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState(0);

  const studentName = (id: string) => students.find((s) => s.id === id)?.name ?? "—";
  const className = (id: string) => classes.find((c) => c.id === id)?.name ?? "—";

  const filtered = invoices.filter((i) => {
    if (filter !== "all" && i.status !== filter) return false;
    if (classFilter !== "all" && i.classId !== classFilter) return false;
    if (!q) return true;
    const text = `${i.studentId} ${studentName(i.studentId)} ${className(i.classId)} ${i.period} ${i.billingMethod === "course" ? "khóa" : "tháng"}`.toLowerCase();
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

  const openPay = (inv: Invoice) => {
    setActive(inv);
    setPayAmount(inv.amountDue - inv.amountPaid);
    setPayOpen(true);
  };

  const submitPay = () => {
    if (!active) return;
    const newPaid = Math.min(active.amountDue, active.amountPaid + payAmount);
    const status: Invoice["status"] = newPaid >= active.amountDue ? "paid" : newPaid > 0 ? "partial" : "unpaid";
    setInvoices(invoices.map((i) => (i.id === active.id ? { ...i, amountPaid: newPaid, status } : i)));
    setPayOpen(false);
  };

  return (
    <div className="p-8 max-w-7xl space-y-6">
      <PageHeader title="Quản lý học phí & Tài chính" subtitle="Theo dõi hóa đơn học phí, hình thức đóng và công dồn nợ kỳ trước" />

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex items-center justify-between hover:border-primary/25 transition-all">
          <div className="space-y-1">
            <div className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">Tổng phải thu (Receivable)</div>
            <div className="text-2xl font-extrabold text-foreground tabular-nums">{formatVND(totals.due)}</div>
          </div>
          <div className="bg-primary/10 p-3 rounded-lg text-primary">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex items-center justify-between hover:border-emerald-500/25 transition-all">
          <div className="space-y-1">
            <div className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">Tổng đã thu (Collected)</div>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatVND(totals.paid)}</div>
          </div>
          <div className="bg-emerald-500/10 p-3 rounded-lg text-emerald-600 dark:text-emerald-400">
            <Wallet className="h-6 w-6" />
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex items-center justify-between hover:border-rose-500/25 transition-all">
          <div className="space-y-1">
            <div className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">Còn nợ (Outstanding Debt)</div>
            <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 tabular-nums">{formatVND(totals.pending)}</div>
          </div>
          <div className="bg-rose-500/10 p-3 rounded-lg text-rose-600 dark:text-rose-400">
            <ArrowUpRight className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Filter and search actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 max-w-xl">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9 h-10 rounded-lg shadow-sm" placeholder="Tìm theo mã học sinh, tên học sinh, lớp, kỳ..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="h-10 rounded-lg border border-input bg-card text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm min-w-[180px]"
          >
            <option value="all">Tất cả lớp học</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1.5 bg-muted rounded-lg p-1 border border-border">
          {([
            ["all", "Tất cả"],
            ["unpaid", "Chưa thanh toán"],
            ["partial", "Trả một phần"],
            ["paid", "Đã thanh toán"],
          ] as const).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setFilter(k as any)}
              className={cn(
                "px-4 py-1.5 rounded-md text-xs font-semibold transition-all",
                filter === k ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Finance Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
              <tr>
                <th className="text-left font-semibold px-4 py-3 whitespace-nowrap">Mã Học viên</th>
                <th className="text-left font-semibold px-4 py-3 whitespace-nowrap">Tên Học viên</th>
                <th className="text-left font-semibold px-4 py-3 whitespace-nowrap">Lớp học</th>
                <th className="text-left font-semibold px-4 py-3 whitespace-nowrap">Hình thức thu</th>
                <th className="text-left font-semibold px-4 py-3 whitespace-nowrap">Kỳ thu phí</th>
                <th className="text-right font-semibold px-4 py-3 whitespace-nowrap">Nợ kỳ trước</th>
                <th className="text-right font-semibold px-4 py-3 whitespace-nowrap">Số tiền kỳ này</th>
                <th className="text-right font-semibold px-4 py-3 whitespace-nowrap">Tổng phải thu</th>
                <th className="text-right font-semibold px-4 py-3 whitespace-nowrap">Đã thu</th>
                <th className="text-left font-semibold px-4 py-3 whitespace-nowrap">Trạng thái</th>
                <th className="px-4 py-3 whitespace-nowrap"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((i) => (
                <tr key={i.id} className="hover:bg-muted/15 transition-colors">
                  <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground whitespace-nowrap">{i.studentId}</td>
                  <td className="px-4 py-3.5 font-semibold text-foreground whitespace-nowrap">{studentName(i.studentId)}</td>
                  <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">{className(i.classId)}</td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    {i.billingMethod === "course" ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        <Layers className="h-3 w-3" /> Theo khóa
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-500/10 px-2 py-0.5 rounded-full">
                        <Calendar className="h-3 w-3" /> Theo tháng
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 font-medium text-foreground whitespace-nowrap">{i.period}</td>
                  <td className="px-4 py-3.5 text-right font-mono text-muted-foreground tabular-nums whitespace-nowrap">{formatVND(i.previousDebt || 0)}</td>
                  <td className="px-4 py-3.5 text-right font-mono text-foreground font-medium tabular-nums whitespace-nowrap">{formatVND(i.currentAmount || 0)}</td>
                  <td className="px-4 py-3.5 text-right font-mono font-bold text-foreground tabular-nums whitespace-nowrap">{formatVND(i.amountDue)}</td>
                  <td className="px-4 py-3.5 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums whitespace-nowrap">{formatVND(i.amountPaid)}</td>
                  <td className="px-4 py-3.5 whitespace-nowrap"><StatusPill status={i.status} /></td>
                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    {i.status !== "paid" && (
                      <Button size="sm" variant="outline" className="border-primary/30 text-primary hover:bg-primary/5 hover:border-primary" onClick={() => openPay(i)}>
                        <Plus className="h-3.5 w-3.5 mr-1" /> Ghi nhận thanh toán
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-muted-foreground text-sm font-medium">Không tìm thấy hóa đơn nào khớp với bộ lọc</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ghi nhận thanh toán hóa đơn</DialogTitle>
            <DialogDescription>
              {active && (
                <span className="font-semibold text-foreground">
                  {studentName(active.studentId)} &bull; {className(active.classId)} &bull; {active.period}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          {active && (
            <div className="grid gap-4 py-3 text-sm">
              <div className="grid grid-cols-2 gap-3 border border-border p-3 rounded-lg bg-muted/20">
                <div>
                  <span className="text-xs text-muted-foreground block">Hình thức đóng phí</span>
                  <span className="font-bold text-foreground">
                    {active.billingMethod === "course" ? "Theo khóa" : "Theo tháng"}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Kỳ thu phí</span>
                  <span className="font-bold text-foreground">{active.period}</span>
                </div>
              </div>

              <div className="space-y-2 border-b border-border pb-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nợ kỳ trước:</span>
                  <span className="font-mono font-medium tabular-nums">{formatVND(active.previousDebt || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Học phí kỳ này:</span>
                  <span className="font-mono font-medium tabular-nums">{formatVND(active.currentAmount || 0)}</span>
                </div>
                <div className="flex justify-between border-t border-dashed border-border pt-2 text-base font-bold">
                  <span>Tổng phải thu:</span>
                  <span className="font-mono tabular-nums text-foreground">{formatVND(active.amountDue)}</span>
                </div>
              </div>

              <div className="space-y-2 pb-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Đã trả trước đó:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">{formatVND(active.amountPaid)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-rose-600 dark:text-rose-400">
                  <span>Còn lại cần đóng:</span>
                  <span className="font-mono tabular-nums">{formatVND(active.amountDue - active.amountPaid)}</span>
                </div>
              </div>

              <div className="grid gap-1.5 pt-2">
                <Label htmlFor="pay-amt">Số tiền thanh toán trong lượt này (VNĐ)</Label>
                <Input
                  id="pay-amt"
                  type="number"
                  value={payAmount}
                  max={active.amountDue - active.amountPaid}
                  onChange={(e) => setPayAmount(Math.min(active.amountDue - active.amountPaid, Number(e.target.value) || 0))}
                  className="font-mono font-bold text-base text-foreground"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setPayOpen(false)}>Hủy</Button>
            <Button size="sm" onClick={submitPay}>Xác nhận thanh toán</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}