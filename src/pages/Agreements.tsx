/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";

import { Button } from "../components/ui/button";

import { Calendar, ChevronDown, Info, X } from "lucide-react";
import "react-datepicker/dist/react-datepicker.css";
import ReactDatePicker from "react-datepicker";

type AgreementStatus =
  | "all"
  | "pending"
  | "signed"
  | "cancelled"
  | "completed"
  | "disputed";

type Agreement = {
  id: number;
  title: string;
  parties: string; // e.g. "@0xNova, @0xAres"
  amount: string; // e.g. "1000 USDC"
  deadline: string; // e.g. "2025-11-01"
  date: string; // date created
  status: AgreementStatus;
  user?: string;
};

export default function AgreementForm() {
  const [typeValue, setTypeValue] = useState<"Public" | "Private" | "">("");
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [includeFunds, setIncludeFunds] = useState<"yes" | "no" | "">("");
  const [secureWithEscrow, setSecureWithEscrow] = useState<"yes" | "no" | "">(
    "",
  );
  const [customTokenAddress, setCustomTokenAddress] = useState("");

  const [deadline, setDeadline] = useState<Date | null>(null);

  const [isTokenOpen, setIsTokenOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<string>("");
  const [isTableFilterOpen, setIsTableFilterOpen] = useState(false);
  const [isRecentFilterOpen, setIsRecentFilterOpen] = useState(false);
  const typeRef = useRef<HTMLDivElement>(null);
  const tokenRef = useRef<HTMLDivElement>(null);
  const tableFilterRef = useRef<HTMLDivElement>(null);
  const recentFilterRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
        tableFilterRef.current &&
        !tableFilterRef.current.contains(event.target as Node)
      ) {
        setIsTableFilterOpen(false);
      }

      if (
        recentFilterRef.current &&
        !recentFilterRef.current.contains(event.target as Node)
      ) {
        setIsRecentFilterOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const tableFilterOptions = [
    { value: "all", label: "All Agreements" },
    { value: "pending", label: "Pending" },
    { value: "signed", label: "Signed" },
    { value: "cancelled", label: "Cancelled" },
    { value: "completed", label: "Completed" },
    { value: "disputed", label: "Disputed" },
  ];

  const recentFilterOptions = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "completed", label: "Completed" },
    { value: "disputed", label: "Disputed" },
  ];

  const [tableFilter, setTableFilter] = useState<AgreementStatus>("all");
  const [recentFilter, setRecentFilter] = useState<
    "all" | "active" | "completed" | "disputed"
  >("all");

  // Example agreements data (you can replace this with fetched data)
  const agreements: Agreement[] = [
    {
      id: 1,
      title: "Dev Retainer Q1",
      parties: "@0xNova, @0xAres",
      amount: "1000 USDC",
      deadline: "2025-11-01",
      date: "2025-09-22",
      status: "completed",
      user: "@0xNova",
    },
    {
      id: 2,
      title: "Brand Design",
      parties: "@0xNova, @0xEcho",
      amount: "500 DAI",
      deadline: "2025-10-28",
      date: "2025-09-30",
      status: "pending",
      user: "@0xNova",
    },
    {
      id: 3,
      title: "Website Redesign",
      parties: "@0xAstra, @0xEcho",
      amount: "1 ETH",
      deadline: "2025-12-15",
      date: "2025-10-05",
      status: "disputed",
      user: "@0xAstra",
    },
    {
      id: 4,
      title: "Smart Contract Audit",
      parties: "@0xTech, @0xClient",
      amount: "5 ETH",
      deadline: "2025-11-20",
      date: "2025-10-10",
      status: "signed",
      user: "@0xTech",
    },
    {
      id: 5,
      title: "Marketing Campaign",
      parties: "@0xMark, @0xBiz",
      amount: "2000 USDC",
      deadline: "2025-12-01",
      date: "2025-10-12",
      status: "cancelled",
      user: "@0xMark",
    },
  ];

  // Apply filtering for main table
  const filteredTableAgreements: Agreement[] =
    tableFilter === "all"
      ? agreements
      : agreements.filter((a) => a.status === tableFilter);

  // Apply filtering for recent agreements (show only 3 most recent)
  const filteredRecentAgreements: Agreement[] = agreements
    .filter((a) => {
      if (recentFilter === "all") return true;
      if (recentFilter === "active")
        return a.status === "pending" || a.status === "signed";
      return a.status === recentFilter;
    })
    .slice(0, 3); // Show only 3 most recent

  const typeOptions = [
    { value: "Public", label: "Public" },
    { value: "Private", label: "Private" },
  ];

  const tokenOptions = [
    { value: "USDC", label: "USDC" },
    { value: "DAI", label: "DAI" },
    { value: "ETH", label: "ETH" },
    { value: "custom", label: "Custom Token" },
  ];

  return (
    <div className="relative">
      <div className="absolute top-32 right-10 block rounded-full bg-cyan-500/20 blur-3xl lg:size-[30rem]"></div>
      <div className="absolute -top-20 left-0 block rounded-full bg-cyan-500/20 blur-3xl lg:size-[15rem]"></div>
      <div className="absolute inset-0 -z-[50] bg-cyan-500/10 blur-3xl"></div>

      {/* Agreements Filter */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h1 className="text-xl text-white">Agreements</h1>
            <Button
              onClick={() => setIsModalOpen(true)}
              variant="neon"
              className="neon-hover"
            >
              Create Agreement
            </Button>
          </div>
        </div>
        <div className="col-span-3">
          <div className="mb-5 flex items-center justify-between">
            <div className="group relative w-48" ref={tableFilterRef}>
              <div
                onClick={() => setIsTableFilterOpen((prev) => !prev)}
                className="flex cursor-pointer items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white"
              >
                <span className="text-sm capitalize">
                  {tableFilterOptions.find((f) => f.value === tableFilter)
                    ?.label || "All"}
                </span>
                <ChevronDown
                  className={`transition-transform ${isTableFilterOpen ? "rotate-180" : ""}`}
                />
              </div>
              {isTableFilterOpen && (
                <div className="absolute top-[110%] right-0 z-50 w-full rounded-xl bg-cyan-800 shadow-md">
                  {tableFilterOptions.map((option, idx) => (
                    <div
                      key={option.value}
                      onClick={() => {
                        setTableFilter(option.value as AgreementStatus);
                        setIsTableFilterOpen(false);
                      }}
                      className={`cursor-pointer px-4 py-2 transition-colors hover:bg-cyan-300 hover:text-white ${
                        idx === 0 ? "rounded-t-xl" : ""
                      } ${idx === tableFilterOptions.length - 1 ? "rounded-b-xl" : ""}`}
                    >
                      {option.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Agreements Table */}
          <div className="rounded-xl border border-b-2 border-white/10 ring-1 ring-white/10">
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <h3 className="font-semibold text-white/90">All Agreements</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-sm font-semibold">
                    <th className="px-5 py-3 text-cyan-300">Date Created</th>
                    <th className="px-5 py-3 text-emerald-300">Title</th>
                    <th className="px-5 py-3 text-yellow-300">Parties</th>
                    <th className="px-5 py-3 text-pink-300">Amount</th>
                    <th className="px-5 py-3 text-indigo-300">Deadline</th>
                    <th className="px-5 py-3 text-purple-300">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTableAgreements.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-muted-foreground px-5 py-4 text-center"
                      >
                        No agreements found.
                      </td>
                    </tr>
                  ) : (
                    filteredTableAgreements.map((a) => (
                      <tr
                        key={a.id}
                        className="border-t border-white/10 text-xs transition hover:bg-white/5"
                      >
                        <td className="text-muted-foreground px-5 py-4">
                          {a.date}
                        </td>
                        <td className="px-5 py-4 font-medium text-white/90">
                          {a.title}
                        </td>
                        <td className="px-5 py-4 text-white/90">{a.parties}</td>
                        <td className="px-5 py-4 text-white/90">{a.amount}</td>
                        <td className="px-5 py-4 text-white/90">
                          {a.deadline}
                        </td>
                        <td className="px-5 py-4">
                          {a.status === "pending" ? (
                            <span className="badge badge-orange">Pending</span>
                          ) : a.status === "signed" ? (
                            <span className="badge badge-blue">Signed</span>
                          ) : a.status === "cancelled" ? (
                            <span className="badge badge-red">Cancelled</span>
                          ) : a.status === "completed" ? (
                            <span className="badge badge-green">Completed</span>
                          ) : (
                            <span className="badge badge-purple">Disputed</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <aside className="col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="space mb-2 text-xl text-white">Recent Agreements</h1>
            <div className="group relative w-36" ref={recentFilterRef}>
              <div
                onClick={() => setIsRecentFilterOpen((prev) => !prev)}
                className="flex cursor-pointer items-center justify-between rounded-md bg-white px-3 py-1 text-black transition-all dark:bg-[#d5f2f80a] dark:text-white"
              >
                <span className="text-sm capitalize">
                  {recentFilterOptions.find((f) => f.value === recentFilter)
                    ?.label || "Filter"}
                </span>
                <div className="bg-Primary flex h-8 w-8 items-center justify-center rounded-md">
                  <ChevronDown
                    className={`transform text-2xl text-white transition-transform duration-300 ${
                      isRecentFilterOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </div>
              {isRecentFilterOpen && (
                <div className="absolute top-[110%] right-0 z-50 w-full rounded-xl bg-cyan-800 shadow-md">
                  {recentFilterOptions.map((option, idx) => (
                    <div
                      key={option.value}
                      onClick={() => {
                        setRecentFilter(option.value as any);
                        setIsRecentFilterOpen(false);
                      }}
                      className={`cursor-pointer px-4 py-2 transition-colors hover:bg-cyan-300 hover:text-white ${
                        idx === 0 ? "rounded-t-xl" : ""
                      } ${
                        idx === recentFilterOptions.length - 1
                          ? "rounded-b-xl"
                          : ""
                      }`}
                    >
                      {option.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="glass border border-white/10 bg-gradient-to-br from-cyan-500/10 p-5">
            <ul className="space-y-3 text-sm">
              {filteredRecentAgreements.length === 0 ? (
                <li className="text-muted-foreground py-4 text-center text-xs">
                  No agreements found.
                </li>
              ) : (
                filteredRecentAgreements.map((agreement) => (
                  <li
                    key={agreement.id}
                    className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 p-3"
                  >
                    <div>
                      <div className="font-medium text-white">
                        {agreement.title}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {agreement.parties.replace(",", "  ↔  ")}
                      </div>
                    </div>
                    <span
                      className={`badge ${
                        agreement.status === "pending"
                          ? "badge-orange"
                          : agreement.status === "completed"
                            ? "badge-green"
                            : agreement.status === "disputed"
                              ? "badge-purple"
                              : agreement.status === "signed"
                                ? "badge-blue"
                                : agreement.status === "cancelled"
                                  ? "badge-red"
                                  : ""
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <form className="relative max-h-[90vh] space-y-5 overflow-y-auto rounded-[0.75rem] border border-white/10 bg-gradient-to-br from-cyan-500/10 p-6">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-3 right-3 text-cyan-300 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            {/* Title */}
            <div>
              <label className="space mb-2 block font-semibold text-white">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full rounded-md border bg-white/5 px-3 py-2 ring-cyan-400 outline-none focus:ring-1"
                placeholder="e.g. Design Sprint Phase 1"
              />
            </div>
            {/* Type + Counterparty */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Type */}
              <div
                className="relative flex w-full flex-col gap-2"
                ref={typeRef}
              >
                <label className="space text-sm font-semibold text-white">
                  Type <span className="text-red-500">*</span>
                </label>
                <div
                  onClick={() => setIsTypeOpen((prev) => !prev)}
                  className="flex cursor-pointer items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white ring-cyan-400 focus:ring-1"
                >
                  <span>{typeValue || "Select Type"}</span>
                  <ChevronDown
                    className={`transition-transform ${
                      isTypeOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>
                {isTypeOpen && (
                  <div className="absolute top-[110%] z-50 w-full rounded-xl bg-cyan-800 shadow-md">
                    {typeOptions.map((option) => (
                      <div
                        key={option.value}
                        onClick={() => {
                          setTypeValue(option.value as "Public" | "Private");
                          setIsTypeOpen(false);
                        }}
                        className="cursor-pointer px-4 py-2 transition-colors hover:bg-cyan-300 hover:text-white"
                      >
                        {option.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Counterparty */}
              <div>
                <label className="text-muted-foreground mb-2 block text-sm">
                  Counterparty <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 ring-cyan-400 outline-none focus:ring-1"
                  placeholder="@0xHandle or address"
                />
              </div>
            </div>
            {/* Description + Helper */}
            <div>
              <label className="text-muted-foreground mb-2 block text-sm">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                className="min-h-28 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 ring-cyan-400 outline-none focus:ring-1"
                placeholder="Scope, deliverables, timelines..."
              />
              <div className="mt-1 flex items-center gap-1">
                <Info className="size-4 text-cyan-300" />
                <p className="text-xs text-cyan-300/80">
                  If you'd like to add videos, simply add the link to the video
                  URL in the description (e.g. a public Google Drive link).
                </p>
              </div>
            </div>
            {/* Image Upload */}
            <div>
              <label className="text-muted-foreground mb-2 block text-sm">
                Upload Images <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                className="block w-full cursor-pointer text-sm text-white file:mr-4 file:rounded-md file:border-0 file:bg-cyan-600 file:px-4 file:py-2 file:text-sm file:font-semibold hover:file:bg-cyan-700"
              />
            </div>
            {/* Deadline */}

            <div>
              <label className="text-muted-foreground mb-2 block text-sm">
                Deadline <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                {/* 📅 Calendar Icon */}
                <Calendar className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-cyan-300" />

                <ReactDatePicker
                  selected={deadline}
                  onChange={(date) => setDeadline(date)}
                  placeholderText="Select a date"
                  dateFormat="dd/MM/yyyy"
                  className="w-full cursor-pointer rounded-md border border-white/10 bg-white/5 py-2 pr-3 pl-10 text-white outline-none placeholder:text-white/50 focus:border-cyan-400/40"
                  calendarClassName="!bg-cyan-700 !text-white rounded-lg border border-white/10"
                  popperClassName="z-50"
                  minDate={new Date()}
                />
              </div>
            </div>

            {/* Include Funds Toggle */}
            <div>
              <label className="text-muted-foreground mb-2 block text-sm">
                Does this Agreement Include Funds{" "}
                <span className="text-cyan-400">(Optional)</span>
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setIncludeFunds("yes")}
                  className={`rounded-md border px-4 py-2 ${
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
                  className={`rounded-md border px-4 py-2 ${
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
              <div className="space-y-3 rounded-lg border border-white/10 bg-white/5 p-4 transition-all">
                <p className="text-sm text-white/90">
                  Would you like to secure the funds in an escrow contract?{" "}
                  <span className="text-cyan-400">(Optional)</span>
                </p>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setSecureWithEscrow("yes")}
                    className={`rounded-md border px-4 py-2 ${
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
                    className={`rounded-md border px-4 py-2 ${
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
                      className="relative flex w-full flex-col gap-2"
                      ref={tokenRef}
                    >
                      <label className="text-sm font-semibold text-white">
                        Token <span className="text-red-500">*</span>
                      </label>
                      <div
                        onClick={() => setIsTokenOpen((prev) => !prev)}
                        className="flex cursor-pointer items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white"
                      >
                        <span>{selectedToken || "Select Token"}</span>
                        <ChevronDown
                          className={`transition-transform ${
                            isTokenOpen ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                      {isTokenOpen && (
                        <div className="absolute top-[110%] z-50 w-full rounded-xl bg-cyan-800 shadow-md">
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
                              className="cursor-pointer px-4 py-2 transition-colors hover:bg-cyan-300 hover:text-white"
                            >
                              {option.label}
                            </div>
                          ))}
                        </div>
                      )}
                      {selectedToken === "custom" && (
                        <div className="mt-3">
                          <label className="text-muted-foreground mb-2 block text-sm">
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
                            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 ring-cyan-400 outline-none focus:ring-1"
                          />
                        </div>
                      )}
                    </div>
                    {/* Amount */}
                    <div>
                      <label className="text-muted-foreground mb-2 block text-sm">
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
          </form>
        </div>
      )}
    </div>
  );
}
