import type { AgreementStatus } from "../../../types";

interface Props {
  status: AgreementStatus;
}

export const AgreementStatusBadge = ({ status }: Props) => {
  switch (status) {
    case "pending":
      return <span className="badge badge-yellow">Pending</span>;
    case "signed":
      return <span className="badge badge-blue">Signed</span>;
    case "cancelled":
      return <span className="badge badge-red">Cancelled</span>;
    case "expired":
      return <span className="badge badge-gray">Expired</span>;
    case "completed":
      return <span className="badge badge-green">Completed</span>;
    case "pending_approval":
      return <span className="badge badge-orange">Pending Approval</span>;
    default:
      return <span className="badge badge-purple">Disputed</span>;
  }
};
