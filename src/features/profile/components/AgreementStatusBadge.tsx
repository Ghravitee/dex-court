import {
  mapAgreementStatusToEscrow,
  getStatusConfig,
} from "../utils/statusMapping";

interface AgreementStatusBadgeProps {
  status: number;
}

export const AgreementStatusBadge = ({ status }: AgreementStatusBadgeProps) => {
  const displayStatus = mapAgreementStatusToEscrow(status);
  const config = getStatusConfig(displayStatus);

  return (
    <span
      className={`ml-auto inline-flex w-fit items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.color}`}
    >
      {config.label}
    </span>
  );
};
