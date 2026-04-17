// features/agreements/hooks/useUserSearch.ts
import { useState, useEffect, useRef, useMemo } from "react";
import {
  cleanTelegramUsername,
  getCurrentUserTelegram,
} from "../../../lib/usernameUtils";
import { useAuth } from "../../../hooks/useAuth";
import { useAllAccounts } from "../../../hooks/useAccounts";
import { devLog } from "../../../utils/logger";

type SearchField = "counterparty" | "partyA" | "partyB";

function useDebounce(value: string, delay: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function useUserSearch() {
  const { user } = useAuth();

  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [activeSearchField, setActiveSearchField] =
    useState<SearchField>("counterparty");
  const [showUserSuggestions, setShowUserSuggestions] = useState(false);

  const userSearchRef = useRef<HTMLDivElement>(null);
  const debouncedSearchQuery = useDebounce(userSearchQuery, 300);

  const { data: accountsResponse, isLoading: isUserSearchLoading } =
    useAllAccounts({}, { enabled: debouncedSearchQuery.length >= 2 });

  const currentUserTelegram = getCurrentUserTelegram(user);

  const filteredResults = useMemo(() => {
    if (debouncedSearchQuery.length < 2) return [];

    const allAccounts = accountsResponse?.results ?? []; // moved inside
    const q = debouncedSearchQuery.toLowerCase();

    return allAccounts.filter((u) => {
      const telegram = cleanTelegramUsername(
        u.telegram?.username ?? u.telegramInfo ?? "",
      );
      if (
        telegram &&
        telegram.toLowerCase() === currentUserTelegram.toLowerCase()
      ) {
        return false;
      }

      return (
        u.username?.toLowerCase().includes(q) ||
        u.telegram?.username?.toLowerCase().includes(q) ||
        u.telegramInfo?.toLowerCase().includes(q) ||
        u.walletAddress?.toLowerCase().includes(q)
      );
    });
  }, [accountsResponse, debouncedSearchQuery, currentUserTelegram]);

  // Show/hide suggestions based on query length and results
  useEffect(() => {
    setShowUserSuggestions(debouncedSearchQuery.length >= 2);
  }, [debouncedSearchQuery]);

  // Click-outside handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        userSearchRef.current &&
        !userSearchRef.current.contains(e.target as Node)
      ) {
        setShowUserSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUserSearch = (query: string, field: SearchField) => {
    setUserSearchQuery(query);
    setActiveSearchField(field);
    if (query.length < 2) setShowUserSuggestions(false);
  };

  // Results are the same filtered list regardless of field —
  // the active field determines where the selected result gets applied
  const searchResults = filteredResults;

  // Kept for backwards compatibility with the parent component's field-specific destructuring
  const counterpartySearchResults =
    activeSearchField === "counterparty" ? searchResults : [];
  const partyASearchResults =
    activeSearchField === "partyA" ? searchResults : [];
  const partyBSearchResults =
    activeSearchField === "partyB" ? searchResults : [];

  const clearResults = (_field: SearchField) => {
    devLog(`Clearing search results for field: ${_field}`);
    setUserSearchQuery("");
    setShowUserSuggestions(false);
  };

  return {
    userSearchQuery,
    activeSearchField,
    setActiveSearchField,
    isUserSearchLoading,
    showUserSuggestions,
    setShowUserSuggestions,
    counterpartySearchResults,
    partyASearchResults,
    partyBSearchResults,
    userSearchRef,
    handleUserSearch,
    clearResults,
  };
}
