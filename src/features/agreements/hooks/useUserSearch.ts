/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback, useEffect, useRef } from "react";
import { agreementService } from "../../../services/agreementServices";
import {
  cleanTelegramUsername,
  getCurrentUserTelegram,
} from "../../../lib/usernameUtils";
import { useAuth } from "../../../hooks/useAuth";

type SearchField = "counterparty" | "partyA" | "partyB";

// Simple debounce hook
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
  const [isUserSearchLoading, setIsUserSearchLoading] = useState(false);
  const [showUserSuggestions, setShowUserSuggestions] = useState(false);

  const [counterpartySearchResults, setCounterpartySearchResults] = useState<
    any[]
  >([]);
  const [partyASearchResults, setPartyASearchResults] = useState<any[]>([]);
  const [partyBSearchResults, setPartyBSearchResults] = useState<any[]>([]);

  const userSearchRef = useRef<HTMLDivElement>(null);

  const debouncedSearchQuery = useDebounce(userSearchQuery, 300);

  const handleUserSearch = useCallback(
    async (query: string, field: SearchField) => {
      setUserSearchQuery(query);
      setActiveSearchField(field);

      if (query.length < 2) {
        if (field === "counterparty") setCounterpartySearchResults([]);
        if (field === "partyA") setPartyASearchResults([]);
        if (field === "partyB") setPartyBSearchResults([]);
        setShowUserSuggestions(false);
        return;
      }

      setIsUserSearchLoading(true);
      setShowUserSuggestions(true);

      try {
        const results = await agreementService.searchUsers(query);
        const currentUserTelegram = getCurrentUserTelegram(user);

        const filtered = results.filter((u) => {
          const t = cleanTelegramUsername(
            u.telegramUsername || u.telegram?.username || u.telegramInfo,
          );
          return t && t.toLowerCase() !== currentUserTelegram.toLowerCase();
        });

        if (field === "counterparty") setCounterpartySearchResults(filtered);
        else if (field === "partyA") setPartyASearchResults(filtered);
        else if (field === "partyB") setPartyBSearchResults(filtered);
      } catch {
        if (field === "counterparty") setCounterpartySearchResults([]);
        else if (field === "partyA") setPartyASearchResults([]);
        else if (field === "partyB") setPartyBSearchResults([]);
      } finally {
        setIsUserSearchLoading(false);
      }
    },
    [user],
  );

  // Debounced trigger
  useEffect(() => {
    if (debouncedSearchQuery.length >= 2 && activeSearchField) {
      handleUserSearch(debouncedSearchQuery, activeSearchField);
    }
  }, [debouncedSearchQuery, activeSearchField, handleUserSearch]);

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

  const clearResults = (field: SearchField) => {
    if (field === "counterparty") setCounterpartySearchResults([]);
    else if (field === "partyA") setPartyASearchResults([]);
    else if (field === "partyB") setPartyBSearchResults([]);
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
