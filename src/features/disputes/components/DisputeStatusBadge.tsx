import type { DisputeRow } from "../../../types";

interface Props {
  status: DisputeRow["status"];
}

export const DisputeStatusBadge = ({ status }: Props) => {
  switch (status) {
    case "Settled":
      return <span className="badge badge-blue">Settled</span>;
    case "Pending":
      return <span className="badge badge-yellow">Pending</span>;
    case "Dismissed":
      return <span className="badge badge-red">Dismissed</span>;
    case "Pending Payment":
      return <span className="badge badge-orange">Pending Payment</span>;
    case "Pending Locking Funds":
      return <span className="badge badge-orange">Pending Locking Funds</span>;
    default:
      return (
        <span className="badge border-emerald-400/30 bg-emerald-500/10 text-emerald-300">
          Vote in Progress
        </span>
      );
  }
};
