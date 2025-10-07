import { useState } from "react";
import { Button } from "../components/ui/button";
import { Upload, Filter, Scale } from "lucide-react";
import { toast } from "sonner";

export default function Disputes() {
  const [form, setForm] = useState({
    type: "Payment",
    defendant: "",
    value: "",
    evidence: [] as File[],
  });

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    setForm((f) => ({ ...f, evidence: files }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    toast.success("Dispute submitted", {
      description: `${form.type} vs ${form.defendant || "Unknown"}`,
    });
    setForm({ type: "Payment", defendant: "", value: "", evidence: [] });
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-white/90">
          <Scale className="h-5 w-5 text-cyan-300" /> Raise New Dispute
        </h2>
        <Button
          variant="outline"
          className="border-white/20 text-cyan-200 hover:bg-cyan-500/10"
        >
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </header>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <form
          onSubmit={submit}
          className="lg:col-span-1 glass space-y-5 p-6 ring-1 ring-white/10"
        >
          <div>
            <label className="mb-2 block text-sm text-muted-foreground">
              Type
            </label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-cyan-400/40"
            >
              <option>Payment</option>
              <option>Quality</option>
              <option>Delivery</option>
              <option>IP</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm text-muted-foreground">
              Defendant
            </label>
            <input
              value={form.defendant}
              onChange={(e) => setForm({ ...form, defendant: e.target.value })}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-cyan-400/40"
              placeholder="@0xHandle or address"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-muted-foreground">
              Evidence
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
          </div>
          <div>
            <label className="mb-2 block text-sm text-muted-foreground">
              Value
            </label>
            <div className="grid grid-cols-3 gap-3">
              <select className="col-span-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-cyan-400/40">
                <option>USDC</option>
                <option>DAI</option>
                <option>ETH</option>
              </select>
              <input
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                className="col-span-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-cyan-400/40"
                placeholder="Amount"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="outline"
              type="button"
              onClick={() =>
                setForm({
                  type: "Payment",
                  defendant: "",
                  value: "",
                  evidence: [],
                })
              }
              className="border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/10"
            >
              Reset
            </Button>
            <Button variant="neon" className="neon-hover" type="submit">
              Submit
            </Button>
          </div>
        </form>

        <div className="lg:col-span-2 glass p-0 ring-1 ring-white/10">
          <div className="flex items-center justify-between border-b border-white/10 p-5">
            <h3 className="text-sm font-semibold text-white/90">Disputes</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="px-5 py-3">Case ID</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Parties</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Deadline</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    id: "D-229",
                    type: "Payment",
                    parties: "@0xAlfa vs @0xBeta",
                    status: "Under Review",
                    deadline: "2025-11-03",
                  },
                  {
                    id: "D-231",
                    type: "Quality",
                    parties: "@0xAstra vs @0xNova",
                    status: "Resolved",
                    deadline: "2025-10-28",
                  },
                  {
                    id: "D-233",
                    type: "Delivery",
                    parties: "@0xOrion vs @0xEcho",
                    status: "Under Review",
                    deadline: "2025-11-10",
                  },
                ].map((d) => (
                  <tr key={d.id} className="border-t border-white/10">
                    <td className="px-5 py-4 font-medium text-white/90">
                      {d.id}
                    </td>
                    <td className="px-5 py-4">{d.type}</td>
                    <td className="px-5 py-4">{d.parties}</td>
                    <td className="px-5 py-4">
                      {d.status === "Resolved" ? (
                        <span className="badge badge-blue">Resolved</span>
                      ) : (
                        <span className="badge badge-red">Under Review</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {d.deadline}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button
                        variant="outline"
                        className="border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/10"
                      >
                        View
                      </Button>
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
