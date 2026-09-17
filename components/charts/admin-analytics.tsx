"use client";

import * as React from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { formatDateArabic } from "@/lib/utils";

const typeLabels: Record<string, string> = { job: "عمل", volunteering: "تطوع", co_op: "تدريب تعاوني" };
const statusLabels: Record<string, string> = { applied: "جديد", under_review: "قيد المراجعة", shortlisted: "مرشح", accepted: "مقبول", rejected: "مرفوض", withdrawn: "منسحب", closed: "مغلق" };
const pieColors = ["var(--color-primary-600)", "var(--color-accent-500)", "var(--color-info-500)"];
const statusColors: Record<string, string> = { accepted: "var(--color-success-500)", rejected: "var(--color-danger-500)", under_review: "var(--color-warning-500)", applied: "var(--color-primary-500)" };
const tooltipStyle = { borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-primary)", fontSize: 13, direction: "rtl" as const };

export function AdminAnalytics({ trend, opportunityTypes, applicationStatuses, approved, totalOrganizations }: { trend: Array<{ date: string; value: number }>; opportunityTypes: Array<{ name: string; value: number }>; applicationStatuses: Array<{ name: string; value: number }>; approved: number; totalOrganizations: number }) {
  const [period, setPeriod] = React.useState<7 | 30>(30);
  const visibleTrend = trend.slice(-period);
  const approvalRate = totalOrganizations ? Math.round((approved / totalOrganizations) * 100) : 0;
  return <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
    <ChartCard title="اتجاه التقديمات" action={<div className="flex rounded-md bg-neutral-100 p-1">{([7, 30] as const).map((value) => <button key={value} onClick={() => setPeriod(value)} className={`rounded-sm px-3 py-1 text-caption ${period === value ? "bg-surface text-primary-700 shadow-xs" : "text-neutral-500"}`}>{value} أيام</button>)}</div>}>
      {visibleTrend.some((item) => item.value) ? <ResponsiveContainer width="100%" height={260}><AreaChart data={visibleTrend}><defs><linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-primary-500)" stopOpacity={0.32}/><stop offset="100%" stopColor="var(--color-primary-500)" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="var(--border)" vertical={false}/><XAxis dataKey="date" tickFormatter={formatDateArabic} tick={{ fill: "var(--text-secondary)", fontSize: 11 }} tickLine={false} axisLine={false}/><YAxis allowDecimals={false} tick={{ fill: "var(--text-secondary)", fontSize: 11 }} tickLine={false} axisLine={false}/><Tooltip contentStyle={tooltipStyle} labelFormatter={(value) => formatDateArabic(String(value))}/><Area type="monotone" dataKey="value" name="التقديمات" stroke="var(--color-primary-600)" strokeWidth={3} fill="url(#trendFill)" activeDot={{ r: 5 }}/></AreaChart></ResponsiveContainer> : <EmptyChart />}
    </ChartCard>
    <ChartCard title="الفرص حسب النوع"><ResponsiveContainer width="100%" height={260}><PieChart><Pie data={opportunityTypes.map((item) => ({ ...item, label: typeLabels[item.name] ?? item.name }))} dataKey="value" nameKey="label" innerRadius={62} outerRadius={92} paddingAngle={3}>{opportunityTypes.map((_, index) => <Cell key={index} fill={pieColors[index % pieColors.length]} />)}</Pie><Tooltip contentStyle={tooltipStyle}/></PieChart></ResponsiveContainer></ChartCard>
    <ChartCard title="حالات التقديمات"><ResponsiveContainer width="100%" height={260}><BarChart data={applicationStatuses.map((item) => ({ ...item, label: statusLabels[item.name] ?? item.name }))} layout="vertical" margin={{ right: 10, left: 10 }}><CartesianGrid stroke="var(--border)" horizontal={false}/><XAxis type="number" allowDecimals={false} tick={{ fill: "var(--text-secondary)", fontSize: 11 }} axisLine={false}/><YAxis type="category" dataKey="label" width={76} tick={{ fill: "var(--text-secondary)", fontSize: 11 }} axisLine={false} tickLine={false}/><Tooltip contentStyle={tooltipStyle}/><Bar dataKey="value" name="التقديمات" radius={[4, 4, 4, 4]}>{applicationStatuses.map((item) => <Cell key={item.name} fill={statusColors[item.name] ?? "var(--color-neutral-400)"}/>)}</Bar></BarChart></ResponsiveContainer></ChartCard>
    <ChartCard title="اعتماد الجهات"><div className="flex h-[260px] flex-col items-center justify-center"><div className="relative flex h-40 w-40 items-center justify-center rounded-full" style={{ background: `conic-gradient(var(--color-primary-600) ${approvalRate}%, var(--color-neutral-200) 0)` }}><div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-surface"><strong className="ltr-numerals text-3xl text-neutral-900">{approvalRate}%</strong><span className="text-caption text-secondary">معتمدة</span></div></div><p className="mt-5 text-body-sm text-secondary">{approved} من أصل {totalOrganizations} جهة</p></div></ChartCard>
  </div>;
}

function ChartCard({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) { return <Card className="p-5"><div className="mb-4 flex min-h-8 items-center justify-between gap-3"><h2 className="text-h4 text-neutral-800">{title}</h2>{action}</div>{children}</Card>; }
function EmptyChart() { return <div className="flex h-[260px] items-center justify-center text-body-sm text-secondary">لا توجد بيانات كافية لهذه الفترة</div>; }
