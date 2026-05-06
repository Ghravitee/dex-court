// src/context/RouteLoadingContext.tsx
import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";

interface RouteLoadingContextType {
  isLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
}

const RouteLoadingContext = createContext<RouteLoadingContextType>({
  isLoading: false,
  startLoading: () => {},
  stopLoading: () => {},
});

export function RouteLoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const startLoading = useCallback(() => setIsLoading(true), []);
  const stopLoading = useCallback(() => setIsLoading(false), []);

  return (
    <RouteLoadingContext.Provider
      value={{ isLoading, startLoading, stopLoading }}
    >
      {children}
    </RouteLoadingContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useRouteLoadingContext = () => useContext(RouteLoadingContext);
