/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";

import { Button } from "../components/ui/button";

import { Calendar, ChevronDown, Info } from "lucide-react";
import "react-datepicker/dist/react-datepicker.css";
import ReactDatePicker from "react-datepicker";

type Agreement = {
  id: number;
  title: string;
  user: string;
  status: "active" | "completed" | "disputed";
};

export default function AgreementForm() {
  const [typeValue, setTypeValue] = useState<"Public" | "Private" | "">("");
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [includeFunds, setIncludeFunds] = useState<"yes" | "no" | "">("");
  const [secureWithEscrow, setSecureWithEscrow] = useState<"yes" | "no" | "">(
    ""
  );
  const [customTokenAddress, setCustomTokenAddress] = useState("");

  const [deadline, setDeadline] = useState<Date | null>(null);

  const [isTokenOpen, setIsTokenOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<string>("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const typeRef = useRef<HTMLDivElement>(null);
  const tokenRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (typeRef.current && !typeRef.current.contains(event.target as Node)) {
        setIsTypeOpen(false);
      }

      if (
        tokenRef.current &&
        !tokenRef.current.contains(event.target as Node)
      ) {
        setIsTokenOpen(false);
      }

      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        setIsFilterOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filterOptions = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "completed", label: "Completed" },
    { value: "disputed", label: "Disputed" },
  ];

  const [filter, setFilter] = useState<
    "all" | "active" | "completed" | "disputed"
  >("all");

  // Example agreements data (you can replace this with fetched data)
  const agreements: Agreement[] = [
    { id: 1, title: "Dev Retainer Q1", user: "@0xNova", status: "completed" },
    { id: 2, title: "Brand Design", user: "@0xAstra", status: "active" },
    { id: 3, title: "Website Redesign", user: "@0xEcho", status: "disputed" },
  ];

  // Apply filtering
  const filteredAgreements =
    filter === "all"
      ? agreements
      : agreements.filter((a) => a.status === filter);

  const typeOptions = [
    { value: "Public", label: "Public" },
    { value: "Private", label: "Private" },
  ];

  const tokenOptions = [
    { value: "USDC", label: "USDC" },
    { value: "DAI", label: "DAI" },
    { value: "ETH", label: "ETH" },
    { value: "custom", label: "Custom Token" }, // 👈 new option
  ];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 relative">
      <div className="lg:size-[30rem] rounded-full bg-cyan-500/20 absolute top-32 right-10 blur-3xl block"></div>
      <div className="lg:size-[15rem] rounded-full bg-cyan-500/20 absolute -top-20 left-0 blur-3xl block"></div>
      <div className="absolute inset-0 bg-cyan-500/10 blur-3xl -z-[50]"></div>
      <div className="lg:col-span-3 space-y-4">
        <h1 className="text-white text-xl space mb-2">Agreements</h1>
        <div className="glass p-6 border border-white/10 bg-gradient-to-br from-cyan-500/10 space-y-5">
          {/* Title */}
          <div>
            <label className="mb-2 block font-semibold text-white space">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full rounded-md border bg-white/5 px-3 py-2 outline-none focus:ring-1 ring-cyan-400 "
              placeholder="e.g. Design Sprint Phase 1"
            />
          </div>
          {/* Type + Counterparty */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Type */}
            <div className="flex flex-col gap-2 relative w-full" ref={typeRef}>
              <label className="text-sm font-semibold text-white space">
                Type <span className="text-red-500">*</span>
              </label>
              <div
                onClick={() => setIsTypeOpen((prev) => !prev)}
                className="bg-white/5 text-white px-3 py-2 rounded-md cursor-pointer flex justify-between items-center border border-white/10 focus:ring-1 ring-cyan-400"
              >
                <span>{typeValue || "Select Type"}</span>
                <ChevronDown
                  className={`transition-transform ${
                    isTypeOpen ? "rotate-180" : ""
                  }`}
                />
              </div>
              {isTypeOpen && (
                <div className="absolute top-[110%] z-50 w-full bg-cyan-800 rounded-xl shadow-md">
                  {typeOptions.map((option) => (
                    <div
                      key={option.value}
                      onClick={() => {
                        setTypeValue(option.value as "Public" | "Private");
                        setIsTypeOpen(false);
                      }}
                      className="px-4 py-2 cursor-pointer hover:bg-cyan-300 hover:text-white transition-colors"
                    >
                      {option.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Counterparty */}
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">
                Counterparty <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 outline-none focus:ring-1 ring-cyan-400"
                placeholder="@0xHandle or address"
              />
            </div>
          </div>
          {/* Description + Helper */}
          <div>
            <label className="mb-2 block text-sm text-muted-foreground">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              className="min-h-28 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 outline-none focus:ring-1 ring-cyan-400"
              placeholder="Scope, deliverables, timelines..."
            />
            <div className="flex items-center gap-1 mt-1">
              <Info className="size-4 text-cyan-300" />
              <p className="text-xs text-cyan-300/80">
                If you’d like to add videos, simply add the link to the video
                URL in the description (e.g. a public Google Drive link).
              </p>
            </div>
          </div>
          {/* Image Upload */}
          <div>
            <label className="mb-2 block text-sm text-muted-foreground">
              Upload Images <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              className="block w-full text-sm text-white file:mr-4 file:rounded-md file:border-0 file:bg-cyan-600 file:px-4 file:py-2 file:text-sm file:font-semibold hover:file:bg-cyan-700 cursor-pointer"
            />
          </div>
          {/* Deadline */}

          <div>
            <label className="mb-2 block text-sm text-muted-foreground">
              Deadline <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              {/* 📅 Calendar Icon */}
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-300 pointer-events-none" />

              <ReactDatePicker
                selected={deadline}
                onChange={(date) => setDeadline(date)}
                placeholderText="Select a date"
                dateFormat="dd/MM/yyyy"
                className="w-full rounded-md border border-white/10 bg-white/5 pl-10 pr-3 py-2 text-white placeholder:text-white/50 outline-none focus:border-cyan-400/40 cursor-pointer"
                calendarClassName="!bg-cyan-700 !text-white rounded-lg border border-white/10"
                popperClassName="z-50"
                minDate={new Date()}
              />
            </div>
          </div>

          {/* Include Funds Toggle */}
          <div>
            <label className="mb-2 block text-sm text-muted-foreground">
              Does this Agreement Include Funds{" "}
              <span className="text-cyan-400">(Optional)</span>
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setIncludeFunds("yes")}
                className={`px-4 py-2 rounded-md border ${
                  includeFunds === "yes"
                    ? "border-cyan-400 bg-cyan-500/30"
                    : "border-white/10"
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setIncludeFunds("no")}
                className={`px-4 py-2 rounded-md border ${
                  includeFunds === "no"
                    ? "border-cyan-400 bg-cyan-500/30"
                    : "border-white/10"
                }`}
              >
                No
              </button>
            </div>
          </div>

          {/* Escrow Panel */}
          {includeFunds === "yes" && (
            <div className="border border-white/10 bg-white/5 p-4 rounded-lg space-y-3 transition-all">
              <p className="text-sm text-white/90">
                Would you like to secure the funds in an escrow contract?{" "}
                <span className="text-cyan-400">(Optional)</span>
              </p>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setSecureWithEscrow("yes")}
                  className={`px-4 py-2 rounded-md border ${
                    secureWithEscrow === "yes"
                      ? "border-cyan-400 bg-cyan-500/30"
                      : "border-white/10"
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setSecureWithEscrow("no")}
                  className={`px-4 py-2 rounded-md border ${
                    secureWithEscrow === "no"
                      ? "border-cyan-400 bg-cyan-500/30"
                      : "border-white/10"
                  }`}
                >
                  No
                </button>
              </div>
              {secureWithEscrow === "yes" && (
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                  {/* Token Dropdown */}
                  <div
                    className="flex flex-col gap-2 relative w-full"
                    ref={tokenRef}
                  >
                    <label className="text-sm font-semibold text-white">
                      Token <span className="text-red-500">*</span>
                    </label>
                    <div
                      onClick={() => setIsTokenOpen((prev) => !prev)}
                      className="bg-white/5 text-white px-3 py-2 rounded-md cursor-pointer flex justify-between items-center border border-white/10"
                    >
                      <span>{selectedToken || "Select Token"}</span>
                      <ChevronDown
                        className={`transition-transform ${
                          isTokenOpen ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                    {isTokenOpen && (
                      <div className="absolute top-[110%] z-50 w-full bg-cyan-800 rounded-xl shadow-md">
                        {tokenOptions.map((option) => (
                          <div
                            key={option.value}
                            onClick={() => {
                              setSelectedToken(option.value);
                              setIsTokenOpen(false);
                              if (option.value !== "custom") {
                                setCustomTokenAddress("");
                              }
                            }}
                            className="px-4 py-2 cursor-pointer hover:bg-cyan-300 hover:text-white transition-colors"
                          >
                            {option.label}
                          </div>
                        ))}
                      </div>
                    )}
                    {selectedToken === "custom" && (
                      <div className="mt-3">
                        <label className="mb-2 block text-sm text-muted-foreground">
                          Paste Contract Address{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={customTokenAddress}
                          onChange={(e) =>
                            setCustomTokenAddress(e.target.value)
                          }
                          placeholder="0x..."
                          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 outline-none focus:ring-1 ring-cyan-400"
                        />
                      </div>
                    )}
                  </div>
                  {/* Amount */}
                  <div>
                    <label className="mb-2 block text-sm text-muted-foreground">
                      Amount <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-cyan-400/40"
                      placeholder="1000"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          {/* Buttons */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/10"
            >
              Save Draft
            </Button>
            <Button variant="neon" className="neon-hover">
              Submit & Sign
            </Button>
          </div>
        </div>
      </div>
      <aside className="space-y-4 col-span-2">
        <h1 className="text-white text-xl space mb-2">Recent Agreements</h1>
        <div className="glass p-5 border border-white/10 bg-gradient-to-br from-cyan-500/10">
          {/* Filter Header */}
          {/* Filter Header */}
          <div className="mb-3 flex items-center justify-between">
            {/* Filter Dropdown */}
            <div className="relative w-36 group" ref={filterRef}>
              {/* Trigger */}
              <div
                onClick={() => setIsFilterOpen((prev) => !prev)}
                className="dark:bg-[#d5f2f80a] bg-white dark:text-white text-black px-3 py-1 rounded-md cursor-pointer flex justify-between items-center transition-all"
              >
                <span className="text-sm capitalize">
                  {filterOptions.find((f) => f.value === filter)?.label ||
                    "Filter"}
                </span>
                <div className="w-8 h-8 rounded-md bg-Primary flex items-center justify-center">
                  <ChevronDown
                    className={`text-white text-2xl transform transition-transform duration-300 ${
                      isFilterOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </div>
              {/* Dropdown */}
              {isFilterOpen && (
                <div className="absolute top-[110%] right-0 z-50 w-full bg-cyan-800 rounded-xl shadow-md">
                  {filterOptions.map((option, idx) => (
                    <div
                      key={option.value}
                      onClick={() => {
                        setFilter(option.value as any);
                        setIsFilterOpen(false);
                      }}
                      className={`px-4 py-1 cursor-pointer hover:bg-cyan-300 hover:text-white transition-colors ${
                        idx === 0 ? "rounded-t-xl" : ""
                      } ${
                        idx === filterOptions.length - 1 ? "rounded-b-xl" : ""
                      }`}
                    >
                      {option.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Filtered List */}
          <ul className="space-y-3 text-sm">
            {filteredAgreements.length === 0 ? (
              <li className="text-center text-xs text-muted-foreground py-4">
                No agreements found.
              </li>
            ) : (
              filteredAgreements.map((agreement) => (
                <li
                  key={agreement.id}
                  className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 p-3"
                >
                  <div>
                    <div className="font-medium">{agreement.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {agreement.user}
                    </div>
                  </div>
                  <span
                    className={`badge ${
                      agreement.status === "active"
                        ? "badge-orange"
                        : agreement.status === "completed"
                        ? "badge-green"
                        : "badge-red"
                    }`}
                  >
                    {agreement.status}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </aside>
    </div>
  );
}
