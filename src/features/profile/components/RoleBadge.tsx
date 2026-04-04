import { Tooltip } from "./Tooltip";

interface RoleBadgeProps {
  role: boolean;
  icon: React.ReactNode;
  tooltip: string;
}

export const RoleBadge = ({ role, icon, tooltip }: RoleBadgeProps) => {
  if (!role) return null;

  return (
    <Tooltip content={tooltip}>
      <div className="flex cursor-pointer items-center gap-1">{icon}</div>
    </Tooltip>
  );
};
