import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Users, GraduationCap, BookOpen, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useStore, formatVND } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Dashboard — EduCenter" }] }),
  component: Dashboard,
});

function Stat({ label, value, icon: Icon, tone = "primary", index }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-lg border border-border bg-card p-5 flex items-start justify-between"
    >
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
      </div>
      <div className={`h-9 w-9 rounded-md flex items-center justify-center bg-${tone}/10 text-${tone}`}>
        <Icon className="h-4 w-4" />
      </div>
    </motion.div>
  );
}

function Dashboard() {
  const { students, teachers, classes, invoices } = useStore();
  const pendingRevenue = invoices.reduce((acc, i) => acc + (i.amountDue - i.amountPaid), 0);
  const collected = invoices.reduce((acc, i) => acc + i.amountPaid, 0);

  return (
    <div className="p-8 max-w-7xl">
      <PageHeader title="Tổng quan" subtitle="Bảng điều khiển quản trị trung tâm" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat index={0} label="Tổng học sinh" value={students.length} icon={Users} tone="primary" />
        <Stat index={1} label="Giáo viên" value={teachers.length} icon={GraduationCap} tone="primary" />
        <Stat index={2} label="Lớp đang hoạt động" value={classes.length} icon={BookOpen} tone="primary" />
        <Stat index={3} label="Học phí còn nợ" value={formatVND(pendingRevenue)} icon={AlertCircle} tone="destructive" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-3">
        <div className="lg:col-span-2 rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4">Lớp học gần đây</h3>
          <div className="divide-y divide-border">
            {classes.map((c) => {
              const t = teachers.find((x) => x.id === c.teacherId);
              return (
                <div key={c.id} className="py-3 flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-muted-foreground text-xs">GV: {t?.name} • {c.studentIds.length} học sinh</div>
                  </div>
                  <div className="text-xs tabular-nums text-muted-foreground">{formatVND(c.feePerMonth)}/tháng</div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4">Doanh thu tháng</h3>
          <div className="space-y-3">
            <div>
              <div className="text-xs text-muted-foreground">Đã thu</div>
              <div className="text-xl font-semibold tabular-nums text-success">{formatVND(collected)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Còn nợ</div>
              <div className="text-xl font-semibold tabular-nums text-destructive">{formatVND(pendingRevenue)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
