import { getStatusConfig } from "../utils/statusMapping";

interface DisputeStatusBadgeProps {
  status: string;
}

export const DisputeStatusBadge = ({ status }: DisputeStatusBadgeProps) => {
  const config = getStatusConfig(status);

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.color}`}
    >
      {config.label}
    </span>
  );
};
