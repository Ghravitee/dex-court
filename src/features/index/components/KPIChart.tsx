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
import { useAllAgreementsForGrowth } from "../../../hooks/useAllAgreementsForGrowth";
import { groupByTimeframe } from "../utils/chartHelpers";
import { CustomTooltip } from "./CustomTooltip";
import { PulseLoader } from "./PulseLoader";

export const KPIChart = () => {
  const { data: rawData, loading } = useAllAgreementsForGrowth();
  const [timeframe, setTimeframe] = useState<"daily" | "weekly" | "monthly">(
    "daily",
  );

  const chartData = useMemo(() => {
    return groupByTimeframe(rawData, timeframe);
  }, [rawData, timeframe]);

  if (loading) {
    return (
      <div className="card-cyan relative flex h-[400px] flex-col rounded-2xl border border-cyan-400/60 p-5">
        <div className="mb-4 flex flex-col justify-between gap-2 p-4 sm:flex-row sm:items-center sm:p-0">
          <div>
            <h3 className="text-xl font-bold text-white">Network Growth</h3>
          </div>
          <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as any)}>
            <TabsList className="bg-gray-800">
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center">
          <PulseLoader size="large" />
          <span className="ml-4 text-cyan-300">Loading growth data...</span>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="card-cyan relative flex min-h-[400px] flex-col rounded-2xl border border-cyan-400/60 p-5">
        <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <h3 className="text-xl font-bold text-white">Network Growth</h3>
          <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as any)}>
            <TabsList className="bg-gray-800">
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-0 pb-6">
          {/* Mini chart icon */}
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
            No agreement data yet
          </p>
          <p className="mb-6 max-w-[280px] text-center text-sm leading-relaxed text-slate-500">
            Once agreements are created in the network, new and cumulative
            totals will appear here.
          </p>

          {/* Legend preview cards */}
          <div className="grid w-full max-w-[340px] grid-cols-2 gap-2.5">
            <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/[0.06] p-3.5">
              <div className="mb-1.5 flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm bg-cyan-400/60" />
                <span className="text-[11px] tracking-wide text-slate-500 uppercase">
                  New agreements
                </span>
              </div>
              <span className="text-xl font-medium text-slate-400">—</span>
            </div>
            <div className="rounded-xl border border-yellow-400/20 bg-yellow-400/[0.06] p-3.5">
              <div className="mb-1.5 flex items-center gap-1.5">
                <div className="h-0.5 w-2.5 rounded bg-yellow-400" />
                <span className="text-[11px] tracking-wide text-slate-500 uppercase">
                  Total agreements
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
        <div>
          <h3 className="text-xl font-bold text-white">Network Growth</h3>
        </div>
        <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as any)}>
          <TabsList className="bg-gray-800">
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
        </Tabs>
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
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              dataKey="newAgreements"
              name="New Agreements"
              fill="rgba(34, 211, 238, 0.6)"
              radius={[2, 2, 0, 0]}
              barSize={timeframe === "daily" ? 15 : 25}
            />
            <Line
              type="monotone"
              dataKey="totalAgreements"
              name="Total Agreements"
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
