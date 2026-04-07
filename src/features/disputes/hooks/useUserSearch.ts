// features/disputes/hooks/useUserSearch.ts
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
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

  // Fetch all accounts once — cached for 10 minutes, shared across all
  // instances of this hook so only one network request is ever made.
  // Only enabled when the user has typed enough to show suggestions.
  const isSearching =
    debouncedDefendantQuery.length >= 1 || debouncedWitnessQuery.length >= 2;

  const { data: allAccounts = [], isLoading } = useAllAccounts({
    enabled: isSearching,
  });

  // Filter helper — excludes the current user from results
  const filterAccounts = useCallback(
    (query: string) => {
      if (!query) return [];
      const clean = query.startsWith("@") ? query.slice(1) : query;
      const q = clean.toLowerCase();

      return allAccounts.filter((u) => {
        // Exclude current user
        const telegram = cleanTelegramUsername(
          u.telegram?.username ?? u.telegramInfo ?? "",
        );
        if (
          telegram &&
          telegram.toLowerCase() === currentUserTelegram.toLowerCase()
        ) {
          return false;
        }

        // Match against username, telegram, telegramInfo, or wallet
        return (
          u.username?.toLowerCase().includes(q) ||
          u.telegram?.username?.toLowerCase().includes(q) ||
          u.telegramInfo?.toLowerCase().includes(q) ||
          u.walletAddress?.toLowerCase().includes(q)
        );
      });
    },
    [allAccounts, currentUserTelegram],
  );

  const defendantResults = useMemo(
    () =>
      debouncedDefendantQuery.length >= 1
        ? filterAccounts(debouncedDefendantQuery)
        : [],
    [debouncedDefendantQuery, filterAccounts],
  );

  const witnessResults = useMemo(
    () =>
      debouncedWitnessQuery.length >= 2
        ? filterAccounts(debouncedWitnessQuery)
        : [],
    [debouncedWitnessQuery, filterAccounts],
  );

  // Show/hide suggestions based on query length
  useEffect(() => {
    setShowDefendantSuggestions(debouncedDefendantQuery.length >= 1);
  }, [debouncedDefendantQuery]);

  useEffect(() => {
    setShowWitnessSuggestions(debouncedWitnessQuery.length >= 2);
  }, [debouncedWitnessQuery]);

  // Click-outside handler
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

  return {
    defendant: {
      searchQuery: defendantSearchQuery,
      setSearchQuery: setDefendantSearchQuery,
      results: defendantResults,
      isLoading: isLoading && debouncedDefendantQuery.length >= 1,
      showSuggestions: showDefendantSuggestions,
      setShowSuggestions: setShowDefendantSuggestions,
      ref: defendantSearchRef,
    },
    witness: {
      searchQuery: witnessSearchQuery,
      setSearchQuery: setWitnessSearchQuery,
      results: witnessResults,
      isLoading: isLoading && debouncedWitnessQuery.length >= 2,
      showSuggestions: showWitnessSuggestions,
      setShowSuggestions: setShowWitnessSuggestions,
      activeIndex: activeWitnessIndex,
      setActiveIndex: setActiveWitnessIndex,
      ref: witnessSearchRef,
    },
  };
}
