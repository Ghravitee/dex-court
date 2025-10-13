/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import { Button } from "../components/ui/button";
import { ChevronDown, Calendar, X } from "lucide-react";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

type Agreement = {
  id: number;
  date: string;
  title: string;
  parties: string;
  amount: string;
  deadline: string;
  status: "pending" | "signed" | "cancelled" | "completed" | "disputed";
};

export default function AgreementsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deadline, setDeadline] = useState<Date | null>(null);

  // Filters
  const [filter, setFilter] = useState<
    "all" | "pending" | "signed" | "cancelled" | "completed" | "disputed"
  >("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Mock data (replace with fetched data)
  const agreements: Agreement[] = [
    {
      id: 1,
      date: "2025-10-10",
      title: "Website Redesign",
      parties: "@0xNova / @0xEcho",
      amount: "1200 USDC",
      deadline: "2025-11-01",
      status: "completed",
    },
    {
      id: 2,
      date: "2025-10-08",
      title: "Smart Contract Audit",
      parties: "@0xAres / @0xNova",
      amount: "800 DAI",
      deadline: "2025-10-25",
      status: "pending",
    },
    {
      id: 3,
      date: "2025-09-25",
      title: "Marketing Retainer",
      parties: "@0xZephyr / @0xAstra",
      amount: "1500 USDC",
      deadline: "2025-12-01",
      status: "signed",
    },
  ];

  const filteredAgreements =
    filter === "all"
      ? agreements
      : agreements.filter((a) => a.status === filter);

  const filterOptions = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "signed", label: "Signed" },
    { value: "cancelled", label: "Cancelled" },
    { value: "completed", label: "Completed" },
    { value: "disputed", label: "Disputed" },
  ];

  return (
    <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-5">
      {/* Background Blur */}
      <div className="absolute inset-0 -z-[50] bg-cyan-500/10 blur-3xl" />

      {/* Main Agreements Section */}
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

        {/* Filters */}
        <div className="mb-4 flex items-center justify-between">
          <div className="relative w-40" ref={filterRef}>
            <div
              onClick={() => setIsFilterOpen((prev) => !prev)}
              className="flex cursor-pointer items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white"
            >
              <span className="capitalize">
                {filterOptions.find((f) => f.value === filter)?.label}
              </span>
              <ChevronDown
                className={`transition-transform ${
                  isFilterOpen ? "rotate-180" : ""
                }`}
              />
            </div>
            {isFilterOpen && (
              <div className="absolute top-[110%] z-50 w-full rounded-xl bg-cyan-800 shadow-md">
                {filterOptions.map((option) => (
                  <div
                    key={option.value}
                    onClick={() => {
                      setFilter(option.value as any);
                      setIsFilterOpen(false);
                    }}
                    className="cursor-pointer px-4 py-2 transition-colors hover:bg-cyan-300 hover:text-white"
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Agreements Table */}
        <div className="glass border border-white/10 bg-gradient-to-br from-cyan-500/10 p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-white">
              <thead className="border-b border-white/10 text-cyan-300/80">
                <tr>
                  <th className="px-4 py-2">Date Created</th>
                  <th className="px-4 py-2">Title</th>
                  <th className="px-4 py-2">Parties</th>
                  <th className="px-4 py-2">Amount</th>
                  <th className="px-4 py-2">Deadline</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredAgreements.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-6 text-center text-sm text-gray-400"
                    >
                      No agreements found.
                    </td>
                  </tr>
                ) : (
                  filteredAgreements.map((a) => (
                    <tr
                      key={a.id}
                      className="border-b border-white/10 transition-colors hover:bg-white/5"
                    >
                      <td className="px-4 py-3">{a.date}</td>
                      <td className="px-4 py-3 font-medium">{a.title}</td>
                      <td className="px-4 py-3">{a.parties}</td>
                      <td className="px-4 py-3">{a.amount}</td>
                      <td className="px-4 py-3">{a.deadline}</td>
                      <td className="px-4 py-3 capitalize">
                        <span
                          className={`badge ${
                            a.status === "completed"
                              ? "badge-green"
                              : a.status === "pending"
                                ? "badge-orange"
                                : a.status === "disputed"
                                  ? "badge-red"
                                  : "badge-cyan"
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <aside className="col-span-2 space-y-4">
        <h1 className="mb-2 text-xl text-white">Recent Agreements</h1>
        <div className="glass border border-white/10 bg-gradient-to-br from-cyan-500/10 p-5">
          <ul className="space-y-3 text-sm">
            {agreements.slice(0, 3).map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 p-3"
              >
                <div>
                  <div className="font-medium">{a.title}</div>
                  <div className="text-muted-foreground text-xs">
                    {a.parties}
                  </div>
                </div>
                <span
                  className={`badge ${
                    a.status === "completed"
                      ? "badge-green"
                      : a.status === "pending"
                        ? "badge-orange"
                        : "badge-cyan"
                  }`}
                >
                  {a.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Modal for Create Agreement */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass relative w-full max-w-2xl rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/10 p-8">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-3 right-3 text-cyan-300 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="mb-4 text-lg text-white">Create Agreement</h2>

            <div className="space-y-4">
              <input
                placeholder="Title"
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 ring-cyan-400 outline-none focus:ring-1"
              />
              <input
                placeholder="Counterparty (@handle or address)"
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 ring-cyan-400 outline-none focus:ring-1"
              />
              <textarea
                placeholder="Description, deliverables, scope..."
                className="min-h-28 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 ring-cyan-400 outline-none focus:ring-1"
              />
              <div className="relative">
                <Calendar className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-cyan-300" />
                <ReactDatePicker
                  selected={deadline}
                  onChange={(date) => setDeadline(date)}
                  placeholderText="Select deadline"
                  dateFormat="dd/MM/yyyy"
                  className="w-full rounded-md border border-white/10 bg-white/5 py-2 pr-3 pl-10 text-white outline-none placeholder:text-white/50"
                />
              </div>
              <Button
                onClick={() => setIsModalOpen(false)}
                variant="neon"
                className="w-full"
              >
                Submit & Sign
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
