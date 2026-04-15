// hooks/useRouteLoading.ts
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export const useRouteLoading = () => {
  const location = useLocation();
  const [isRouteLoading, setIsRouteLoading] = useState(true);

  useEffect(() => {
    setIsRouteLoading(true);

    // Let browser paint route once, then reveal.
    requestAnimationFrame(() => {
      setIsRouteLoading(false);
    });
  }, [location.pathname]);

  return isRouteLoading;
};
