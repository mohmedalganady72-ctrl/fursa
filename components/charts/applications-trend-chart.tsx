"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatDateArabic } from "@/lib/utils";

interface ApplicationsTrendChartProps {
  data: Array<{ date: string; value: number }>;
}

/**
 * رسم بياني خطي لاتجاه عدد التقديمات خلال آخر 30 يومًا — يُستخدم في لوحة تحكم المدير.
 * الألوان مأخوذة من design tokens (primary-600) بدل قيم Hex حرة داخل المكوّن.
 */
export function ApplicationsTrendChart({ data }: ApplicationsTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(value) => formatDateArabic(value)}
          tick={{ fontSize: 12, fill: "#64748B" }}
          axisLine={{ stroke: "#E2E8F0" }}
          tickLine={false}
        />
        <YAxis tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          labelFormatter={(value) => formatDateArabic(value as string)}
          contentStyle={{
            borderRadius: 10,
            border: "1px solid #E2E8F0",
            fontSize: 13,
            direction: "rtl",
          }}
        />
        <Line
          type="monotone"
          dataKey="value"
          name="عدد الطلبات"
          stroke="#4F46E5"
          strokeWidth={2}
          dot={{ r: 3, fill: "#4F46E5" }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
