// features/disputes/hooks/useUserSearch.ts
import { useState, useEffect, useRef, useMemo } from "react";
import {
  cleanTelegramUsername,
  getCurrentUserTelegram,
} from "../../../lib/usernameUtils";
import { useAuth } from "../../../hooks/useAuth";
import { useDebounce } from "./useDebounce";
import { useAllAccounts } from "../../../hooks/useAccounts";

export function useUserSearch() {
  const { user: currentUser } = useAuth();

  // Defendant search
  const [defendantSearchQuery, setDefendantSearchQuery] = useState("");
  const [showDefendantSuggestions, setShowDefendantSuggestions] =
    useState(false);

  // Witness search
  const [witnessSearchQuery, setWitnessSearchQuery] = useState("");
  const [showWitnessSuggestions, setShowWitnessSuggestions] = useState(false);
  const [activeWitnessIndex, setActiveWitnessIndex] = useState(0);

  const defendantSearchRef = useRef<HTMLDivElement>(null);
  const witnessSearchRef = useRef<HTMLDivElement>(null);

  const debouncedDefendantQuery = useDebounce(defendantSearchQuery, 300);
  const debouncedWitnessQuery = useDebounce(witnessSearchQuery, 300);

  const currentUserTelegram = getCurrentUserTelegram(currentUser);

  // ✅ Two separate backend queries — each only fires when its field is active
  const { data: defendantResponse, isLoading: isDefendantLoading } =
    useAllAccounts(
      { search: debouncedDefendantQuery, top: 20 },
      { enabled: debouncedDefendantQuery.length >= 1 },
    );

  const { data: witnessResponse, isLoading: isWitnessLoading } = useAllAccounts(
    { search: debouncedWitnessQuery, top: 20 },
    { enabled: debouncedWitnessQuery.length >= 2 },
  );

  // ✅ useMemo now only excludes the current user — no text matching needed
  const defendantResults = useMemo(() => {
    if (debouncedDefendantQuery.length < 1) return [];

    return (defendantResponse?.results ?? []).filter((u) => {
      const telegram = cleanTelegramUsername(
        u.telegram?.username ?? u.telegramInfo ?? "",
      );
      return !(
        telegram && telegram.toLowerCase() === currentUserTelegram.toLowerCase()
      );
    });
  }, [defendantResponse, debouncedDefendantQuery, currentUserTelegram]);

  const witnessResults = useMemo(() => {
    if (debouncedWitnessQuery.length < 2) return [];

    return (witnessResponse?.results ?? []).filter((u) => {
      const telegram = cleanTelegramUsername(
        u.telegram?.username ?? u.telegramInfo ?? "",
      );
      return !(
        telegram && telegram.toLowerCase() === currentUserTelegram.toLowerCase()
      );
    });
  }, [witnessResponse, debouncedWitnessQuery, currentUserTelegram]);

  // Show/hide suggestions based on query length
  useEffect(() => {
    setShowDefendantSuggestions(debouncedDefendantQuery.length >= 1);
  }, [debouncedDefendantQuery]);

  useEffect(() => {
    setShowWitnessSuggestions(debouncedWitnessQuery.length >= 2);
  }, [debouncedWitnessQuery]);

  // Click-outside handler — unchanged
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        defendantSearchRef.current &&
        !defendantSearchRef.current.contains(e.target as Node)
      ) {
        setShowDefendantSuggestions(false);
      }
      if (
        witnessSearchRef.current &&
        !witnessSearchRef.current.contains(e.target as Node)
      ) {
        setShowWitnessSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Return shape unchanged — components don't need to know anything changed
  return {
    defendant: {
      searchQuery: defendantSearchQuery,
      setSearchQuery: setDefendantSearchQuery,
      results: defendantResults,
      isLoading: isDefendantLoading,
      showSuggestions: showDefendantSuggestions,
      setShowSuggestions: setShowDefendantSuggestions,
      ref: defendantSearchRef,
    },
    witness: {
      searchQuery: witnessSearchQuery,
      setSearchQuery: setWitnessSearchQuery,
      results: witnessResults,
      isLoading: isWitnessLoading,
      showSuggestions: showWitnessSuggestions,
      setShowSuggestions: setShowWitnessSuggestions,
      activeIndex: activeWitnessIndex,
      setActiveIndex: setActiveWitnessIndex,
      ref: witnessSearchRef,
    },
  };
}
