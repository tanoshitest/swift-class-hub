import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Hammer } from "lucide-react";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Báo cáo — STEPS" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  return (
    <div className="p-8 max-w-7xl">
      <PageHeader title="Báo cáo" subtitle="Thống kê & phân tích hoạt động trung tâm" />
      <div className="rounded-xl border border-dashed border-border bg-card/50 py-24 flex flex-col items-center justify-center text-center">
        <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
          <Hammer className="h-6 w-6" />
        </div>
        <div className="text-lg font-semibold">Đang xây dựng</div>
        <div className="text-sm text-muted-foreground mt-1">Tính năng báo cáo sẽ sớm có mặt.</div>
      </div>
    </div>
  );
}