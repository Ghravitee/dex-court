/* eslint-disable @typescript-eslint/no-explicit-any */
import { Search, Loader2 } from "lucide-react";
import { UserAvatar } from "../../../../components/UserAvatar";
import { UserSearchResult } from "../UserSearchResult";
import { cleanTelegramUsername } from "../../../../lib/usernameUtils";
import type {
  AgreementType,
  AgreementFormState,
  FormValidation,
} from "../../types/form";

interface UserSearchState {
  userSearchQuery: string;
  activeSearchField: "counterparty" | "partyA" | "partyB";
  setActiveSearchField: (f: "counterparty" | "partyA" | "partyB") => void;
  isUserSearchLoading: boolean;
  showUserSuggestions: boolean;
  setShowUserSuggestions: (v: boolean) => void;
  counterpartySearchResults: any[];
  partyASearchResults: any[];
  partyBSearchResults: any[];
  userSearchRef: React.RefObject<HTMLDivElement | null>;
  handleUserSearch: (
    q: string,
    field: "counterparty" | "partyA" | "partyB",
  ) => void;
  clearResults: (field: "counterparty" | "partyA" | "partyB") => void;
}

interface Props {
  agreementType: AgreementType;
  form: AgreementFormState;
  setForm: React.Dispatch<React.SetStateAction<AgreementFormState>>;
  validation: FormValidation;
  updateValidation: (field: keyof FormValidation, value: string) => void;
  userSearch: UserSearchState;
}

export const PartiesFields = ({
  agreementType,
  form,
  setForm,
  validation,
  updateValidation,
  userSearch,
}: Props) => {
  const {
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
  } = userSearch;

  const handleInput = (
    value: string,
    field: "counterparty" | "partyA" | "partyB",
  ) => {
    const cleaned = value.trim();
    setForm((prev) => ({ ...prev, [field]: cleaned }));
    const searchValue = cleaned.replace(/^@/, "");
    if (searchValue.length >= 2) handleUserSearch(searchValue, field);
    else setShowUserSuggestions(false);
    updateValidation(field, cleaned);
  };

  if (agreementType === "myself") {
    return (
      <div className="relative" ref={userSearchRef}>
        <label className="text-muted-foreground mb-2 block text-sm">
          Counterparty <span className="text-red-500">*</span>
          <span className="ml-2 text-xs text-cyan-400">
            (Start typing to search users)
          </span>
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute top-[20px] left-3 h-4 w-4 -translate-y-1/2 text-cyan-300" />
          <input
            value={form.counterparty}
            onChange={(e) => handleInput(e.target.value, "counterparty")}
            onBlur={() => updateValidation("counterparty", form.counterparty)}
            onFocus={() => {
              if (form.counterparty.length >= 2) setShowUserSuggestions(true);
            }}
            className="w-full rounded-md border border-white/10 bg-white/5 py-2 pr-3 pl-9 text-white outline-none placeholder:text-white/50 focus:border-cyan-400/40"
            placeholder="Type username (min 2 characters)..."
            required
          />
          {validation.counterparty.isTouched && (
            <div
              className={`mt-1 text-xs ${validation.counterparty.isValid ? "text-green-400" : "text-amber-400"}`}
            >
              {validation.counterparty.message}
            </div>
          )}
          {isUserSearchLoading && (
            <Loader2 className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-cyan-300" />
          )}
        </div>

        {showUserSuggestions && activeSearchField === "counterparty" && (
          <div className="absolute top-full z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-white/10 bg-cyan-900/95 shadow-lg backdrop-blur-md">
            {counterpartySearchResults.length > 0 ? (
              counterpartySearchResults.map((u) => (
                <UserSearchResult
                  key={`counterparty-${u.id}`}
                  user={u}
                  onSelect={(username) => {
                    setForm((prev) => ({ ...prev, counterparty: username }));
                    setShowUserSuggestions(false);
                    clearResults("counterparty");
                  }}
                  field="counterparty"
                />
              ))
            ) : userSearchQuery.length >= 2 && !isUserSearchLoading ? (
              <div className="px-4 py-3 text-center text-sm text-cyan-300">
                No users found for "{userSearchQuery}"
                <div className="mt-1 text-xs text-cyan-400">
                  Make sure the user exists and has a Telegram username
                </div>
              </div>
            ) : null}
            {userSearchQuery.length < 2 && (
              <div className="px-4 py-3 text-center text-sm text-cyan-300">
                Type at least 2 characters to search
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // "others" mode — partyA + partyB
  return (
    <>
      {/* Party A */}
      <div className="relative" ref={userSearchRef}>
        <label className="text-muted-foreground mb-2 block text-sm">
          First Party <span className="text-red-500">*</span>
          <span className="ml-2 text-xs text-cyan-400">
            (Start typing to search users)
          </span>
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-cyan-300" />
          <input
            value={form.partyA}
            onChange={(e) => handleInput(e.target.value, "partyA")}
            onBlur={() => updateValidation("partyA", form.partyA)}
            onFocus={() => {
              setActiveSearchField("partyA");
              if (
                partyASearchResults.length > 0 ||
                form.partyA.replace(/^@/, "").length >= 2
              ) {
                setShowUserSuggestions(true);
              }
            }}
            className="w-full rounded-md border border-white/10 bg-white/5 py-2 pr-3 pl-9 text-white outline-none placeholder:text-white/50 focus:border-cyan-400/40"
            placeholder="Type username (min 2 characters)..."
            required
          />
          {isUserSearchLoading && activeSearchField === "partyA" && (
            <Loader2 className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-cyan-300" />
          )}
        </div>
        {validation.partyA.isTouched && (
          <div
            className={`mt-1 text-xs ${validation.partyA.isValid ? "text-green-400" : "text-amber-400"}`}
          >
            {validation.partyA.message}
          </div>
        )}
        {/* Inline results for partyA */}
        <div className="mt-2">
          {partyASearchResults.map((u) => {
            const telegramUsername = cleanTelegramUsername(
              u.telegramUsername || u.telegram?.username || u.telegramInfo,
            );
            return (
              <div
                key={`partyA-${u.id}`}
                onClick={() => {
                  setForm((prev) => ({
                    ...prev,
                    partyA: `@${telegramUsername}`,
                  }));
                  clearResults("partyA");
                  setShowUserSuggestions(false);
                }}
                className="glass card-cyan flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:opacity-60"
              >
                <UserAvatar
                  userId={u.id}
                  avatarId={u.avatarId || u.avatar?.id}
                  username={telegramUsername}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  {telegramUsername && (
                    <div className="truncate text-sm text-cyan-300">
                      @{telegramUsername}
                    </div>
                  )}
                  {u.bio && (
                    <div className="mt-1 truncate text-xs text-cyan-200/70">
                      {u.bio}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Party B */}
      <div className="relative" ref={userSearchRef}>
        <label className="text-muted-foreground mb-2 block text-sm">
          Second Party <span className="text-red-500">*</span>
          <span className="ml-2 text-xs text-cyan-400">
            (Start typing to search users)
          </span>
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-cyan-300" />
          <input
            value={form.partyB}
            onChange={(e) => handleInput(e.target.value, "partyB")}
            onBlur={() => updateValidation("partyB", form.partyB)}
            onFocus={() => {
              if (form.partyB.length >= 2) setShowUserSuggestions(true);
            }}
            className="w-full rounded-md border border-white/10 bg-white/5 py-2 pr-3 pl-9 text-white outline-none placeholder:text-white/50 focus:border-cyan-400/40"
            placeholder="Type username (min 2 characters)..."
            required
          />
          {isUserSearchLoading && activeSearchField === "partyB" && (
            <Loader2 className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-cyan-300" />
          )}
        </div>
        {validation.partyB.isTouched && (
          <div
            className={`mt-1 text-xs ${validation.partyB.isValid ? "text-green-400" : "text-amber-400"}`}
          >
            {validation.partyB.message}
          </div>
        )}
        {showUserSuggestions && activeSearchField === "partyB" && (
          <div className="absolute top-full z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-white/10 bg-cyan-900/95 shadow-lg backdrop-blur-md">
            {partyBSearchResults.length > 0 ? (
              partyBSearchResults.map((u) => (
                <UserSearchResult
                  key={`partyB-${u.id}`}
                  user={u}
                  onSelect={(username) => {
                    setForm((prev) => ({ ...prev, partyB: username }));
                    setShowUserSuggestions(false);
                    clearResults("partyB");
                  }}
                  field="partyB"
                />
              ))
            ) : userSearchQuery.length >= 2 && !isUserSearchLoading ? (
              <div className="px-4 py-3 text-center text-sm text-cyan-300">
                No users found for "{userSearchQuery}"
              </div>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
};
