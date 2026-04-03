import type { DisputeRow } from "../../../types";

interface Props {
  status: DisputeRow["status"];
}

export const DisputeStatusBadge = ({ status }: Props) => {
  switch (status) {
    case "Settled":
      return (
        <span className="badge-blue inline-flex items-center rounded-full border px-4 py-1 text-sm">
          Settled
        </span>
      );
    case "Pending":
      return (
        <span className="badge-yellow inline-flex items-center rounded-full border px-4 py-1 text-sm">
          Pending
        </span>
      );
    case "Dismissed":
      return (
        <span className="badge-red inline-flex items-center rounded-full border px-4 py-1 text-sm">
          Dismissed
        </span>
      );
    case "Pending Payment":
      return (
        <span className="badge-orange inline-flex items-center rounded-full px-4 py-1 text-sm">
          Pending Payment
        </span>
      );
    case "Pending Locking Funds":
      return (
        <span className="badge-orange inline-flex items-center rounded-full px-4 py-1 text-sm">
          Pending Locking Funds
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-1 text-sm text-emerald-300">
          Vote in Progress
        </span>
      );
  }
};
