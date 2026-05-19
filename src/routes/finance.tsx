import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Plus, Layers, Calendar, DollarSign, Wallet, ArrowUpRight, MessageSquare, Landmark, CreditCard } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useStore, formatVND, type Invoice } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export type ReceiptJournalEntry = {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  amount: number;
  paymentMethod: "cash" | "bank";
  content: string;
  date: string;
};

const generateMockReceipts = (studentsList: any[], classesList: any[]): ReceiptJournalEntry[] => {
  const list: ReceiptJournalEntry[] = [];
  const periods = ["Tháng 1/2026", "Tháng 2/2026", "Tháng 3/2026", "Tháng 4/2026", "Tháng 5/2026"];
  
  for (let i = 1; i <= 500; i++) {
    const student = studentsList[(i - 1) % studentsList.length];
    const cls = classesList[(i - 1) % classesList.length];
    const period = periods[(i - 1) % periods.length];
    const paymentMethod = i % 3 === 0 ? "cash" : "bank";
    
    // Spread dates realistically from Jan 1st to May 19th 2026
    const day = String((i % 28) + 1).padStart(2, "0");
    const month = String((i % 5) + 1).padStart(2, "0");
    const dateStr = `2026-${month}-${day}`;
    
    const amount = i % 4 === 0 ? 750000 : i % 5 === 0 ? 5000000 : 1500000;
    const receiptId = `PT-${String(i).padStart(4, "0")}`;
    
    let content = "";
    if (paymentMethod === "cash") {
      content = `Thu tiền mặt học phí ${period} - Học sinh: ${student.name} (Phòng tuyển sinh)`;
    } else {
      content = `CK HP ${period} ${student.name} GD_PAY_${900000 + i}`;
    }
    
    list.push({
      id: receiptId,
      studentId: student.id,
      studentName: student.name,
      classId: cls.id,
      className: cls.name,
      amount,
      paymentMethod,
      content,
      date: dateStr
    });
  }
  return list.reverse();
};

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
  
  // Tab Navigation: Tuition Invoices vs Receipts Log
  const [activeView, setActiveView] = useState<"invoices" | "journal">("invoices");

  // Invoices filters states
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | Invoice["status"]>("all");
  const [classFilter, setClassFilter] = useState<string>("all");

  // Receipts Journal states (Seeded with 500 rows!)
  const [receipts, setReceipts] = useState<ReceiptJournalEntry[]>(() =>
    generateMockReceipts(students, classes)
  );
  const [qJournal, setQJournal] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Payment Recording States
  const [payOpen, setPayOpen] = useState(false);
  const [active, setActive] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState<"cash" | "bank">("cash");
  const [payMemo, setPayMemo] = useState("");
  const [payDate, setPayDate] = useState("2026-05-19");

  const studentName = (id: string) => students.find((s) => s.id === id)?.name ?? "—";
  const className = (id: string) => classes.find((c) => c.id === id)?.name ?? "—";

  // INVOICES FILTER LOGIC
  const filteredInvoices = invoices.filter((i) => {
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

  // RECEIPTS FILTER LOGIC (500 rows date filtering)
  const filteredReceipts = receipts.filter((r) => {
    if (qJournal) {
      const searchTxt = `${r.id} ${r.studentName} ${r.content} ${r.className} ${r.paymentMethod === "cash" ? "tiền mặt" : "chuyển khoản"}`.toLowerCase();
      if (!searchTxt.includes(qJournal.toLowerCase())) return false;
    }
    if (startDate && r.date < startDate) return false;
    if (endDate && r.date > endDate) return false;
    return true;
  });

  const journalTotals = filteredReceipts.reduce(
    (acc, r) => {
      if (r.paymentMethod === "cash") {
        acc.cash += r.amount;
      } else {
        acc.bank += r.amount;
      }
      acc.total += r.amount;
      return acc;
    },
    { cash: 0, bank: 0, total: 0 }
  );

  // OPEN PAYMENT RECORDER
  const openPay = (inv: Invoice) => {
    setActive(inv);
    const amount = inv.amountDue - inv.amountPaid;
    setPayAmount(amount);
    setPayMethod("cash");
    setPayMemo(`Thu tiền mặt học phí ${inv.period} - Học sinh: ${studentName(inv.studentId)} (Phòng tuyển sinh)`);
    setPayDate("2026-05-19");
    setPayOpen(true);
  };

  const handlePayMethodChange = (method: "cash" | "bank") => {
    setPayMethod(method);
    if (active) {
      if (method === "cash") {
        setPayMemo(`Thu tiền mặt học phí ${active.period} - Học sinh: ${studentName(active.studentId)} (Phòng tuyển sinh)`);
      } else {
        setPayMemo(`CK HP ${active.period} ${studentName(active.studentId)} GD_PAY_${Date.now().toString().slice(-6)}`);
      }
    }
  };

  // CONFIRM PAYMENT RECORDER
  const submitPay = () => {
    if (!active) return;
    const newPaid = Math.min(active.amountDue, active.amountPaid + payAmount);
    const status: Invoice["status"] = newPaid >= active.amountDue ? "paid" : newPaid > 0 ? "partial" : "unpaid";
    
    // 1. Update the invoices store list
    setInvoices(invoices.map((i) => (i.id === active.id ? { ...i, amountPaid: newPaid, status } : i)));

    // 2. Automatically create a Receipt Journal Entry (dinh danh theo phieu thu)
    const nextPTNum = receipts.length + 1;
    const nextReceiptId = `PT-${String(nextPTNum).padStart(4, "0")}`;
    const newReceipt: ReceiptJournalEntry = {
      id: nextReceiptId,
      studentId: active.studentId,
      studentName: studentName(active.studentId),
      classId: active.classId,
      className: className(active.classId),
      amount: payAmount,
      paymentMethod: payMethod,
      content: payMemo || (payMethod === "cash" ? `Thu tiền mặt học phí ${active.period} - Học sinh: ${studentName(active.studentId)}` : `CK HP ${active.period} ${studentName(active.studentId)}`),
      date: payDate || "2026-05-19"
    };

    // Prepend to receipts log
    setReceipts([newReceipt, ...receipts]);
    setPayOpen(false);
  };

  return (
    <div className="p-4 sm:p-8 max-w-[1440px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <PageHeader title="Quản lý học phí & Tài chính" subtitle="Theo dõi hóa đơn học phí, hình thức đóng và công dồn nợ kỳ trước" />
        
        {/* Workspace tab switcher */}
        <div className="flex items-center gap-1.5 bg-muted rounded-xl p-1 border border-border self-start">
          <button
            onClick={() => setActiveView("invoices")}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-2xs",
              activeView === "invoices" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Layers className="h-3.5 w-3.5 text-primary" /> Hóa đơn học phí
          </button>
          <button
            onClick={() => setActiveView("journal")}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-2xs",
              activeView === "journal" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Wallet className="h-3.5 w-3.5 text-emerald-500" /> Nhật ký thu tiền (500 dòng)
          </button>
        </div>
      </div>

      {/* Dynamic Overview Cards based on active tab */}
      {activeView === "invoices" ? (
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex items-center justify-between hover:border-blue-500/25 transition-all">
            <div className="space-y-1">
              <div className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">Nhật ký: Tiền mặt đã thu</div>
              <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 tabular-nums">{formatVND(journalTotals.cash)}</div>
            </div>
            <div className="bg-blue-500/10 p-3 rounded-lg text-blue-600 dark:text-blue-400">
              <CreditCard className="h-6 w-6" />
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex items-center justify-between hover:border-emerald-500/25 transition-all">
            <div className="space-y-1">
              <div className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">Nhật ký: Chuyển khoản đã thu</div>
              <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatVND(journalTotals.bank)}</div>
            </div>
            <div className="bg-emerald-500/10 p-3 rounded-lg text-emerald-600 dark:text-emerald-400">
              <Landmark className="h-6 w-6" />
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex items-center justify-between hover:border-primary/25 transition-all">
            <div className="space-y-1">
              <div className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">Tổng cộng nhật ký thu</div>
              <div className="text-2xl font-extrabold text-foreground tabular-nums">{formatVND(journalTotals.total)}</div>
            </div>
            <div className="bg-primary/10 p-3 rounded-lg text-primary">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Filters depending on view */}
      {activeView === "invoices" ? (
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
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 bg-muted/20 border border-border p-3.5 rounded-xl shadow-xs">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9 h-10 rounded-lg shadow-sm bg-card text-xs font-medium"
              placeholder="Tìm theo phiếu thu, tên học sinh, nội dung..."
              value={qJournal}
              onChange={(e) => setQJournal(e.target.value)}
            />
          </div>

          {/* Date range start */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold text-muted-foreground uppercase whitespace-nowrap">Từ ngày:</span>
            <Input
              type="date"
              className="h-10 rounded-lg shadow-sm bg-card text-xs font-bold font-mono"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          {/* Date range end */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold text-muted-foreground uppercase whitespace-nowrap">Tới ngày:</span>
            <Input
              type="date"
              className="h-10 rounded-lg shadow-sm bg-card text-xs font-bold font-mono"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          {/* Clear button */}
          <div className="flex items-center gap-2">
            {(startDate || endDate || qJournal) && (
              <Button
                variant="outline"
                size="sm"
                className="h-10 flex-1 border-rose-200 text-rose-600 dark:border-rose-950 dark:text-rose-400 text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-950/20"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  setQJournal("");
                }}
              >
                Xóa bộ lọc & Xoá ngày
              </Button>
            )}
            <div className="text-[10px] font-extrabold text-muted-foreground ml-auto bg-card px-3 py-2 rounded-lg border border-border whitespace-nowrap inline-flex items-center gap-1">
              Tìm thấy <span className="text-emerald-600 tabular-nums">{filteredReceipts.length}</span> / 500 dòng
            </div>
          </div>
        </div>
      )}

      {/* Main Content Tables */}
      {activeView === "invoices" ? (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 text-[10px] uppercase tracking-wide text-muted-foreground border-b border-border">
                <tr>
                  <th className="text-left font-semibold px-2.5 py-3 whitespace-nowrap">Mã Học viên</th>
                  <th className="text-left font-semibold px-2.5 py-3 whitespace-nowrap">Tên Học viên</th>
                  <th className="text-left font-semibold px-2.5 py-3">Lớp học</th>
                  <th className="text-left font-semibold px-2.5 py-3 whitespace-nowrap">Hình thức thu</th>
                  <th className="text-left font-semibold px-2.5 py-3">Kỳ thu phí</th>
                  <th className="text-right font-semibold px-2.5 py-3 whitespace-nowrap">Nợ kỳ trước</th>
                  <th className="text-right font-semibold px-2.5 py-3 whitespace-nowrap">Số tiền kỳ này</th>
                  <th className="text-right font-semibold px-2.5 py-3 whitespace-nowrap">Tổng phải thu</th>
                  <th className="text-right font-semibold px-2.5 py-3 whitespace-nowrap">Đã thu</th>
                  <th className="text-left font-semibold px-2.5 py-3 whitespace-nowrap">Trạng thái</th>
                  <th className="px-2.5 py-3 whitespace-nowrap"></th>
                  {(filter === "unpaid" || filter === "partial") && (
                    <th className="text-center font-bold px-2.5 py-3 whitespace-nowrap text-[#0068FF] bg-[#0068FF]/5">Nhắc nợ qua Zalo</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredInvoices.map((i) => (
                  <tr key={i.id} className="hover:bg-muted/15 transition-colors">
                    <td className="px-2.5 py-3 font-mono text-muted-foreground whitespace-nowrap">{i.studentId}</td>
                    <td className="px-2.5 py-3 font-semibold text-foreground whitespace-nowrap">{studentName(i.studentId)}</td>
                    <td className="px-2.5 py-3 text-muted-foreground leading-snug max-w-[180px] break-words">{className(i.classId)}</td>
                    <td className="px-2.5 py-3 whitespace-nowrap">
                      {i.billingMethod === "course" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                          <Layers className="h-3 w-3" /> Theo khóa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-500/10 px-2 py-0.5 rounded-md">
                          <Calendar className="h-3 w-3" /> Theo tháng
                        </span>
                      )}
                    </td>
                    <td className="px-2.5 py-3 font-medium text-foreground leading-snug max-w-[120px] break-words">{i.period}</td>
                    <td className="px-2.5 py-3 text-right font-mono text-muted-foreground tabular-nums whitespace-nowrap">{formatVND(i.previousDebt || 0)}</td>
                    <td className="px-2.5 py-3 text-right font-mono text-foreground font-medium tabular-nums whitespace-nowrap">{formatVND(i.currentAmount || 0)}</td>
                    <td className="px-2.5 py-3 text-right font-mono font-bold text-foreground tabular-nums whitespace-nowrap">{formatVND(i.amountDue)}</td>
                    <td className="px-2.5 py-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums whitespace-nowrap">{formatVND(i.amountPaid)}</td>
                    <td className="px-2.5 py-3 whitespace-nowrap"><StatusPill status={i.status} /></td>
                    <td className="px-2.5 py-3 text-right whitespace-nowrap">
                      {i.status !== "paid" && (
                        <Button size="sm" variant="outline" className="h-7 text-[10px] border-primary/30 text-primary hover:bg-primary/5 hover:border-primary" onClick={() => openPay(i)}>
                          <Plus className="h-3 w-3 mr-1" /> Ghi nhận
                        </Button>
                      )}
                    </td>
                    {(filter === "unpaid" || filter === "partial") && (
                      <td className="px-2.5 py-3 text-center whitespace-nowrap bg-[#0068FF]/[0.01]">
                        <button
                          onClick={() => {
                            alert(`Đã soạn mẫu nhắc nợ qua Zalo gửi đến phụ huynh học sinh ${studentName(i.studentId)}:\n\n"Kính gửi Phụ huynh học sinh ${studentName(i.studentId)}, trung tâm STEPS xin thông báo học phí lớp ${className(i.classId)} kỳ ${i.period} hiện tại còn nợ: ${formatVND(i.amountDue - i.amountPaid)}. Kính mong phụ huynh sớm hoàn thành để đảm bảo quyền lợi học tập cho con."`);
                          }}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-[#0068FF] bg-[#0068FF]/10 hover:bg-[#0068FF] hover:text-white px-2 py-1 rounded-md border border-[#0068FF]/20 transition-all shadow-xs"
                        >
                          <MessageSquare className="h-3 w-3" /> Nhắc nợ Zalo
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {!filteredInvoices.length && (
                  <tr>
                    <td colSpan={filter === "unpaid" || filter === "partial" ? 12 : 11} className="px-4 py-12 text-center text-muted-foreground text-sm font-medium">Không tìm thấy hóa đơn nào khớp với bộ lọc</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* RECEIPT JOURNAL TABLE (500 lines) */
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 text-[10px] uppercase tracking-wide text-muted-foreground border-b border-border">
                <tr>
                  <th className="text-left font-semibold px-4 py-3.5 whitespace-nowrap">Mã Phiếu Thu</th>
                  <th className="text-left font-semibold px-3 py-3.5 whitespace-nowrap">Ngày Giao dịch</th>
                  <th className="text-left font-semibold px-3 py-3.5 whitespace-nowrap">Học viên</th>
                  <th className="text-left font-semibold px-3 py-3.5">Lớp học</th>
                  <th className="text-right font-semibold px-3 py-3.5 whitespace-nowrap">Số tiền thu</th>
                  <th className="text-left font-semibold px-3 py-3.5 whitespace-nowrap">Hình thức đóng</th>
                  <th className="text-left font-semibold px-4 py-3.5">Nội dung / Ghi chú giao dịch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {filteredReceipts.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-primary whitespace-nowrap">{r.id}</td>
                    <td className="px-3 py-3 font-mono text-muted-foreground whitespace-nowrap">{r.date.split("-").reverse().join("/")}</td>
                    <td className="px-3 py-3 font-semibold text-foreground whitespace-nowrap">{r.studentName}</td>
                    <td className="px-3 py-3 text-muted-foreground leading-snug max-w-[180px] break-words">{r.className}</td>
                    <td className="px-3 py-3 text-right font-mono font-extrabold text-foreground tabular-nums whitespace-nowrap">{formatVND(r.amount)}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {r.paymentMethod === "cash" ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-blue-700 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-200/50 uppercase">
                          <CreditCard className="h-3 w-3 text-blue-500" /> Tiền mặt
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-200/50 uppercase">
                          <Landmark className="h-3 w-3 text-emerald-500" /> Chuyển khoản
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground leading-normal max-w-[320px] break-words text-[11px] font-normal">{r.content}</td>
                  </tr>
                ))}
                {!filteredReceipts.length && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground text-sm font-medium">Không tìm thấy phiếu thu nào khớp với bộ lọc ngày hoặc từ khóa</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upgraded Payment Recording Modal */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <Wallet className="h-5 w-5" /> Ghi nhận thanh toán hóa đơn học phí
            </DialogTitle>
            <DialogDescription>
              {active && (
                <span className="font-semibold text-foreground block mt-1">
                  {studentName(active.studentId)} &bull; {className(active.classId)} &bull; {active.period}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {active && (
            <div className="grid gap-3.5 py-3 text-xs leading-normal">
              {/* Class Info Box */}
              <div className="grid grid-cols-2 gap-3 border border-border p-3 rounded-lg bg-muted/20">
                <div>
                  <span className="text-[10px] text-muted-foreground block uppercase font-bold tracking-wider">Hình thức đóng phí</span>
                  <span className="font-extrabold text-foreground">
                    {active.billingMethod === "course" ? "Theo khóa" : "Theo tháng"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block uppercase font-bold tracking-wider">Kỳ thu phí</span>
                  <span className="font-extrabold text-foreground">{active.period}</span>
                </div>
              </div>

              {/* Debt calculations breakdown */}
              <div className="space-y-2 border-b border-border pb-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-semibold">Nợ kỳ trước dồn lại:</span>
                  <span className="font-mono font-bold tabular-nums">{formatVND(active.previousDebt || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-semibold">Học phí kỳ này:</span>
                  <span className="font-mono font-bold tabular-nums">{formatVND(active.currentAmount || 0)}</span>
                </div>
                <div className="flex justify-between border-t border-dashed border-border pt-2 text-sm font-extrabold">
                  <span>Tổng phải thu kỳ này:</span>
                  <span className="font-mono tabular-nums text-foreground">{formatVND(active.amountDue)}</span>
                </div>
              </div>

              {/* Current balance */}
              <div className="space-y-2 pb-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-semibold">Đã trả trước đó:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-extrabold tabular-nums">{formatVND(active.amountPaid)}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-rose-600 dark:text-rose-400">
                  <span>Còn nợ cần đóng:</span>
                  <span className="font-mono tabular-nums">{formatVND(active.amountDue - active.amountPaid)}</span>
                </div>
              </div>

              {/* Input: Recording Method Toggle */}
              <div className="grid gap-1.5">
                <Label className="text-xs font-bold text-foreground">Phương thức thanh toán</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handlePayMethodChange("cash")}
                    className={cn(
                      "h-9 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs",
                      payMethod === "cash"
                        ? "bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                        : "bg-card border-border hover:bg-muted text-muted-foreground"
                    )}
                  >
                    <CreditCard className="h-4 w-4" /> Tiền mặt
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePayMethodChange("bank")}
                    className={cn(
                      "h-9 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs",
                      payMethod === "bank"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "bg-card border-border hover:bg-muted text-muted-foreground"
                    )}
                  >
                    <Landmark className="h-4 w-4" /> Chuyển khoản (Tự tạo phiếu thu)
                  </button>
                </div>
              </div>

              {/* Input: Payment Date */}
              <div className="grid gap-1.5">
                <Label htmlFor="pay-date" className="text-xs font-bold">Ngày đóng học phí</Label>
                <Input
                  id="pay-date"
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="font-mono font-bold h-9 text-xs"
                />
              </div>

              {/* Input: Recording amount */}
              <div className="grid gap-1.5">
                <Label htmlFor="pay-amt" className="text-xs font-bold">Số tiền đóng đợt này (VNĐ)</Label>
                <Input
                  id="pay-amt"
                  type="number"
                  value={payAmount}
                  max={active.amountDue - active.amountPaid}
                  onChange={(e) => setPayAmount(Math.min(active.amountDue - active.amountPaid, Number(e.target.value) || 0))}
                  className="font-mono font-bold text-sm text-foreground h-9"
                />
              </div>

              {/* Input: Memo */}
              <div className="grid gap-1.5">
                <Label htmlFor="pay-memo" className="text-xs font-bold">Nội dung phiếu thu / Giao dịch</Label>
                <Input
                  id="pay-memo"
                  placeholder="Nhập nội dung chuyển khoản hoặc ghi chú..."
                  value={payMemo}
                  onChange={(e) => setPayMemo(e.target.value)}
                  className="text-xs font-medium h-9"
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setPayOpen(false)}>Hủy bỏ</Button>
            <Button size="sm" className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold" onClick={submitPay}>Xác nhận ghi nhận & Tạo phiếu thu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}