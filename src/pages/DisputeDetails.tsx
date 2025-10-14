import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Users, FileText, Scale } from "lucide-react";
import { Button } from "../components/ui/button";
import { getDisputeById } from "../lib/mockDisputes";
import type { DisputeRow } from "../lib/mockDisputes";

export default function DisputeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dispute, setDispute] = useState<DisputeRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    getDisputeById(id)
      .then((data) => {
        setDispute(data || null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="text-muted-foreground flex h-[80vh] items-center justify-center">
        Loading dispute details...
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="p-6 text-white">
        <Button
          onClick={() => navigate("/disputes")}
          variant="ghost"
          className="mb-4 flex items-center gap-2 text-cyan-400 hover:text-cyan-300"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Disputes
        </Button>
        <p className="text-red-400">Dispute not found.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-6 text-white"
    >
      {/* Back Button */}
      <Button
        onClick={() => navigate("/disputes")}
        variant="ghost"
        className="mb-6 flex items-center gap-2 text-cyan-400 hover:text-cyan-300"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Disputes
      </Button>

      {/* Dispute Info Card */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg">
        <h1 className="mb-4 text-2xl font-bold text-cyan-400">
          {dispute.title}
        </h1>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-cyan-400" />
            <span>
              Created: {new Date(dispute.createdAt).toLocaleDateString()}
            </span>
          </div>

          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-cyan-400" />
            <span>Request Type: {dispute.request}</span>
          </div>

          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-cyan-400" />
            <span>Parties: {dispute.parties}</span>
          </div>

          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Scale className="h-4 w-4 text-cyan-400" />
            <span>Status: {dispute.status}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="my-6 border-t border-white/10" />

        {/* Description / Notes placeholder */}
        <p className="text-muted-foreground text-sm">
          This dispute was initiated on{" "}
          <span className="text-cyan-300">{dispute.createdAt}</span> and is
          currently marked as{" "}
          <span className="font-medium text-cyan-300">{dispute.status}</span>.
          You can view arbitration history, evidence, and voting progress here
          (to be integrated later).
        </p>
      </div>
    </motion.div>
  );
}
