/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
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
import { toast } from "sonner";
import { Search, SortAsc, SortDesc, Eye } from "lucide-react";

// Types
type Escrow = {
  id: string;
  title: string;
  from: string; // payer source in record
  to: string;
  token: string;
  amount: number;
  status: "pending" | "completed" | "frozen";
  deadline: string; // ISO date
  type: "public" | "private";
  description: string;
  createdAt: number;
};

export default function Escrow() {
  const initial: Escrow[] = useMemo(
    () => [
      // 🟡 Pending (Active)
      {
        id: "E-101",
        title: "Design Sprint Phase 1",
        from: "@0xAlfa",
        to: "@0xBeta",
        token: "USDC",
        amount: 1200,
        status: "pending",
        deadline: "2025-11-11",
        type: "public",
        description: "Design sprint including UX flows and wireframes.",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
      },
      {
        id: "E-102",
        title: "Frontend Development",
        from: "@0xLuna",
        to: "@0xNova",
        token: "ETH",
        amount: 1,
        status: "pending",
        deadline: "2025-12-01",
        type: "public",
        description: "Landing page and dashboard components.",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
      },
      {
        id: "E-103",
        title: "DAO Graphic Assets",
        from: "@0xEcho",
        to: "@0xAlfa",
        token: "DAI",
        amount: 500,
        status: "pending",
        deadline: "2025-12-15",
        type: "public",
        description: "Graphics for social media and proposals.",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 4,
      },

      // 🟢 Completed
      {
        id: "E-099",
        title: "Audit Settlement",
        from: "@0xAstra",
        to: "@0xNova",
        token: "ETH",
        amount: 0.5,
        status: "completed",
        deadline: "2025-09-01",
        type: "public",
        description: "Security audit settlement for v1 contracts.",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 18,
      },
      {
        id: "E-098",
        title: "Content Bounty",
        from: "@0xWriter",
        to: "@0xAlfa",
        token: "USDC",
        amount: 300,
        status: "completed",
        deadline: "2025-09-20",
        type: "public",
        description: "Technical blog post about smart contracts.",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 25,
      },
      {
        id: "E-097A",
        title: "Brand Kit Delivery",
        from: "@0xEcho",
        to: "@0xVega",
        token: "DAI",
        amount: 700,
        status: "completed",
        deadline: "2025-09-30",
        type: "public",
        description: "Finalized logos and brand assets.",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 20,
      },

      // 🔴 Disputed (Frozen)
      {
        id: "E-097",
        title: "Marketing Retainer",
        from: "@0xOrion",
        to: "@0xEcho",
        token: "DAI",
        amount: 800,
        status: "frozen",
        deadline: "2025-10-12",
        type: "public",
        description: "Monthly retainer. Disputed deliverables.",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 8,
      },
      {
        id: "E-096",
        title: "Bug Fix Bounty",
        from: "@0xBuggy",
        to: "@0xCoder",
        token: "USDC",
        amount: 150,
        status: "frozen",
        deadline: "2025-10-20",
        type: "public",
        description: "Disagreement on issue reproduction.",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
      },
      {
        id: "E-095",
        title: "Private NDA",
        from: "@you",
        to: "@partner",
        token: "USDC",
        amount: 200,
        status: "pending",
        deadline: "2025-12-22",
        type: "private",
        description: "Private NDA with milestone clause.",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
      },
    ],
    [],
  );

  const [escrows, setEscrows] = useState<Escrow[]>(initial);
  const [statusTab, setStatusTab] = useState("active"); // active/completed/disputed
  const [sortAsc, setSortAsc] = useState(false);
  const [query, setQuery] = useState("");

  const listed = escrows
    .filter((e) => e.type === "public")
    .filter((e) =>
      statusTab === "active"
        ? e.status === "pending"
        : statusTab === "completed"
          ? e.status === "completed"
          : e.status === "frozen",
    )
    .filter((e) =>
      query.trim()
        ? e.title.toLowerCase().includes(query.toLowerCase()) ||
          e.description.toLowerCase().includes(query.toLowerCase()) ||
          e.from.toLowerCase().includes(query.toLowerCase()) ||
          e.to.toLowerCase().includes(query.toLowerCase())
        : true,
    )
    .sort((a, b) =>
      sortAsc ? a.createdAt - b.createdAt : b.createdAt - a.createdAt,
    );

  // Modal state
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<Escrow | null>(null);
  const [form, setForm] = useState({
    title: "",
    type: "public" as "public" | "private",
    counterparty: "",
    payer: "me" as "me" | "counterparty",
    token: "USDC",
    amount: "",
    description: "",
    image: null as File | null,
    deadline: "",
  });

  function createEscrow() {
    if (!form.title || !form.counterparty || !form.amount || !form.deadline) {
      toast.error("Please fill all required fields");
      return;
    }
    const id = `E-${Math.floor(Math.random() * 900 + 100)}`;
    const next: Escrow = {
      id,
      title: form.title,
      from: form.payer === "me" ? "@you" : form.counterparty,
      to: form.payer === "me" ? form.counterparty : "@you",
      token: form.token,
      amount: Number(form.amount),
      status: "pending",
      deadline: form.deadline,
      type: form.type,
      description: form.description,
      createdAt: Date.now(),
    };
    setEscrows((arr) => [next, ...arr]);
    setOpen(false);
    setForm({
      title: "",
      type: "public",
      counterparty: "",
      payer: "me",
      token: "USDC",
      amount: "",
      description: "",
      image: null,
      deadline: "",
    });
    if (form.payer === "me") {
      toast.success("Escrow created", {
        description: `Please deposit ${next.amount} ${next.token} to activate.`,
      });
    } else {
      toast.message("Escrow created", {
        description: `Awaiting ${next.to} to deposit. You can sign now.`,
      });
    }
  }

  return (
    <div className="relative">
      {/* Main */}
      <div className="absolute inset-0 -z-[50] bg-cyan-500/15 blur-3xl"></div>

      <div className="space-y-4 lg:col-span-3">
        <div className="flex items-center justify-between">
          <header className="flex flex-col gap-3">
            <div>
              <h2 className="space mb-4 text-[22px] font-semibold text-white/90">
                Escrow Center
              </h2>
              <Button
                variant="neon"
                className="neon-hover mb-4 w-fit"
                onClick={() => setOpen(true)}
              >
                Create Escrow
              </Button>

              <p className="text-muted-foreground max-w-[20rem] text-lg">
                Browse public escrows. Create, review, and manage funds
                securely.
              </p>
            </div>
            {/* Moved call-to-action under heading for emphasis */}
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild></DialogTrigger>
              <DialogContent className="max-w-2xl rounded-xl border border-b-2 border-white/10 bg-black">
                <DialogHeader>
                  <DialogTitle>Create Escrow</DialogTitle>
                  <DialogDescription>
                    Set up the agreement, parties, and funding details.
                  </DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    createEscrow();
                  }}
                  className="grid grid-cols-1 gap-4 md:grid-cols-2"
                >
                  {/* Title */}
                  <div>
                    <label className="text-muted-foreground mb-2 block text-sm">
                      Title
                    </label>
                    <input
                      value={form.title}
                      onChange={(e) =>
                        setForm({ ...form, title: e.target.value })
                      }
                      className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-cyan-400/40"
                      placeholder="e.g. Design Sprint Phase 1"
                      required
                    />
                  </div>
                  {/* Type */}
                  <div>
                    <label className="text-muted-foreground mb-2 block text-sm">
                      Type
                    </label>
                    <select
                      value={form.type}
                      onChange={(e) =>
                        setForm({ ...form, type: e.target.value as any })
                      }
                      className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-cyan-400/40"
                      required
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                  {/* Counterparty */}
                  <div>
                    <label className="text-muted-foreground mb-2 block text-sm">
                      Counterparty
                    </label>
                    <input
                      value={form.counterparty}
                      onChange={(e) =>
                        setForm({ ...form, counterparty: e.target.value })
                      }
                      className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-cyan-400/40"
                      placeholder="@0xHandle or address"
                      required
                    />
                  </div>
                  {/* Who pays */}
                  <div>
                    <label className="text-muted-foreground mb-2 block text-sm">
                      Who Pays?
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["me", "counterparty"] as const).map((p) => (
                        <label
                          key={p}
                          className={`cursor-pointer rounded-md border p-3 text-center text-sm transition hover:border-cyan-400/40 ${
                            form.payer === p
                              ? "border-cyan-400/40 bg-cyan-500/30 text-cyan-200"
                              : "border-white/10 bg-white/5"
                          }`}
                        >
                          <input
                            type="radio"
                            name="payer"
                            className="hidden"
                            checked={form.payer === p}
                            onChange={() => setForm({ ...form, payer: p })}
                          />
                          {p === "me" ? "Me" : "Counterparty"}
                        </label>
                      ))}
                    </div>
                  </div>
                  {/* Token */}
                  <div>
                    <label className="text-muted-foreground mb-2 block text-sm">
                      Payment Token
                    </label>
                    <select
                      value={form.token}
                      onChange={(e) =>
                        setForm({ ...form, token: e.target.value })
                      }
                      className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-cyan-400/40"
                      required
                    >
                      <option>USDC</option>
                      <option>DAI</option>
                      <option>ETH</option>
                    </select>
                  </div>
                  {/* Amount */}
                  <div>
                    <label className="text-muted-foreground mb-2 block text-sm">
                      Amount
                    </label>
                    <input
                      value={form.amount}
                      onChange={(e) =>
                        setForm({ ...form, amount: e.target.value })
                      }
                      className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-cyan-400/40"
                      placeholder="1000"
                      required
                    />
                  </div>
                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="text-muted-foreground mb-2 block text-sm">
                      Description
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                      }
                      className="min-h-24 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-cyan-400/40"
                      placeholder="Details, milestones, and expectations"
                    />
                  </div>
                  {/* Image */}
                  <div>
                    <label className="text-muted-foreground mb-2 block text-sm">
                      Image Upload
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setForm({ ...form, image: e.target.files?.[0] || null })
                      }
                      className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2"
                    />
                  </div>
                  {/* Deadline */}
                  <div>
                    <label className="text-muted-foreground mb-2 block text-sm">
                      Deadline
                    </label>
                    <input
                      type="date"
                      value={form.deadline}
                      onChange={(e) =>
                        setForm({ ...form, deadline: e.target.value })
                      }
                      className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-cyan-400/40"
                      required
                    />
                  </div>
                  {/* Footer */}
                  <DialogFooter className="mt-4 md:col-span-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/10"
                      onClick={() => setOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" variant="neon" className="neon-hover">
                      Submit & Sign
                    </Button>
                  </DialogFooter>
                </form>
                {/* Conditional note */}
                {form.payer === "me" ? (
                  <p className="text-muted-foreground mt-2 text-xs">
                    After signing, you will be prompted to deposit{" "}
                    <span className="text-cyan-300">
                      {form.amount || "amount"} {form.token}
                    </span>{" "}
                    to activate this escrow.
                  </p>
                ) : (
                  <p className="text-muted-foreground mt-2 text-xs">
                    Counterparty will be notified to deposit funds. You can sign
                    immediately.
                  </p>
                )}
              </DialogContent>
            </Dialog>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative grow sm:max-w-xs">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-cyan-300" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search escrows by title, party, or description"
                  className="placeholder:text-muted-foreground w-full rounded-md border border-white/10 bg-white/5 py-2 pr-3 pl-9 text-sm ring-0 outline-none focus:border-cyan-400/40"
                />
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
                {sortAsc ? "Old → New" : "New → Old"}
              </Button>
            </div>
          </header>

          <aside className="space-y-4">
            <div className="rounded-xl border border-b-2 border-white/10 px-4 py-5 ring-1 ring-white/10">
              <div className="mb-3 text-sm font-semibold text-white/90">
                Filter
              </div>
              <Tabs value={statusTab} onValueChange={setStatusTab}>
                <TabsList className="bg-white/5">
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="disputed">Disputed</TabsTrigger>
                </TabsList>
                <TabsContent
                  value="active"
                  className="text-muted-foreground mt-3 text-xs"
                >
                  Showing pending escrows
                </TabsContent>
                <TabsContent
                  value="completed"
                  className="text-muted-foreground mt-3 text-xs"
                >
                  Showing completed escrows
                </TabsContent>
                <TabsContent
                  value="disputed"
                  className="text-muted-foreground mt-3 text-xs"
                >
                  Showing disputed escrows
                </TabsContent>
              </Tabs>
            </div>
          </aside>
        </div>

        {/* Cards grid */}
        {listed.length === 0 ? (
          <div className="text-muted-foreground rounded-xl border border-white/10 bg-white/5 p-6 text-sm">
            No escrows found.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {listed.map((e) => (
              <div
                key={e.id}
                className={`rounded-xl p-5 ring-2 ring-white/10 ${
                  e.status === "completed"
                    ? "shadow-[0_0_24px_rgba(16,185,129,0.25)] ring-emerald-400/40"
                    : e.status === "frozen"
                      ? "shadow-[0_0_24px_rgba(244,63,94,0.25)] ring-rose-400/40"
                      : "shadow-[0_0_24px_rgba(56,189,248,0.25)] ring-sky-400/40"
                }`}
              >
                <div className="gap-3">
                  <div>
                    <div className="text-lg font-semibold tracking-wide text-[#0891b2] drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]">
                      {e.title}
                    </div>

                    <div className="mt-1 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <div>
                        <div className="text-muted-foreground">Payer</div>
                        <div className="text-cyan-300/90">{e.from}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Payee</div>
                        <div className="text-pink-300/90">{e.to}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Amount</div>
                        <div className="text-green-500/90">
                          {e.amount} {e.token}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="text-muted-foreground">Status</div>
                        <div>
                          {e.status === "completed" ? (
                            <span className="badge badge-green">Completed</span>
                          ) : e.status === "frozen" ? (
                            <span className="badge badge-red">Disputed</span>
                          ) : (
                            <span className="badge badge-blue">Pending</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-muted-foreground mt-3 line-clamp-2 text-sm">
                  {e.description}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-muted-foreground text-xs">
                    Deadline: {e.deadline}
                  </div>
                  <Button
                    variant="outline"
                    className="border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/10"
                    onClick={() => setView(e)}
                  >
                    <Eye className="mr-2 h-4 w-4" /> View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right aside */}

      {/* View modal */}
      <Dialog open={!!view} onOpenChange={(v) => !v && setView(null)}>
        <DialogContent className="max-w-xl border-white/20 bg-black/80">
          <DialogHeader>
            <DialogTitle>{view?.title}</DialogTitle>
            <DialogDescription>Escrow details</DialogDescription>
          </DialogHeader>
          {view && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-muted-foreground">Payer</div>
                  <div className="text-white/90">{view.from}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Payee</div>
                  <div className="text-white/90">{view.to}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Amount</div>
                  <div className="text-white/90">
                    {view.amount} {view.token}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Status</div>
                  <div>
                    {view.status === "completed" ? (
                      <span className="badge badge-green">Completed</span>
                    ) : view.status === "frozen" ? (
                      <span className="badge badge-red">Disputed</span>
                    ) : (
                      <span className="badge badge-blue">Pending</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Deadline</div>
                  <div className="text-white/90">{view.deadline}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Visibility</div>
                  <div className="text-white/90 capitalize">{view.type}</div>
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Description</div>
                <p className="text-foreground/80">{view.description}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
