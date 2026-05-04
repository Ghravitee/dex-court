import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export const useRouteLoading = () => {
  const location = useLocation();
  const [isRouteLoading, setIsRouteLoading] = useState(false);

  useEffect(() => {
    setIsRouteLoading(true);

    const timer = setTimeout(() => setIsRouteLoading(false), 400);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return isRouteLoading;
};
