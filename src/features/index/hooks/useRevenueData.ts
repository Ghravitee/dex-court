import { useState, useEffect } from "react";

export interface RevenueDataPoint {
  rawDate: string;
  amount: number; // real revenue amount per event
}

interface UseRevenueDataResult {
  data: RevenueDataPoint[];
  loading: boolean;
  error: string | null;
}

export const useRevenueData = (): UseRevenueDataResult => {
  const [data, setData] = useState<RevenueDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // TODO: replace with real API call
    // e.g. const res = await revenueService.getAll();
    //      setData(res.map(r => ({ rawDate: r.createdAt, amount: r.amount })));
    setData([]);
    setLoading(false);
    setError(null);
  }, []);

  return { data, loading, error };
};
