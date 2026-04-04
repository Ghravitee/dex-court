/* eslint-disable @typescript-eslint/no-explicit-any */
import { Search, Loader2 } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { UserSearchResult } from "../UserSearchResult";

interface WitnessSearchState {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  results: any[];
  isLoading: boolean;
  showSuggestions: boolean;
  setShowSuggestions: (v: boolean) => void;
  activeIndex: number;
  setActiveIndex: (i: number) => void;
  ref: React.RefObject<HTMLDivElement | null>;
}

interface Props {
  witnesses: string[];
  isDisabled: boolean;
  witnessSearch: WitnessSearchState;
  onAddWitness: () => void;
  onUpdateWitness: (i: number, v: string) => void;
  onRemoveWitness: (i: number) => void;
  onUserSelect: (
    username: string,
    field: "defendant" | "witness",
    index?: number,
  ) => void;
}

export const WitnessFields = ({
  witnesses,
  isDisabled,
  witnessSearch,
  onAddWitness,
  onUpdateWitness,
  onRemoveWitness,
  onUserSelect,
}: Props) => (
  <div ref={witnessSearch.ref}>
    <div className="mb-2 flex items-center justify-between">
      <label className="text-muted-foreground text-sm">
        Witness list (max 5)
        <span className="ml-2 text-xs text-cyan-400">
          (Start typing to search users)
        </span>
      </label>
      <Button
        type="button"
        variant="outline"
        className="border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/10"
        onClick={onAddWitness}
        disabled={witnesses.length >= 5 || isDisabled}
      >
        Add witness
      </Button>
    </div>

    <div className="space-y-2">
      {witnesses.map((w, i) => (
        <div key={i} className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-cyan-300" />
            <input
              value={w}
              onChange={(e) => {
                const value = e.target.value;
                onUpdateWitness(i, value);
                witnessSearch.setSearchQuery(value);
              }}
              onFocus={() => {
                witnessSearch.setActiveIndex(i);
                const searchValue = w.startsWith("@") ? w.substring(1) : w;
                if (searchValue.length >= 2)
                  witnessSearch.setShowSuggestions(true);
              }}
              className="w-full rounded-md border border-white/10 bg-white/5 py-2 pr-3 pl-9 text-white outline-none placeholder:text-white/50 focus:border-cyan-400/40"
              placeholder="Type username with or without @ (min 2 characters)..."
              disabled={isDisabled}
            />
            {witnessSearch.isLoading && witnessSearch.activeIndex === i && (
              <Loader2 className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-cyan-300" />
            )}
          </div>

          {witnesses.length > 1 && (
            <button
              type="button"
              onClick={() => onRemoveWitness(i)}
              className="text-muted-foreground rounded-md border border-white/10 bg-white/5 px-2 py-2 text-xs hover:text-white"
              disabled={isDisabled}
            >
              Remove
            </button>
          )}

          {/* Suggestions dropdown */}
          {witnessSearch.showSuggestions && witnessSearch.activeIndex === i && (
            <div className="absolute top-full z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-white/10 bg-cyan-900/95 shadow-lg backdrop-blur-md">
              {witnessSearch.results.length > 0 ? (
                witnessSearch.results.map((user) => (
                  <UserSearchResult
                    key={user.id}
                    user={user}
                    onSelect={onUserSelect}
                    field="witness"
                    index={i}
                  />
                ))
              ) : witnessSearch.searchQuery.length >= 2 &&
                !witnessSearch.isLoading ? (
                <div className="px-4 py-3 text-center text-sm text-cyan-300">
                  No users found for "{witnessSearch.searchQuery}"
                  <div className="mt-1 text-xs text-cyan-400">
                    Make sure the user exists and has a Telegram username
                  </div>
                </div>
              ) : null}

              {witnessSearch.searchQuery.length < 2 && (
                <div className="px-4 py-3 text-center text-sm text-cyan-300">
                  Type at least 2 characters to search
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);
