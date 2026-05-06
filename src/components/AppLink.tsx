// src/components/AppLink.tsx
import { Link } from "react-router-dom";
import type { LinkProps } from "react-router-dom";
import { useRouteLoadingContext } from "../context/RouteLoadingContext";

export function AppLink({ onClick, ...props }: LinkProps) {
  const { startLoading } = useRouteLoadingContext();

  return (
    <Link
      {...props}
      onClick={(e) => {
        startLoading();
        onClick?.(e);
      }}
    />
  );
}
