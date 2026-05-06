// src/hooks/useRouteLoading.ts
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useRouteLoadingContext } from "../context/RouteLoadingContext";

export const useRouteLoading = () => {
  const { isLoading, stopLoading } = useRouteLoadingContext();
  const location = useLocation();

  useEffect(() => {
    stopLoading();
  }, [location.pathname, stopLoading]);

  return isLoading;
};
