/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState, useRef, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import {
  Search,
  SortAsc,
  SortDesc,
  Eye,
  Info,
  Upload,
  Paperclip,
  Trash2,
  Loader2,
  ChevronDown,
  Calendar,
  User,
  Users,
} from "lucide-react";
import type { Escrow, ExtendedEscrow } from "../types";
import { Link } from "react-router-dom";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// File upload types
interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  type: "image" | "document";
  size: string;
}

// Escrow type options
type EscrowType = "myself" | "others";

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
      {
        id: "E-110",
        title: "Web3 Copywriting",
        from: "@0xPen",
        to: "@0xInk",
        token: "USDC",
        amount: 250,
        status: "active",
        deadline: "2025-12-10",
        type: "public",
        description: "Ongoing copywriting engagement for Web3 DAO.",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 6,
      },
      {
        id: "E-111",
        title: "Abandoned Translation Deal",
        from: "@0xEcho",
        to: "@0xBeta",
        token: "DAI",
        amount: 300,
        status: "cancelled",
        deadline: "2025-10-05",
        type: "public",
        description: "Cancelled translation project due to inactivity.",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
      },
    ],
    [],
  );

  const [escrows, setEscrows] = useState<Escrow[]>(initial);
  const [statusTab, setStatusTab] = useState("pending");
  const [sortAsc, setSortAsc] = useState(false);
  const [query, setQuery] = useState("");

  const listed = escrows
    .filter((e) => e.type === "public")
    .filter((e) => {
      switch (statusTab) {
        case "pending":
          return e.status === "pending";
        case "active":
          return e.status === "active";
        case "cancelled":
          return e.status === "cancelled";
        case "completed":
          return e.status === "completed";
        case "disputed":
          return e.status === "frozen";
        default:
          return true;
      }
    })
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

  // Enhanced Modal state
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Dropdown states
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [isTokenOpen, setIsTokenOpen] = useState(false);
  const typeRef = useRef<HTMLDivElement>(null);
  const tokenRef = useRef<HTMLDivElement>(null);

  // Date state
  const [deadline, setDeadline] = useState<Date | null>(null);

  // New state for escrow type selection
  const [escrowType, setEscrowType] = useState<EscrowType>("myself");

  const [form, setForm] = useState({
    title: "",
    type: "" as "public" | "private" | "",
    // For "myself" type
    counterparty: "",
    payer: "" as "me" | "counterparty" | "",
    // For "others" type
    partyA: "",
    partyB: "",
    payerOther: "" as "partyA" | "partyB" | "",
    token: "",
    customTokenAddress: "",
    amount: "",
    description: "",
    evidence: [] as UploadedFile[],
    milestones: [""] as string[],
  });

  // Close dropdowns when clicking outside
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
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const typeOptions = [
    { value: "public", label: "Public" },
    { value: "private", label: "Private" },
  ];

  const tokenOptions = [
    { value: "USDC", label: "USDC" },
    { value: "DAI", label: "DAI" },
    { value: "ETH", label: "ETH" },
    { value: "custom", label: "Custom Token" },
  ];

  // Enhanced file upload handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    Array.from(selectedFiles).forEach((file) => {
      const fileType = file.type.startsWith("image/") ? "image" : "document";
      const fileSize = (file.size / 1024 / 1024).toFixed(2) + " MB";
      const newFile: UploadedFile = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        type: fileType,
        size: fileSize,
      };

      // Create preview for images
      if (fileType === "image") {
        const reader = new FileReader();
        reader.onload = (e) => {
          newFile.preview = e.target?.result as string;
          setForm((prev) => ({
            ...prev,
            evidence: [...prev.evidence, newFile],
          }));
        };
        reader.readAsDataURL(file);
      } else {
        setForm((prev) => ({
          ...prev,
          evidence: [...prev.evidence, newFile],
        }));
      }
    });
  };

  const removeFile = (id: string) => {
    setForm((prev) => ({
      ...prev,
      evidence: prev.evidence.filter((file) => file.id !== id),
    }));
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const droppedFiles = e.dataTransfer.files;
    if (!droppedFiles) return;

    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = "image/*,.pdf,.doc,.docx,.txt";
    const dataTransfer = new DataTransfer();
    Array.from(droppedFiles).forEach((file) => dataTransfer.items.add(file));
    input.files = dataTransfer.files;

    const event = new Event("change", { bubbles: true });
    input.dispatchEvent(event);

    handleFileSelect({
      target: { files: dataTransfer.files },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  // Enhanced create escrow function
  async function createEscrow(e: React.FormEvent) {
    e.preventDefault();

    // Enhanced form validation based on escrow type
    if (!form.title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!form.type) {
      toast.error("Please select escrow type");
      return;
    }
    if (escrowType === "myself") {
      if (!form.payer) {
        toast.error("Please select who pays");
        return;
      }
      if (!form.counterparty.trim()) {
        toast.error("Please enter counterparty information");
        return;
      }
    } else {
      if (!form.payerOther) {
        toast.error("Please select who pays");
        return;
      }
      if (!form.partyA.trim() || !form.partyB.trim()) {
        toast.error("Please enter both parties' information");
        return;
      }
    }
    if (!form.token) {
      toast.error("Please select payment token");
      return;
    }
    if (form.token === "custom" && !form.customTokenAddress.trim()) {
      toast.error("Please enter custom token address");
      return;
    }
    if (
      !form.amount.trim() ||
      isNaN(Number(form.amount)) ||
      Number(form.amount) <= 0
    ) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!form.description.trim()) {
      toast.error("Please enter a description");
      return;
    }
    if (!deadline) {
      toast.error("Please select a deadline");
      return;
    }

    setIsSubmitting(true);

    try {
      // Mock file upload simulation
      if (form.evidence.length > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      const id = `E-${Math.floor(Math.random() * 900 + 100)}`;

      // Determine parties based on escrow type
      let from: string;
      let to: string;

      if (escrowType === "myself") {
        from = form.payer === "me" ? "@you" : form.counterparty;
        to = form.payer === "me" ? form.counterparty : "@you";
      } else {
        from = form.payerOther === "partyA" ? form.partyA : form.partyB;
        to = form.payerOther === "partyA" ? form.partyB : form.partyA;
      }

      // Replace the problematic line in the createEscrow function
      const next: ExtendedEscrow = {
        id,
        title: form.title,
        from,
        to,
        token: form.token === "custom" ? form.customTokenAddress : form.token,
        amount: Number(form.amount),
        status: "pending",
        deadline: deadline.toISOString().split("T")[0],
        type: form.type as "public" | "private",
        description: form.description,
        createdAt: Date.now(),
        escrowType: escrowType,
      };

      setEscrows((arr) => [next, ...arr]);
      setOpen(false);

      // Success message based on escrow type
      const successMessage =
        escrowType === "myself"
          ? `Escrow created between you and ${form.counterparty}`
          : `Escrow created between ${form.partyA} and ${form.partyB}`;

      toast.success("Escrow created successfully", {
        description: `${successMessage} • ${form.amount} ${form.token} • ${form.evidence.length} files uploaded`,
      });

      // Reset form
      setForm({
        title: "",
        type: "",
        counterparty: "",
        payer: "",
        partyA: "",
        partyB: "",
        payerOther: "",
        token: "",
        customTokenAddress: "",
        amount: "",
        description: "",
        evidence: [],
        milestones: [""],
      });
      setDeadline(null);
      setEscrowType("myself"); // Reset to default
    } catch (error) {
      toast.error("Failed to create escrow", {
        description: "Please try again later",
      });
      console.error("Failed to create escrow:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative">
      {/* Main */}
      <div className="absolute inset-0 -z-[50] bg-cyan-500/15 blur-3xl"></div>

      <div className="space-y-4">
        <div className="justify-between lg:flex">
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

            {/* Enhanced Modal */}
            {open && (
              <div
                onClick={() => setOpen(false)}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-2xl rounded-lg border border-white/10 bg-gradient-to-br from-cyan-500/10 p-6 shadow-xl"
                >
                  {/* Close button */}
                  <button
                    onClick={() => setOpen(false)}
                    className="absolute top-3 right-3 text-white/70 hover:text-white"
                  >
                    ✕
                  </button>

                  {/* Modal Header */}
                  <div className="mb-5 border-b border-white/10 pb-3">
                    <h2 className="text-lg font-semibold text-white/90">
                      Create New Escrow
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      Set up agreement details, funding, and milestones.
                    </p>
                  </div>

                  {/* Enhanced Form */}
                  <form
                    onSubmit={createEscrow}
                    className="max-h-[70vh] space-y-4 overflow-y-auto pr-1"
                  >
                    {/* Escrow Type Selection */}
                    <div>
                      <label className="text-muted-foreground mb-3 block text-sm font-semibold">
                        Who is this escrow for?{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => setEscrowType("myself")}
                          className={`flex flex-col items-center justify-center rounded-lg border-2 p-4 transition-all ${
                            escrowType === "myself"
                              ? "border-cyan-400 bg-cyan-500/20 text-cyan-200"
                              : "border-white/10 bg-white/5 text-white/70 hover:border-cyan-400/40"
                          }`}
                        >
                          <User className="mb-2 h-6 w-6" />
                          <span className="text-sm font-medium">
                            Myself & Counterparty
                          </span>
                          <span className="mt-1 text-xs opacity-70">
                            Escrow between you and someone else
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEscrowType("others")}
                          className={`flex flex-col items-center justify-center rounded-lg border-2 p-4 transition-all ${
                            escrowType === "others"
                              ? "border-cyan-400 bg-cyan-500/20 text-cyan-200"
                              : "border-white/10 bg-white/5 text-white/70 hover:border-cyan-400/40"
                          }`}
                        >
                          <Users className="mb-2 h-6 w-6" />
                          <span className="text-sm font-medium">
                            Two Other Parties
                          </span>
                          <span className="mt-1 text-xs opacity-70">
                            Escrow between two other users
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Title */}
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <label className="text-muted-foreground text-sm">
                          Title <span className="text-red-500">*</span>
                        </label>
                        <div className="group relative cursor-help">
                          <Info className="h-4 w-4 text-cyan-300" />
                          <div className="absolute top-full right-0 mt-2 hidden w-52 rounded-md bg-cyan-950/90 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                            A clear title helps both parties understand the
                            agreement scope.
                          </div>
                        </div>
                      </div>
                      <input
                        value={form.title}
                        onChange={(e) =>
                          setForm({ ...form, title: e.target.value })
                        }
                        className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none placeholder:text-sm placeholder:text-white/50 focus:border-cyan-400/40"
                        placeholder="e.g. Website Design & Development"
                        required
                      />
                    </div>

                    {/* Type and Payer */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Type Dropdown */}
                      <div
                        className="relative flex w-full flex-col gap-2"
                        ref={typeRef}
                      >
                        <label className="text-muted-foreground text-sm">
                          Type <span className="text-red-500">*</span>
                        </label>
                        <div
                          onClick={() => setIsTypeOpen((prev) => !prev)}
                          className="flex cursor-pointer items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-cyan-400/40"
                        >
                          <span>
                            {form.type
                              ? typeOptions.find((t) => t.value === form.type)
                                  ?.label
                              : "Select Type"}
                          </span>
                          <ChevronDown
                            className={`transition-transform ${
                              isTypeOpen ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                        {isTypeOpen && (
                          <div className="absolute top-[110%] z-50 w-full rounded-xl border border-white/10 bg-cyan-900/80 shadow-lg backdrop-blur-md">
                            {typeOptions.map((option) => (
                              <div
                                key={option.value}
                                onClick={() => {
                                  setForm({
                                    ...form,
                                    type: option.value as any,
                                  });
                                  setIsTypeOpen(false);
                                }}
                                className="cursor-pointer px-4 py-2 text-sm text-white/80 transition-colors hover:bg-cyan-500/30 hover:text-white"
                              >
                                {option.label}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Who Pays based on escrow type */}
                      {escrowType === "myself" ? (
                        <div>
                          <label className="text-muted-foreground mb-2 block text-sm">
                            Who Pays? <span className="text-red-500">*</span>
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {(["me", "counterparty"] as const).map((p) => (
                              <label
                                key={p}
                                className={`cursor-pointer rounded-md border px-2 py-3 text-center text-xs transition hover:border-cyan-400/40 ${
                                  form.payer === p
                                    ? "border-cyan-400/40 bg-cyan-500/30 text-cyan-200"
                                    : "border-white/10 bg-white/5 text-white/70"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="payer"
                                  className="hidden"
                                  checked={form.payer === p}
                                  onChange={() =>
                                    setForm({ ...form, payer: p })
                                  }
                                />
                                {p === "me" ? "Me" : "Counterparty"}
                              </label>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="text-muted-foreground mb-2 block text-sm">
                            Who Pays? <span className="text-red-500">*</span>
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {(["partyA", "partyB"] as const).map((p) => (
                              <label
                                key={p}
                                className={`cursor-pointer rounded-md border px-2 py-3 text-center text-xs transition hover:border-cyan-400/40 ${
                                  form.payerOther === p
                                    ? "border-cyan-400/40 bg-cyan-500/30 text-cyan-200"
                                    : "border-white/10 bg-white/5 text-white/70"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="payerOther"
                                  className="hidden"
                                  checked={form.payerOther === p}
                                  onChange={() =>
                                    setForm({ ...form, payerOther: p })
                                  }
                                />
                                {p === "partyA"
                                  ? "First Party"
                                  : "Second Party"}
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Parties based on escrow type */}
                    {escrowType === "myself" ? (
                      <div>
                        <label className="text-muted-foreground mb-2 block text-sm">
                          Counterparty <span className="text-red-500">*</span>
                        </label>
                        <input
                          value={form.counterparty}
                          onChange={(e) =>
                            setForm({ ...form, counterparty: e.target.value })
                          }
                          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none placeholder:text-sm placeholder:text-white/50 focus:border-cyan-400/40"
                          placeholder="@0xHandle or address"
                          required
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-muted-foreground mb-2 block text-sm">
                            First Party <span className="text-red-500">*</span>
                          </label>
                          <input
                            value={form.partyA}
                            onChange={(e) =>
                              setForm({ ...form, partyA: e.target.value })
                            }
                            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none placeholder:text-sm placeholder:text-white/50 focus:border-cyan-400/40"
                            placeholder="@0xHandle or address"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-muted-foreground mb-2 block text-sm">
                            Second Party <span className="text-red-500">*</span>
                          </label>
                          <input
                            value={form.partyB}
                            onChange={(e) =>
                              setForm({ ...form, partyB: e.target.value })
                            }
                            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none placeholder:text-sm placeholder:text-white/50 focus:border-cyan-400/40"
                            placeholder="@0xHandle or address"
                            required
                          />
                        </div>
                      </div>
                    )}

                    {/* Token and Amount */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Token Dropdown with Custom Option */}
                      <div
                        className="relative flex w-full flex-col gap-2"
                        ref={tokenRef}
                      >
                        <label className="text-muted-foreground text-sm">
                          Payment Token <span className="text-red-500">*</span>
                        </label>
                        <div
                          onClick={() => setIsTokenOpen((prev) => !prev)}
                          className="flex cursor-pointer items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-cyan-400/40"
                        >
                          <span>
                            {form.token
                              ? tokenOptions.find((t) => t.value === form.token)
                                  ?.label
                              : "Select Token"}
                          </span>
                          <ChevronDown
                            className={`transition-transform ${
                              isTokenOpen ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                        {isTokenOpen && (
                          <div className="absolute top-[110%] z-50 w-full rounded-xl border border-white/10 bg-cyan-900/80 shadow-lg backdrop-blur-md">
                            {tokenOptions.map((option) => (
                              <div
                                key={option.value}
                                onClick={() => {
                                  setForm({
                                    ...form,
                                    token: option.value,
                                    customTokenAddress:
                                      option.value === "custom"
                                        ? form.customTokenAddress
                                        : "",
                                  });
                                  setIsTokenOpen(false);
                                }}
                                className="cursor-pointer px-4 py-2 text-sm text-white/80 transition-colors hover:bg-cyan-500/30 hover:text-white"
                              >
                                {option.label}
                              </div>
                            ))}
                          </div>
                        )}
                        {form.token === "custom" && (
                          <div className="mt-3">
                            <label className="text-muted-foreground mb-2 block text-sm">
                              Paste Contract Address{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={form.customTokenAddress}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  customTokenAddress: e.target.value,
                                })
                              }
                              placeholder="0x..."
                              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none placeholder:text-white/50 focus:border-cyan-400/40"
                              required
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="text-muted-foreground mb-2 block text-sm">
                          Amount <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={form.amount}
                          onChange={(e) =>
                            setForm({ ...form, amount: e.target.value })
                          }
                          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none placeholder:text-sm placeholder:text-white/50 focus:border-cyan-400/40"
                          placeholder="1000"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="text-muted-foreground mb-2 block text-sm">
                        Detailed Description{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={form.description}
                        onChange={(e) =>
                          setForm({ ...form, description: e.target.value })
                        }
                        className="min-h-28 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none placeholder:text-sm placeholder:text-white/50 focus:border-cyan-400/40"
                        placeholder="Describe deliverables, expectations, and terms"
                        required
                      />
                    </div>

                    {/* Enhanced Evidence Upload Section */}
                    <div>
                      <label className="text-muted-foreground mb-2 block text-sm">
                        Supporting Documents
                      </label>

                      {/* Drag and Drop Area */}
                      <div
                        className={`group relative cursor-pointer rounded-md border border-dashed transition-colors ${
                          isDragOver
                            ? "border-cyan-400/60 bg-cyan-500/20"
                            : "border-white/15 bg-white/5 hover:border-cyan-400/40"
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                      >
                        <input
                          onChange={handleFileSelect}
                          type="file"
                          multiple
                          accept="image/*,.pdf,.doc,.docx,.txt"
                          className="hidden"
                          id="escrow-upload"
                        />
                        <label
                          htmlFor="escrow-upload"
                          className="flex cursor-pointer flex-col items-center justify-center px-4 py-8 text-center"
                        >
                          <Upload className="mb-3 h-8 w-8 text-cyan-400" />
                          <div className="text-sm text-cyan-300">
                            {isDragOver
                              ? "Drop files here"
                              : "Click to upload or drag and drop"}
                          </div>
                          <div className="text-muted-foreground mt-1 text-xs">
                            Supports images, PDFs, and documents
                          </div>
                        </label>
                      </div>

                      {/* File List with Previews */}
                      {form.evidence.length > 0 && (
                        <div className="mt-4 space-y-3">
                          <h4 className="text-sm font-medium text-cyan-200">
                            Selected Files ({form.evidence.length})
                          </h4>
                          {form.evidence.map((file) => (
                            <div
                              key={file.id}
                              className="flex items-center justify-between rounded-lg border border-cyan-400/20 bg-cyan-500/5 p-3"
                            >
                              <div className="flex items-center gap-3">
                                {file.type === "image" && file.preview ? (
                                  <img
                                    src={file.preview}
                                    alt={file.file.name}
                                    className="h-10 w-10 rounded object-cover"
                                  />
                                ) : (
                                  <Paperclip className="h-5 w-5 text-cyan-400" />
                                )}
                                <div>
                                  <div className="text-sm font-medium text-white">
                                    {file.file.name}
                                  </div>
                                  <div className="text-xs text-cyan-200/70">
                                    {file.size} • {file.type}
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(file.id)}
                                className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Deadline with React DatePicker */}
                    <div>
                      <label className="text-muted-foreground mb-2 block text-sm">
                        Deadline <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
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
                          required
                        />
                      </div>
                    </div>

                    {/* Buttons */}
                    <div className="mt-6 flex justify-end gap-3 border-t border-white/10 pt-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/10"
                        onClick={() => {
                          toast.message("Draft saved", {
                            description: "Your escrow has been saved as draft",
                          });
                          setOpen(false);
                        }}
                        disabled={isSubmitting}
                      >
                        Save Draft
                      </Button>
                      <Button
                        type="submit"
                        variant="neon"
                        className="neon-hover"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Paperclip className="mr-2 h-4 w-4" />
                            Create Escrow
                          </>
                        )}
                      </Button>
                    </div>
                  </form>

                  {/* Conditional note */}
                  {escrowType === "myself" && form.payer === "me" ? (
                    <p className="text-muted-foreground mt-4 text-xs">
                      After signing, you will be prompted to deposit{" "}
                      <span className="text-cyan-300">
                        {form.amount || "amount"} {form.token}
                      </span>{" "}
                      to activate this escrow.
                    </p>
                  ) : escrowType === "myself" &&
                    form.payer === "counterparty" ? (
                    <p className="text-muted-foreground mt-4 text-xs">
                      Counterparty will be notified to deposit funds. You can
                      sign immediately.
                    </p>
                  ) : escrowType === "others" ? (
                    <p className="text-muted-foreground mt-4 text-xs">
                      {form.payerOther === "partyA" ? form.partyA : form.partyB}{" "}
                      will be notified to deposit funds. Both parties can sign
                      immediately.
                    </p>
                  ) : null}
                </div>
              </div>
            )}

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative grow sm:max-w-xs">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-cyan-300" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search escrows by title, party, or description"
                  className="placeholder:text-muted-foreground w-full rounded-md border border-white/10 bg-white/5 py-2 pr-3 pl-9 text-sm text-white ring-0 outline-none focus:border-cyan-400/40"
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
            <div className="mt-4 rounded-xl border border-b-2 border-white/10 px-4 py-2 ring-1 ring-white/10 lg:mt-0">
              <div className="mb-3 text-sm font-semibold text-white/90">
                Filter
              </div>
              <Tabs value={statusTab} onValueChange={setStatusTab}>
                <TabsList className="flex flex-wrap gap-1 bg-white/5">
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="disputed">Disputed</TabsTrigger>
                </TabsList>
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
                          ) : e.status === "frozen" ||
                            e.status === "disputed" ? (
                            <span className="badge badge-red">Disputed</span>
                          ) : e.status === "cancelled" ? (
                            <span className="badge badge-gray">Cancelled</span>
                          ) : e.status === "active" ? (
                            <span className="badge badge-yellow">Active</span>
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
                  <Link to={`/escrow/${e.id}`}>
                    <Button
                      variant="outline"
                      className="border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/10"
                    >
                      <Eye className="mr-2 h-4 w-4" /> View
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
