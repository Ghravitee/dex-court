// src/features/index/hooks/useRevenueData.ts
import { useEffect, useState } from "react";
import { api } from "../../../lib/apiClient";

type RevenueApiPoint = {
  timestamp: string;
  platformRevenue: string;
};

export type RevenueDataPoint = {
  rawDate: string;
  amount: number;
};

const DECIMALS = 18;

export function useRevenueData() {
  const [data, setData] = useState<RevenueDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const response = await api.get<RevenueApiPoint[]>("/agreement/stats/revenue");
        const json = response.data;

        const transformed: RevenueDataPoint[] = json.map((p, i) => {
          const prev = i === 0 ? 0n : BigInt(json[i - 1].platformRevenue);
          const current = BigInt(p.platformRevenue);
          const delta = current > prev ? current - prev : 0n;
          const eth = Number(delta) / 10 ** DECIMALS;

          return {
            rawDate: p.timestamp,
            amount: eth,
          };
        });

        setData(transformed);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load revenue");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return { data, loading, error };
}