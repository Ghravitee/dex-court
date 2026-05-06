// src/hooks/useNavigation.ts
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useRouteLoadingContext } from "../context/RouteLoadingContext";

export function useNavigation() {
  const navigate = useNavigate();
  const { startLoading } = useRouteLoadingContext();

  const navigateTo = useCallback(
    (path: string) => {
      startLoading();
      navigate(path);
    },
    [navigate, startLoading],
  );

  return { navigateTo };
}
