interface RoleBadgeProps {
  role: boolean;
  icon: React.ReactNode;
  tooltip: string;
}

export const RoleBadge = ({ role, icon, tooltip }: RoleBadgeProps) => {
  if (!role) return null;

  return (
    <div className="flex items-center gap-1" title={tooltip}>
      {icon}
    </div>
  );
};
