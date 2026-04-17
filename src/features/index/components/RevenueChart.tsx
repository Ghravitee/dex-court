/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from "react";
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Legend,
} from "recharts";
import { Tabs, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { useRevenueData } from "../hooks/useRevenueData";
import { groupRevenueByTimeframe } from "../utils/revenueHelpers";
import { PulseLoader } from "./PulseLoader";

const TabsHeader = ({
  timeframe,
  setTimeframe,
}: {
  timeframe: "daily" | "weekly" | "monthly";
  setTimeframe: (v: "daily" | "weekly" | "monthly") => void;
}) => (
  <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as any)}>
    <TabsList className="bg-white/5">
      <TabsTrigger value="daily">Daily</TabsTrigger>
      <TabsTrigger value="weekly">Weekly</TabsTrigger>
      <TabsTrigger value="monthly">Monthly</TabsTrigger>
    </TabsList>
  </Tabs>
);

export const RevenueChart = () => {
  const { data: rawData, loading, error } = useRevenueData();
  const [timeframe, setTimeframe] = useState<"daily" | "weekly" | "monthly">(
    "daily",
  );

  const chartData = useMemo(
    () => groupRevenueByTimeframe(rawData, timeframe),
    [rawData, timeframe],
  );

  if (loading) {
    return (
      <section className="card-cyan relative flex h-[400px] flex-col rounded-2xl border border-cyan-400/60 p-5">
        <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <h3 className="text-xl font-bold text-white">Platform Revenue</h3>
          <TabsHeader timeframe={timeframe} setTimeframe={setTimeframe} />
        </div>
        <div className="flex flex-1 flex-col items-center justify-center">
          <PulseLoader size="large" />
          <span className="mt-4 text-cyan-300">Loading revenue data...</span>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="card-cyan relative flex min-h-[400px] flex-col rounded-2xl border border-cyan-400/60 p-5">
        <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <h3 className="text-xl font-bold text-white">Platform Revenue</h3>
          <TabsHeader timeframe={timeframe} setTimeframe={setTimeframe} />
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <p className="text-base font-semibold text-slate-200">
            Failed to load revenue data
          </p>
          <p className="max-w-[280px] text-center text-sm text-slate-500">
            {error}
          </p>
        </div>
      </section>
    );
  }

  if (chartData.length === 0) {
    return (
      <section className="card-cyan relative flex min-h-[400px] flex-col rounded-2xl border border-cyan-400/60 p-5">
        <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <h3 className="text-xl font-bold text-white">Platform Revenue</h3>
          <TabsHeader timeframe={timeframe} setTimeframe={setTimeframe} />
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 pb-6">
          <p className="text-base font-semibold text-slate-200">
            No revenue data yet
          </p>
          <p className="max-w-[280px] text-center text-sm leading-relaxed text-slate-500">
            Once platform revenue is generated, new and cumulative totals will
            appear here.
          </p>
          <div className="grid w-full max-w-[340px] grid-cols-2 gap-2.5">
            <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/[0.06] p-3.5">
              <div className="mb-1.5 flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm bg-cyan-400/60" />
                <span className="text-[11px] tracking-wide text-slate-500 uppercase">
                  New Revenue
                </span>
              </div>
              <span className="text-xl font-medium text-slate-400">—</span>
            </div>
            <div className="rounded-xl border border-yellow-400/20 bg-yellow-400/[0.06] p-3.5">
              <div className="mb-1.5 flex items-center gap-1.5">
                <div className="h-0.5 w-2.5 rounded bg-yellow-400" />
                <span className="text-[11px] tracking-wide text-slate-500 uppercase">
                  Total Revenue
                </span>
              </div>
              <span className="text-xl font-medium text-slate-400">—</span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="card-cyan relative flex min-h-[400px] flex-col rounded-2xl border border-cyan-400/60 sm:p-5">
      <div className="mb-4 flex flex-col justify-between gap-2 p-4 sm:flex-row sm:items-center sm:p-0">
        <h3 className="text-xl font-bold text-white">Platform Revenue</h3>
        <TabsHeader timeframe={timeframe} setTimeframe={setTimeframe} />
      </div>
      <div className="min-h-[300px] flex-1 p-4 sm:p-0">
        <ResponsiveContainer
          width="100%"
          height="100%"
          minHeight={300}
          minWidth={0}
        >
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="period"
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(15,23,42,.9)",
                border: "1px solid rgba(255,255,255,.1)",
                borderRadius: 8,
                color: "#e2e8f0",
              }}
              formatter={(value, name) => [`$${value}`, name]}
            />
            <Legend />
            <Bar
              dataKey="newRevenue"
              name="New Revenue"
              fill="rgba(34,211,238,0.6)"
              radius={[2, 2, 0, 0]}
              barSize={timeframe === "daily" ? 15 : 25}
            />
            <Line
              type="monotone"
              dataKey="totalRevenue"
              name="Total Revenue"
              stroke="#22d3ee"
              strokeWidth={2}
              dot={{ r: 3, fill: "#22d3ee" }}
              activeDot={{ r: 5, stroke: "#ffffff", strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};
