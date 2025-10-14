import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Calendar,
  Users,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Shield,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { fetchAgreementById } from "../lib/mockApi";
import type { Agreement } from "../types";

export default function AgreementDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock data - replace with actual API call
  // Replace the useEffect with:
  useEffect(() => {
    const fetchAgreement = async () => {
      setLoading(true);
      try {
        const agreementData = await fetchAgreementById(parseInt(id || "0"));
        setAgreement(agreementData || null);
      } catch (error) {
        console.error("Failed to fetch agreement:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAgreement();
    }
  }, [id]);

  const getStatusIcon = (status: Agreement["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-400" />;
      case "signed":
        return <FileText className="h-5 w-5 text-blue-400" />;
      case "cancelled":
        return <XCircle className="h-5 w-5 text-red-400" />;
      case "disputed":
        return <AlertTriangle className="h-5 w-5 text-purple-400" />;
      default:
        return <FileText className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: Agreement["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "signed":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "cancelled":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "disputed":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-cyan-900/20 to-purple-900/20">
        <div className="text-lg text-white">Loading agreement details...</div>
      </div>
    );
  }

  if (!agreement) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-cyan-900/20 to-purple-900/20">
        <div className="text-center">
          <div className="mb-4 text-lg text-white">Agreement not found</div>
          <Button onClick={() => navigate("/agreements")}>
            Back to Agreements
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate("/agreements")}
              className="border-white/15 text-cyan-200 hover:bg-cyan-500/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Agreements
            </Button>
            <div className="flex items-center space-x-2">
              {getStatusIcon(agreement.status)}
              <span
                className={`rounded-full border px-3 py-1 text-sm font-medium ${getStatusColor(agreement.status)}`}
              >
                {agreement.status.charAt(0).toUpperCase() +
                  agreement.status.slice(1)}
              </span>
            </div>
          </div>

          {/* <div className="flex space-x-3">
            <Button
              variant="outline"
              className="border-white/15 text-cyan-200 hover:bg-cyan-500/10"
            >
              Export PDF
            </Button>
            {agreement.status === "pending" && (
              <Button variant="neon" className="neon-hover">
                Sign Agreement
              </Button>
            )}
          </div> */}
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Agreement Card */}
            <div className="glass rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-6">
              <div className="mb-6 flex items-start justify-between">
                <h1 className="text-3xl font-bold text-white">
                  {agreement.title}
                </h1>
                <div className="text-right">
                  <div className="text-sm text-cyan-300">Created by</div>
                  <div className="font-medium text-white">
                    {agreement.createdBy}
                  </div>
                </div>
              </div>

              <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-cyan-400" />
                    <div>
                      <div className="text-sm text-cyan-300">Parties</div>
                      <div className="text-white">
                        {agreement.createdBy} ↔ {agreement.counterparty}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <DollarSign className="h-5 w-5 text-emerald-400" />
                    <div>
                      <div className="text-sm text-cyan-300">Amount</div>
                      <div className="text-white">
                        {agreement.amount} {agreement.token}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-purple-400" />
                    <div>
                      <div className="text-sm text-cyan-300">Date Created</div>
                      <div className="text-white">{agreement.dateCreated}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-yellow-400" />
                    <div>
                      <div className="text-sm text-cyan-300">Deadline</div>
                      <div className="text-white">{agreement.deadline}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="mb-3 text-lg font-semibold text-white">
                  Description
                </h3>
                <p className="leading-relaxed text-white/80">
                  {agreement.description}
                </p>
              </div>

              {/* Terms */}
            </div>

            {/* Activity Timeline */}
            <div className="glass rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-6">
              <h3 className="mb-6 text-lg font-semibold text-white">
                Activity Timeline
              </h3>

              <div className="flex items-start space-x-8 overflow-x-auto pb-4">
                {/* Step 1 */}
                <div className="relative flex min-w-[10rem] flex-col items-center text-center">
                  <div className="z-10 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-400"></div>
                  <div className="mt-3 font-medium text-white">
                    Agreement Created
                  </div>
                  <div className="text-sm text-cyan-300">
                    {agreement.dateCreated} by {agreement.createdBy}
                  </div>

                  {/* Connecting Line */}
                  <div className="absolute top-2 left-[calc(100%+0.5rem)] h-[2px] w-8 bg-cyan-400/50 last:hidden"></div>
                </div>

                {/* Conditionally Rendered Steps */}
                {agreement.status === "completed" && (
                  <>
                    {/* Step 2 */}
                    <div className="relative flex min-w-[10rem] flex-col items-center text-center">
                      <div className="z-10 flex h-4 w-4 items-center justify-center rounded-full bg-green-400"></div>
                      <div className="mt-3 font-medium text-white">
                        Agreement Signed
                      </div>
                      <div className="text-sm text-cyan-300">
                        2025-09-25 by both parties
                      </div>
                      <div className="absolute top-2 left-[calc(100%+0.5rem)] h-[2px] w-8 bg-green-400/50 last:hidden"></div>
                    </div>

                    {/* Step 3 */}
                    <div className="relative flex min-w-[10rem] flex-col items-center text-center">
                      <div className="z-10 flex h-4 w-4 items-center justify-center rounded-full bg-green-400"></div>
                      <div className="mt-3 font-medium text-white">
                        Work Completed
                      </div>
                      <div className="text-sm text-cyan-300">2025-10-30</div>
                      <div className="absolute top-2 left-[calc(100%+0.5rem)] h-[2px] w-8 bg-green-400/50 last:hidden"></div>
                    </div>

                    {/* Step 4 */}
                    <div className="relative flex min-w-[10rem] flex-col items-center text-center">
                      <div className="z-10 flex h-4 w-4 items-center justify-center rounded-full bg-green-400"></div>
                      <div className="mt-3 font-medium text-white">
                        Payment Released
                      </div>
                      <div className="text-sm text-cyan-300">2025-10-31</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Escrow Information */}
            {agreement.useEscrow && (
              <div className="glass rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-6">
                <div className="mb-4 flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-cyan-400" />
                  <h3 className="text-lg font-semibold text-white">
                    Escrow Details
                  </h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-cyan-300">Escrow Contract</div>
                    <div className="font-mono text-sm break-all text-white">
                      {agreement.escrowAddress}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-cyan-300">Amount Locked</div>
                    <div className="text-white">
                      {agreement.amount} {agreement.token}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full border-white/15 text-cyan-200 hover:bg-cyan-500/10"
                  >
                    View on Explorer
                  </Button>
                </div>
              </div>
            )}

            {/* Actions Panel */}
            <div className="glass rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-6">
              <h3 className="mb-4 text-lg font-semibold text-white">Actions</h3>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full border-white/15 text-cyan-200 hover:bg-cyan-500/10"
                >
                  Download Agreement
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-white/15 text-cyan-200 hover:bg-cyan-500/10"
                >
                  Share Agreement
                </Button>
                {agreement.status === "pending" && (
                  <Button variant="neon" className="neon-hover w-full">
                    Sign Agreement
                  </Button>
                )}
                {agreement.status === "disputed" && (
                  <Button
                    variant="outline"
                    className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    View Dispute
                  </Button>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="glass rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-6">
              <h3 className="mb-4 text-lg font-semibold text-white">
                Agreement Info
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-cyan-300">Agreement ID</span>
                  <span className="text-white">#{agreement.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-300">Type</span>
                  <span className="text-white">Smart Contract</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-300">Network</span>
                  <span className="text-white">Ethereum</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-300">Version</span>
                  <span className="text-white">v2.1</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
