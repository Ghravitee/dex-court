// src/features/index/components/RevenueChart.tsx
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
import { CustomTooltip } from "./CustomTooltip";
import { PulseLoader } from "./PulseLoader";

const TabsHeader = ({
  timeframe,
  setTimeframe,
}: {
  timeframe: "daily" | "weekly" | "monthly";
  setTimeframe: (v: "daily" | "weekly" | "monthly") => void;
}) => (
  <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as any)}>
    <TabsList className="bg-gray-800">
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
      <div className="card-cyan relative flex h-[400px] flex-col rounded-2xl border border-cyan-400/60 p-5">
        <div className="mb-4 flex flex-col justify-between gap-2 p-4 sm:flex-row sm:items-center sm:p-0">
          <h3 className="text-xl font-bold text-white">Platform Revenue</h3>
          <TabsHeader timeframe={timeframe} setTimeframe={setTimeframe} />
        </div>
        <div className="flex flex-1 flex-col items-center justify-center">
          <PulseLoader size="large" />
          <span className="ml-4 text-cyan-300">Loading revenue data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-cyan relative flex min-h-[400px] flex-col rounded-2xl border border-cyan-400/60 p-5">
        <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <h3 className="text-xl font-bold text-white">Platform Revenue</h3>
          <TabsHeader timeframe={timeframe} setTimeframe={setTimeframe} />
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-0 pb-6">
          <svg
            width="56"
            height="56"
            viewBox="0 0 56 56"
            fill="none"
            className="mb-5 opacity-70"
          >
            <rect width="56" height="56" rx="12" fill="rgba(239,68,68,0.08)" />
            <circle
              cx="28"
              cy="28"
              r="14"
              stroke="rgba(239,68,68,0.5)"
              strokeWidth="2"
              fill="none"
            />
            <line
              x1="28"
              y1="20"
              x2="28"
              y2="30"
              stroke="#ef4444"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx="28" cy="35" r="1.5" fill="#ef4444" />
          </svg>

          <p className="mb-2 text-base font-semibold text-slate-200">
            Failed to load revenue data
          </p>
          <p className="mb-6 max-w-[280px] text-center text-sm leading-relaxed text-slate-500">
            {error}
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
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="card-cyan relative flex min-h-[400px] flex-col rounded-2xl border border-cyan-400/60 p-5">
        <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <h3 className="text-xl font-bold text-white">Platform Revenue</h3>
          <TabsHeader timeframe={timeframe} setTimeframe={setTimeframe} />
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-0 pb-6">
          <svg
            width="56"
            height="56"
            viewBox="0 0 56 56"
            fill="none"
            className="mb-5 opacity-70"
          >
            <rect width="56" height="56" rx="12" fill="rgba(34,211,238,0.08)" />
            <rect
              x="12"
              y="36"
              width="8"
              height="8"
              rx="1"
              fill="rgba(34,211,238,0.35)"
            />
            <rect
              x="24"
              y="28"
              width="8"
              height="16"
              rx="1"
              fill="rgba(34,211,238,0.5)"
            />
            <rect
              x="36"
              y="20"
              width="8"
              height="24"
              rx="1"
              fill="rgba(34,211,238,0.7)"
            />
            <polyline
              points="16,34 28,26 40,18"
              stroke="#facc15"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="16" cy="34" r="2.5" fill="#facc15" />
            <circle cx="28" cy="26" r="2.5" fill="#facc15" />
            <circle cx="40" cy="18" r="2.5" fill="#facc15" />
          </svg>

          <p className="mb-2 text-base font-semibold text-slate-200">
            No revenue data yet
          </p>
          <p className="mb-6 max-w-[280px] text-center text-sm leading-relaxed text-slate-500">
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
      </div>
    );
  }

  return (
    <div className="card-cyan relative flex min-h-[400px] flex-col rounded-2xl border border-cyan-400/60 sm:p-5">
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
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(34, 211, 238, 0.1)"
              vertical={false}
            />
            <XAxis
              dataKey="period"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              allowDecimals={true}
              tickFormatter={(v) => `${v} ETH`}
            />
            <Tooltip
              content={<CustomTooltip />}
              formatter={(value, name) => [`${value} ETH`, name]}
            />
            <Legend />
            <Bar
              dataKey="newRevenue"
              name="New Revenue"
              fill="rgba(34, 211, 238, 0.6)"
              radius={[2, 2, 0, 0]}
              barSize={timeframe === "daily" ? 15 : 25}
            />
            <Line
              type="monotone"
              dataKey="totalRevenue"
              name="Total Revenue"
              stroke="#facc15"
              strokeWidth={2}
              dot={{ r: 3, fill: "#facc15" }}
              activeDot={{ r: 5, stroke: "#ffffff", strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};