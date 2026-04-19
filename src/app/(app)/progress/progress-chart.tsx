"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type ReviewPoint = { day: string; reviews: number };

export function ProgressChart({ data }: { data: ReviewPoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="fillReviews" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="oklch(0.7 0.15 250)" stopOpacity={0.35} />
              <stop offset="95%" stopColor="oklch(0.7 0.15 250)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
          <XAxis dataKey="day" tickLine={false} axisLine={false} className="text-xs text-muted-foreground" />
          <YAxis allowDecimals={false} width={32} tickLine={false} axisLine={false} className="text-xs text-muted-foreground" />
          <Tooltip
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid oklch(0.92 0 0)",
            }}
            labelStyle={{ fontWeight: 600 }}
          />
          <Area
            type="monotone"
            dataKey="reviews"
            stroke="oklch(0.55 0.18 270)"
            fill="url(#fillReviews)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
