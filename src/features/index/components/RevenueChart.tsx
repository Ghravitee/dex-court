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
} from "recharts";
import { Tabs, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { genRevenue } from "../utils/revenueGenerator";

export const RevenueChart = () => {
  const daily = useMemo(() => genRevenue("daily"), []);
  const weekly = useMemo(() => genRevenue("weekly"), []);
  const monthly = useMemo(() => genRevenue("monthly"), []);

  const [tab, setTab] = useState("daily");
  const data = tab === "daily" ? daily : tab === "weekly" ? weekly : monthly;

  return (
    <section className="card-cyan relative rounded-2xl border border-cyan-400/60 p-5">
      <div className="mb-4 flex flex-col justify-between sm:flex-row sm:items-center">
        <div>
          <h3 className="text-xl font-bold text-white">Platform Revenue</h3>
        </div>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-white/5">
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="h-72 min-h-[200px] w-full">
        <ResponsiveContainer
          width="100%"
          height="100%"
          minHeight={200}
          minWidth={0}
        >
          <ComposedChart
            data={data}
            margin={{ left: 0, right: 10, top: 10, bottom: 0 }}
          >
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="t"
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
            />
            <Tooltip
              contentStyle={{
                background: "rgba(15,23,42,.9)",
                border: "1px solid rgba(255,255,255,.1)",
                borderRadius: 8,
                color: "#e2e8f0",
              }}
              formatter={(value) => [`$${value}`, "Revenue"]}
            />
            <Bar dataKey="revenue" fill="#22d3ee30" radius={[8, 8, 0, 0]} />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#22d3ee"
              strokeWidth={1}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};
