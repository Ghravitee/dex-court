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

type Escrow = {
  id: string;
  from: string;
  to: string;
  token: string;
  amount: number;
  status: "pending" | "completed" | "frozen";
  deadline: string; // ISO date
};

export default function Escrow() {
  const initial: Escrow[] = useMemo(
    () => [
      {
        id: "E-101",
        from: "@0xAlfa",
        to: "@0xBeta",
        token: "USDC",
        amount: 1200,
        status: "pending",
        deadline: "2025-11-11",
      },
      {
        id: "E-099",
        from: "@0xAstra",
        to: "@0xNova",
        token: "ETH",
        amount: 0.5,
        status: "completed",
        deadline: "2025-09-01",
      },
      {
        id: "E-097",
        from: "@0xOrion",
        to: "@0xEcho",
        token: "DAI",
        amount: 800,
        status: "frozen",
        deadline: "2025-10-12",
      },
    ],
    []
  );
  const [escrows, setEscrows] = useState<Escrow[]>(initial);
  const [tab, setTab] = useState("active");

  const active = escrows.filter((e) => e.status === "pending");
  const completed = escrows.filter((e) => e.status === "completed");
  const disputed = escrows.filter((e) => e.status === "frozen");

  // Modal state
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    token: "USDC",
    amount: "",
    counterparty: "",
    deadline: "",
  });

  function createEscrow() {
    if (!form.amount || !form.counterparty || !form.deadline) {
      toast.error("Please fill all fields");
      return;
    }
    const id = `E-${Math.floor(Math.random() * 900 + 100)}`;
    const next: Escrow = {
      id,
      from: "@you",
      to: form.counterparty,
      token: form.token,
      amount: Number(form.amount),
      status: "pending",
      deadline: form.deadline,
    };
    setEscrows((arr) => [next, ...arr]);
    setOpen(false);
    setForm({ token: "USDC", amount: "", counterparty: "", deadline: "" });
    toast.success("Escrow created", {
      description: `${next.amount} ${next.token} with ${next.to}`,
    });
  }

  function Card({ e }: { e: Escrow }) {
    const ring =
      e.status === "completed"
        ? "ring-emerald-400/40 shadow-[0_0_24px_rgba(16,185,129,0.25)]"
        : e.status === "frozen"
        ? "ring-rose-400/40 shadow-[0_0_24px_rgba(244,63,94,0.25)]"
        : "ring-sky-400/40 shadow-[0_0_24px_rgba(56,189,248,0.25)]";
    return (
      <div
        className={`glass ring-1 ring-white/10 p-5 rounded-xl bg-gradient-to-br from-cyan-500/10 ${ring}`}
      >
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-white/90">{e.id}</div>
          <span
            className={`badge ${
              e.status === "completed"
                ? "badge-green"
                : e.status === "frozen"
                ? "badge-red"
                : "badge-blue"
            }`}
          >
            {e.status === "completed"
              ? "Completed"
              : e.status === "frozen"
              ? "Frozen"
              : "Pending"}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-muted-foreground">Parties</div>
            <div className="text-white/90">
              {e.from} → {e.to}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Amount</div>
            <div className="text-white/90">
              {e.amount} {e.token}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Deadline</div>
            <div className="text-white/90">{e.deadline}</div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          {e.status === "pending" && (
            <>
              <Button
                variant="neon"
                className="neon-hover"
                onClick={() =>
                  toast.success("Released", {
                    description: `${e.amount} ${e.token} to ${e.to}`,
                  })
                }
              >
                Release
              </Button>
              <Button
                variant="outline"
                className="border-rose-400/40 text-rose-300 hover:bg-rose-500/10"
                onClick={() =>
                  toast.message("Dispute raised", {
                    description: `${e.id} moved to Disputed`,
                  })
                }
              >
                Dispute
              </Button>
            </>
          )}
          {e.status === "completed" && (
            <Button
              variant="outline"
              className="border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/10"
            >
              View Receipt
            </Button>
          )}
          {e.status === "frozen" && (
            <Button
              variant="outline"
              className="border-rose-400/40 text-rose-300 hover:bg-rose-500/10"
            >
              View Dispute
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-white/90">Escrow Center</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="neon" className="neon-hover">
              Create Escrow
            </Button>
          </DialogTrigger>
          <DialogContent className="glass border-white/10">
            <DialogHeader>
              <DialogTitle>Create Escrow</DialogTitle>
              <DialogDescription>
                Lock funds until conditions are met.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-muted-foreground">
                  Token
                </label>
                <select
                  value={form.token}
                  onChange={(e) => setForm({ ...form, token: e.target.value })}
                  className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-cyan-400/40"
                >
                  <option>USDC</option>
                  <option>DAI</option>
                  <option>ETH</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm text-muted-foreground">
                  Amount
                </label>
                <input
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-cyan-400/40"
                  placeholder="1000"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-muted-foreground">
                  Counterparty
                </label>
                <input
                  value={form.counterparty}
                  onChange={(e) =>
                    setForm({ ...form, counterparty: e.target.value })
                  }
                  className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-cyan-400/40"
                  placeholder="@0xHandle or address"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-muted-foreground">
                  Deadline
                </label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) =>
                    setForm({ ...form, deadline: e.target.value })
                  }
                  className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-cyan-400/40"
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                className="border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/10"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="neon"
                className="neon-hover"
                onClick={createEscrow}
              >
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-white/5">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="disputed">Disputed</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="mt-4">
          {active.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No active escrows.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {active.map((e) => (
                <Card key={e.id} e={e} />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="completed" className="mt-4">
          {completed.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No completed escrows.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {completed.map((e) => (
                <Card key={e.id} e={e} />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="disputed" className="mt-4">
          {disputed.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No disputed escrows.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {disputed.map((e) => (
                <Card key={e.id} e={e} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
