"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { formatDateArabic } from "@/lib/utils";

const statusLabels: Record<string, string> = { applied: "جديد", under_review: "قيد المراجعة", shortlisted: "مرشّح مبدئيًا", accepted: "مقبول", rejected: "غير مقبول", withdrawn: "مسحوب", closed: "أُغلقت الفٌرصة" };
const statusColors: Record<string, string> = { accepted: "var(--color-success-500)", rejected: "var(--color-danger-500)", under_review: "var(--color-warning-500)", shortlisted: "var(--color-info-500)", applied: "var(--color-primary-500)" };
const tooltipStyle = { borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-primary)", fontSize: 13, direction: "rtl" as const };

export function OrganizationAnalytics({ trend, statuses, opportunities }: {
  trend: Array<{ date: string; value: number }>;
  statuses: Array<{ name: string; value: number }>;
  opportunities: Array<{ name: string; value: number }>;
}) {
  return <div className="mt-8 grid min-w-0 gap-5 lg:grid-cols-2">
    <Chart title="اتجاه الطلبات" className="lg:col-span-2">
      {trend.some((item) => item.value) ? <div className="h-[270px] min-w-0 w-full"><ResponsiveContainer width="100%" height="100%" minWidth={0}><AreaChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}><defs><linearGradient id="orgTrend" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#08745b" stopOpacity={0.3} /><stop offset="100%" stopColor="#08745b" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="date" tickFormatter={formatDateArabic} tick={{ fill: "var(--text-secondary)", fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={48} /><YAxis allowDecimals={false} width={28} tick={{ fill: "var(--text-secondary)", fontSize: 11 }} tickLine={false} axisLine={false} /><Tooltip contentStyle={tooltipStyle} labelFormatter={(value) => formatDateArabic(String(value))} /><Area isAnimationActive={false} type="monotone" dataKey="value" name="الطلبات" stroke="#08745b" strokeWidth={3} fill="url(#orgTrend)" dot={{ r: 2 }} activeDot={{ r: 5 }} /></AreaChart></ResponsiveContainer></div> : <Empty />}
    </Chart>
    <Chart title="حالات الطلبات">
      {statuses.length ? <ResponsiveContainer width="100%" height={260}><BarChart data={statuses.map((item) => ({ ...item, label: statusLabels[item.name] ?? item.name }))} layout="vertical"><CartesianGrid stroke="var(--border)" horizontal={false} /><XAxis type="number" allowDecimals={false} tick={{ fill: "var(--text-secondary)", fontSize: 11 }} axisLine={false} /><YAxis type="category" dataKey="label" width={76} tick={{ fill: "var(--text-secondary)", fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} /><Bar dataKey="value" name="الطلبات" radius={4}>{statuses.map((item) => <Cell key={item.name} fill={statusColors[item.name] ?? "var(--color-neutral-400)"} />)}</Bar></BarChart></ResponsiveContainer> : <Empty />}
    </Chart>
    <Chart title="المتقدمون حسب الفٌرصة">
      {opportunities.some((item) => item.value) ? <ResponsiveContainer width="100%" height={260}><BarChart data={opportunities}><CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="name" tick={{ fill: "var(--text-secondary)", fontSize: 10 }} tickLine={false} axisLine={false} interval={0} /><YAxis allowDecimals={false} tick={{ fill: "var(--text-secondary)", fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} /><Bar dataKey="value" name="المتقدمون" fill="var(--color-accent-500)" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer> : <Empty />}
    </Chart>
  </div>;
}

function Chart({ title, className, children }: { title: string; className?: string; children: React.ReactNode }) { return <Card className={`min-w-0 p-5 ${className ?? ""}`}><h2 className="mb-5 text-h4 text-neutral-800">{title}</h2>{children}</Card>; }
function Empty() { return <div className="flex h-[260px] items-center justify-center text-body-sm text-secondary">ستظهر البيانات عند وصول التقديمات</div>; }
