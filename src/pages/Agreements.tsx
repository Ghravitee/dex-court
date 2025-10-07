import { useState } from "react";
import { Button } from "../components/ui/button";

export default function Agreements() {
  const [withEscrow, setWithEscrow] = useState(false);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <header className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white/90">
            Create Agreement
          </h2>
        </header>
        <div className="glass p-6 ring-1 ring-white/10">
          <form className="space-y-5">
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">
                Title
              </label>
              <input
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 outline-none ring-0 focus:border-cyan-400/40"
                placeholder="e.g. Design Sprint Phase 1"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-muted-foreground">
                  Type
                </label>
                <select className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-cyan-400/40">
                  <option>Service</option>
                  <option>Contract</option>
                  <option>IP License</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm text-muted-foreground">
                  Counterparty
                </label>
                <input
                  className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-cyan-400/40"
                  placeholder="@0xHandle or address"
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">
                Description
              </label>
              <textarea
                className="min-h-28 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-cyan-400/40"
                placeholder="Scope, deliverables, timelines..."
              />
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <label className="flex cursor-pointer items-center justify-between">
                <span className="text-sm text-white/90">Optional Escrow</span>
                <input
                  type="checkbox"
                  checked={withEscrow}
                  onChange={(e) => setWithEscrow(e.target.checked)}
                  className="h-4 w-4 accent-cyan-400"
                />
              </label>
              {withEscrow && (
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm text-muted-foreground">
                      Token
                    </label>
                    <select className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-cyan-400/40">
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
                      className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-cyan-400/40"
                      placeholder="1000"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-muted-foreground">
                      Deadline
                    </label>
                    <input
                      type="date"
                      className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-cyan-400/40"
                    />
                  </div>
                </div>
              )}
            </div>
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
      </div>
      <aside className="space-y-4">
        <div className="glass p-5 ring-1 ring-white/10">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white/90">
              Recent Agreements
            </h3>
            <button className="text-xs text-cyan-300 hover:underline">
              Filters
            </button>
          </div>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 p-3">
              <div>
                <div className="font-medium">Dev Retainer Q1</div>
                <div className="text-xs text-muted-foreground">@0xNova</div>
              </div>
              <span className="badge badge-green">signed</span>
            </li>
            <li className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 p-3">
              <div>
                <div className="font-medium">Brand Design</div>
                <div className="text-xs text-muted-foreground">@0xAstra</div>
              </div>
              <span className="badge badge-orange">pending</span>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
