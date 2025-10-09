/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from "react";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Info, Search, SortAsc, SortDesc, Upload, Scale } from "lucide-react";
import { toast } from "sonner";

// Types
type DisputeRow = {
  id: string;
  createdAt: string; // ISO
  title: string;
  request: "Pro Bono" | "Paid";
  parties: string;
  status: "Pending" | "Vote in Progress" | "Settled" | "Dismissed";
};

export default function Disputes() {
  // Sample data
  const data = useMemo<DisputeRow[]>(
    () => [
      {
        id: "D-311",
        createdAt: "2025-10-30",
        title: "Payment dispute for audit",
        request: "Paid",
        parties: "@0xAlfa vs @0xBeta",
        status: "Vote in Progress",
      },
      {
        id: "D-309",
        createdAt: "2025-10-28",
        title: "Missed delivery window",
        request: "Pro Bono",
        parties: "@0xAstra vs @0xNova",
        status: "Pending",
      },
      {
        id: "D-300",
        createdAt: "2025-10-14",
        title: "IP infringement claim",
        request: "Paid",
        parties: "@0xOrion vs @0xEcho",
        status: "Settled",
      },
      {
        id: "D-296",
        createdAt: "2025-10-09",
        title: "Unresponsive contractor",
        request: "Pro Bono",
        parties: "@0xZen vs @0xVolt",
        status: "Dismissed",
      },
    ],
    []
  );

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<DisputeRow["status"] | "All">("All");
  const [dateRange, setDateRange] = useState("All");
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = data
    .filter((d) => (status === "All" ? true : d.status === status))
    .filter((d) =>
      query.trim()
        ? d.title.toLowerCase().includes(query.toLowerCase()) ||
          d.parties.toLowerCase().includes(query.toLowerCase())
        : true
    )
    .filter((d) => {
      if (dateRange === "All") return true;
      const days = dateRange === "7d" ? 7 : 30;
      const dtime = new Date(d.createdAt).getTime();
      return Date.now() - dtime <= days * 24 * 60 * 60 * 1000;
    })
    .sort((a, b) =>
      sortAsc
        ? a.createdAt.localeCompare(b.createdAt)
        : b.createdAt.localeCompare(a.createdAt)
    );

  // Modal state for create
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    kind: "Pro Bono" as "Pro Bono" | "Paid",
    defendant: "",
    description: "",
    evidence: [] as File[],
    witnesses: [""] as string[],
  });

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    setForm((f) => ({ ...f, evidence: files }));
  }

  function addWitness() {
    setForm((f) =>
      f.witnesses.length >= 5 ? f : { ...f, witnesses: [...f.witnesses, ""] }
    );
  }

  function updateWitness(i: number, v: string) {
    setForm((f) => ({
      ...f,
      witnesses: f.witnesses.map((w, idx) => (idx === i ? v : w)),
    }));
  }

  function removeWitness(i: number) {
    setForm((f) => ({
      ...f,
      witnesses: f.witnesses.filter((_, idx) => idx !== i),
    }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    toast.success("Dispute submitted", {
      description: `${form.title || "Untitled"} • ${form.kind}`,
    });
    setOpen(false);
    setForm({
      title: "",
      kind: "Pro Bono",
      defendant: "",
      description: "",
      evidence: [],
      witnesses: [""],
    });
  }

  return (
    <div className="space-y-8">
      {/* Intro section */}
      <section className="glass ring-1 ring-white/10 p-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-3">
            <h2 className="text-xl font-semibold text-white/90 space">
              Have you been wronged or cheated? Don’t stay silent, start a
              dispute.
            </h2>
            <div>
              <h3 className="text-lg font-semibold text-white/90">
                Who Judges Your Case?
              </h3>
              <p className="mt-1 text-cyan-400 text-muted-foreground space">
                Judges
              </p>
              <p className="text-sm text-muted-foreground">
                DexCourt’s panel of judges consists of reputable and well-known
                figures across both Web3 and traditional spaces.
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                <li>Top influencers (e.g., IncomeSharks)</li>
                <li>Leading project founders (e.g., CZ)</li>
                <li>Experienced blockchain developers</li>
                <li>Respected degens with strong community reputation</li>
                <li>Licensed lawyers and real-world judges</li>
                <li>Prominent Web2 personalities</li>
              </ul>
              <p className="mt-2 text-sm text-muted-foreground">
                These individuals are selected based on proven{" "}
                <span className="text-cyan-400">
                  credibility, influence, and integrity
                </span>{" "}
                within their respective domains.
              </p>
              <p className="mt-3 text-cyan-400 text-muted-foreground space">
                The Community
              </p>
              <p className="text-sm text-muted-foreground">
                In addition to the judges, the broader DexCourt community also
                plays a vital role. Holders of the $LAW token can review cases
                and cast their votes, ensuring that justice remains
                decentralized and inclusive.
              </p>
              <div className="mt-3 rounded-lg border border-white/10 bg-white/5 p-4 w-fit">
                <div className="text-sm font-medium text-white/90">
                  Weighted Decision Model
                </div>
                <ul className="mt-2 text-sm text-muted-foreground">
                  <li>
                    Judges’ Votes:{" "}
                    <span className="text-emerald-300 font-medium">
                      70% influence
                    </span>
                  </li>
                  <li>
                    Community Votes:{" "}
                    <span className="text-cyan-300 font-medium">
                      30% influence
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="flex items-start justify-end">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="neon" className="neon-hover">
                  <Scale className="mr-2 h-4 w-4" />
                  Raise New Dispute
                </Button>
              </DialogTrigger>
              <DialogContent className=" max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Raise New Dispute</DialogTitle>
                  <DialogDescription>
                    Provide details and evidence. Max 5 witnesses.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-sm text-muted-foreground">
                        Title <span className="text-red-500">*</span>
                      </label>
                      <div className="relative group cursor-help">
                        <Info className="h-4 w-4 text-cyan-300" />

                        {/* Tooltip content */}
                        <div className="absolute right-0 top-full mt-2 hidden w-52 rounded-md bg-cyan-950/90 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                          Never underestimate the power of a catchy title — it
                          can grab attention and attract judges to your case
                          faster.
                        </div>
                      </div>
                    </div>
                    <input
                      value={form.title}
                      onChange={(e) =>
                        setForm({ ...form, title: e.target.value })
                      }
                      className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-cyan-400/40 placeholder:text-sm"
                      placeholder="e.g. Payment for Smart Contract Audit"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-sm text-muted-foreground">
                        Request Kind <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-3 text-xs">
                        <div className="relative group cursor-pointer">
                          <span className="cursor-help rounded border border-white/10 bg-white/5 px-2 py-0.5">
                            Pro Bono
                          </span>

                          {/* Tooltip content */}
                          <div className="absolute right-0 top-full mt-2 hidden w-52 rounded-md bg-cyan-950/90 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                            No payment required. Judges will handle your case
                            pro bono when available.
                          </div>
                        </div>

                        <div className="relative group cursor-pointer">
                          <span className="cursor-help rounded border border-white/10 bg-white/5 px-2 py-0.5">
                            Paid
                          </span>

                          {/* Tooltip content */}
                          <div className="absolute right-0 top-full mt-2 hidden w-52 rounded-md bg-cyan-950/90 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                            A fee of 0.01 ETH is required to initiate your
                            dispute. This fee helps prioritize your case and
                            notifies all judges to begin reviewing it
                            immediately.
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {(["Pro Bono", "Paid"] as const).map((k) => (
                        <label
                          key={k}
                          className={`cursor-pointer rounded-md border p-3 text-center text-sm transition hover:border-cyan-400/40 ${
                            form.kind === k
                              ? "bg-cyan-500/30 border-cyan-400/40 text-cyan-200"
                              : "border-white/10 bg-white/5"
                          }`}
                        >
                          <input
                            type="radio"
                            name="kind"
                            className="hidden"
                            checked={form.kind === k}
                            onChange={() => setForm({ ...form, kind: k })}
                          />
                          {k}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-muted-foreground">
                      Defendant <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={form.defendant}
                      onChange={(e) =>
                        setForm({ ...form, defendant: e.target.value })
                      }
                      className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-cyan-400/40 placeholder:text-sm"
                      placeholder="@0xHandle or address"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-muted-foreground">
                      Detailed Description{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                      }
                      className="min-h-28 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-cyan-400/40 placeholder:text-sm"
                      placeholder="Describe the situation, milestones, messages, and expectations"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-muted-foreground">
                      Evidence Upload <span className="text-red-500">*</span>
                    </label>
                    <label className="group flex cursor-pointer items-center justify-between rounded-md border border-dashed border-white/15 bg-white/5 px-4 py-6 text-sm text-muted-foreground hover:border-cyan-400/40">
                      <div className="flex items-center gap-3">
                        <Upload className="h-4 w-4 text-cyan-300" />
                        <span>
                          {form.evidence.length
                            ? `${form.evidence.length} file(s) selected`
                            : "Upload files (images, pdf, txt)"}
                        </span>
                      </div>
                      <input
                        onChange={onFile}
                        type="file"
                        multiple
                        className="hidden"
                      />
                    </label>
                    {form.evidence.length > 0 && (
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                        {form.evidence.map((f, i) => (
                          <li key={i}>{f.name}</li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-sm text-muted-foreground">
                        Witness list (max 5)
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/10"
                        onClick={addWitness}
                        disabled={form.witnesses.length >= 5}
                      >
                        Add witness
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {form.witnesses.map((w, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            value={w}
                            onChange={(e) => updateWitness(i, e.target.value)}
                            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-cyan-400/40 placeholder:text-sm"
                            placeholder={`@username or address #${i + 1}`}
                          />
                          {form.witnesses.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeWitness(i)}
                              className="rounded-md border border-white/10 bg-white/5 px-2 py-2 text-xs text-muted-foreground hover:text-white"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <DialogFooter className="pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/10"
                      onClick={() => toast.message("Draft saved")}
                    >
                      Save Draft
                    </Button>
                    <Button type="submit" variant="neon" className="neon-hover">
                      Submit
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      {/* List toolbar */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative grow sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by username or title"
              className="w-full rounded-md border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm outline-none ring-0 placeholder:text-muted-foreground focus:border-cyan-400/40"
            />
          </div>
          <div className="flex items-center gap-2">
            {(
              [
                "All",
                "Pending",
                "Vote in Progress",
                "Settled",
                "Dismissed",
              ] as const
            ).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s as any)}
                className={`rounded-md border px-3 py-1.5 text-xs ${
                  status === s
                    ? "border-cyan-400/40 bg-cyan-500/30 text-cyan-200"
                    : "border-white/10 bg-white/5 text-foreground/80 hover:border-cyan-400/30"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden items-center gap-2 sm:flex">
              <span className="text-sm text-muted-foreground space">Date:</span>

              <div className="relative">
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="appearance-none rounded-md border border-white/10 bg-white/5 px-3 py-1.5 pr-8 text-xs text-white outline-none focus:border-cyan-400/40 focus:ring-0"
                >
                  <option className="text-black" value="All">
                    All
                  </option>
                  <option className="text-black" value="7d">
                    Last 7d
                  </option>
                  <option className="text-black" value="30d">
                    Last 30d
                  </option>
                </select>

                {/* Custom dropdown arrow */}
                <svg
                  className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-white/70"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>

            <Button
              variant="outline"
              className="border-white/15 text-cyan-200 hover:bg-cyan-500/10"
              onClick={() => setSortAsc((v) => !v)}
            >
              {sortAsc ? (
                <SortAsc className="mr-2 h-4 w-4" />
              ) : (
                <SortDesc className="mr-2 h-4 w-4" />
              )}{" "}
              Sort
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="glass p-0 ring-1 ring-white/10">
          <div className="flex items-center justify-between border-b border-white/10 p-5">
            <h3 className="font-semibold text-white/90">Disputes</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground space">
                  <th className="px-5 py-3">Creation date</th>
                  <th className="px-5 py-3">Title</th>
                  <th className="px-5 py-3">Request type</th>
                  <th className="px-5 py-3">Parties</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.id} className="border-t border-white/10">
                    <td className="px-5 py-4 text-muted-foreground">
                      {d.createdAt}
                    </td>
                    <td className="px-5 py-4 font-medium text-white/90">
                      {d.title}
                    </td>
                    <td className="px-5 py-4">{d.request}</td>
                    <td className="px-5 py-4">{d.parties}</td>
                    <td className="px-5 py-4">
                      {d.status === "Settled" ? (
                        <span className="badge badge-blue">Settled</span>
                      ) : d.status === "Pending" ? (
                        <span className="badge badge-orange">Pending</span>
                      ) : d.status === "Dismissed" ? (
                        <span className="badge badge-red">Dismissed</span>
                      ) : (
                        <span className="badge border-emerald-400/30 bg-emerald-500/10 text-emerald-300">
                          Vote in Progress
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
