import { VscVerifiedFilled } from "react-icons/vsc";
import { Tooltip } from "./Tooltip";

export const VerificationBadge = () => (
  <Tooltip content="Verified User">
    <VscVerifiedFilled className="h-4 w-4 text-emerald-400" />
  </Tooltip>
);
