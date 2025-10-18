// components/UserLink.tsx
import { Link } from "react-router-dom";

interface UserLinkProps {
  handle: string;
  children?: React.ReactNode;
  className?: string;
}

export function UserLink({ handle, children, className = "" }: UserLinkProps) {
  // Remove @ symbol for the URL
  const cleanHandle = handle.startsWith("@") ? handle.slice(1) : handle;

  return (
    <Link
      to={`/profile/${cleanHandle}`}
      className={`text-cyan-300 hover:text-cyan-200 hover:underline ${className}`}
      onClick={(e) => e.stopPropagation()} // Prevent event bubbling
    >
      {children || handle}
    </Link>
  );
}
