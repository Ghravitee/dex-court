/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback, useEffect, useRef } from "react";
import { disputeService } from "../../../services/disputeServices";
import {
  cleanTelegramUsername,
  getCurrentUserTelegram,
} from "../../../lib/usernameUtils";
import { useAuth } from "../../../hooks/useAuth";
import { useDebounce } from "./useDebounce";

export function useUserSearch() {
  const { user: currentUser } = useAuth();

  // Defendant search
  const [defendantSearchQuery, setDefendantSearchQuery] = useState("");
  const [defendantSearchResults, setDefendantSearchResults] = useState<any[]>(
    [],
  );
  const [isDefendantSearchLoading, setIsDefendantSearchLoading] =
    useState(false);
  const [showDefendantSuggestions, setShowDefendantSuggestions] =
    useState(false);

  // Witness search
  const [witnessSearchQuery, setWitnessSearchQuery] = useState("");
  const [witnessSearchResults, setWitnessSearchResults] = useState<any[]>([]);
  const [isWitnessSearchLoading, setIsWitnessSearchLoading] = useState(false);
  const [showWitnessSuggestions, setShowWitnessSuggestions] = useState(false);
  const [activeWitnessIndex, setActiveWitnessIndex] = useState(0);

  const defendantSearchRef = useRef<HTMLDivElement>(null);
  const witnessSearchRef = useRef<HTMLDivElement>(null);

  const debouncedDefendantQuery = useDebounce(defendantSearchQuery, 300);
  const debouncedWitnessQuery = useDebounce(witnessSearchQuery, 300);

  const filterOutCurrentUser = useCallback(
    (results: any[]) => {
      const currentUserTelegram = getCurrentUserTelegram(currentUser);
      return results.filter((u) => {
        const t = cleanTelegramUsername(
          u.telegramUsername || u.telegram?.username || u.telegramInfo,
        );
        return t && t.toLowerCase() !== currentUserTelegram.toLowerCase();
      });
    },
    [currentUser],
  );

  const handleDefendantSearch = useCallback(
    async (query: string) => {
      const clean = query.startsWith("@") ? query.substring(1) : query;
      if (clean.length < 1) {
        setDefendantSearchResults([]);
        setShowDefendantSuggestions(false);
        return;
      }
      setIsDefendantSearchLoading(true);
      setShowDefendantSuggestions(true);
      try {
        const results = await disputeService.searchUsers(clean);
        setDefendantSearchResults(filterOutCurrentUser(results));
      } catch {
        setDefendantSearchResults([]);
      } finally {
        setIsDefendantSearchLoading(false);
      }
    },
    [filterOutCurrentUser],
  );

  const handleWitnessSearch = useCallback(
    async (query: string) => {
      const clean = query.startsWith("@") ? query.substring(1) : query;
      if (clean.length < 2) {
        setWitnessSearchResults([]);
        setShowWitnessSuggestions(false);
        return;
      }
      setIsWitnessSearchLoading(true);
      setShowWitnessSuggestions(true);
      try {
        const results = await disputeService.searchUsers(clean);
        setWitnessSearchResults(filterOutCurrentUser(results));
      } catch {
        setWitnessSearchResults([]);
      } finally {
        setIsWitnessSearchLoading(false);
      }
    },
    [filterOutCurrentUser],
  );

  useEffect(() => {
    if (debouncedDefendantQuery.length >= 1) {
      handleDefendantSearch(debouncedDefendantQuery);
    } else {
      setDefendantSearchResults([]);
      setShowDefendantSuggestions(false);
    }
  }, [debouncedDefendantQuery, handleDefendantSearch]);

  useEffect(() => {
    if (debouncedWitnessQuery.length >= 2) {
      handleWitnessSearch(debouncedWitnessQuery);
    } else {
      setWitnessSearchResults([]);
      setShowWitnessSuggestions(false);
    }
  }, [debouncedWitnessQuery, handleWitnessSearch]);

  // Click-outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        defendantSearchRef.current &&
        !defendantSearchRef.current.contains(event.target as Node)
      ) {
        setShowDefendantSuggestions(false);
      }
      if (
        witnessSearchRef.current &&
        !witnessSearchRef.current.contains(event.target as Node)
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
      results: defendantSearchResults,
      isLoading: isDefendantSearchLoading,
      showSuggestions: showDefendantSuggestions,
      setShowSuggestions: setShowDefendantSuggestions,
      ref: defendantSearchRef,
    },
    witness: {
      searchQuery: witnessSearchQuery,
      setSearchQuery: setWitnessSearchQuery,
      results: witnessSearchResults,
      isLoading: isWitnessSearchLoading,
      showSuggestions: showWitnessSuggestions,
      setShowSuggestions: setShowWitnessSuggestions,
      activeIndex: activeWitnessIndex,
      setActiveIndex: setActiveWitnessIndex,
      ref: witnessSearchRef,
    },
  };
}
