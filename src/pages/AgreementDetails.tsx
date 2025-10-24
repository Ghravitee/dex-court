/* eslint-disable @typescript-eslint/no-explicit-any */
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
  Eye,
  EyeOff,
  Globe,
  Lock,
  Image,
  Paperclip,
  Upload,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { agreementService } from "../services/agreementServices";
import type { Agreement } from "../types";
import { toast } from "sonner";
import { UserAvatar } from "../components/UserAvatar";

// API Enum Mappings
const AgreementVisibilityEnum = {
  PRIVATE: 1,
  PUBLIC: 2,
  AUTO_PUBLIC: 3,
} as const;

const AgreementStatusEnum = {
  PENDING_ACCEPTANCE: 1,
  ACTIVE: 2,
  COMPLETED: 3,
  DISPUTED: 4,
  CANCELLED: 5,
  EXPIRED: 6,
} as const;

// Helper function to convert API status to frontend status
const apiStatusToFrontend = (status: number): Agreement["status"] => {
  switch (status) {
    case AgreementStatusEnum.PENDING_ACCEPTANCE:
      return "pending";
    case AgreementStatusEnum.ACTIVE:
      return "signed";
    case AgreementStatusEnum.COMPLETED:
      return "completed";
    case AgreementStatusEnum.DISPUTED:
      return "disputed";
    case AgreementStatusEnum.CANCELLED:
    case AgreementStatusEnum.EXPIRED:
      return "cancelled";
    default:
      return "pending";
  }
};

export default function AgreementDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEscrowAddress, setShowEscrowAddress] = useState(false);

  // In AgreementDetails.tsx - Update the useEffect data transformation
  useEffect(() => {
    const fetchAgreement = async () => {
      setLoading(true);
      try {
        if (!id) {
          throw new Error("No agreement ID provided");
        }

        const agreementId = parseInt(id);
        const response =
          await agreementService.getAgreementDetails(agreementId);
        const agreementData = response.data;

        console.log("📋 AgreementDetails API Response:", agreementData);

        // Helper function to extract avatar ID from party data and convert to number
        const getAvatarIdFromParty = (party: any): number | null => {
          const avatarId = party?.avatarId || party?.avatar?.id;
          // Convert to number if it exists, otherwise return null
          return avatarId ? Number(avatarId) : null;
        };

        // Helper function to get username from party data
        const getUsernameFromParty = (party: any) => {
          return party?.username || party?.handle || "Unknown";
        };

        // Helper function to get user ID from party data
        const getUserIdFromParty = (party: any) => {
          return party?.id?.toString();
        };

        const firstPartyUsername = getUsernameFromParty(
          agreementData.firstParty,
        );
        const counterPartyUsername = getUsernameFromParty(
          agreementData.counterParty,
        );
        const creatorUsername = getUsernameFromParty(agreementData.creator);

        console.log("🔄 Party mapping:", {
          firstParty: firstPartyUsername,
          counterParty: counterPartyUsername,
          creator: creatorUsername,
          agreementType: agreementData.type,
        });

        // Transform API data to frontend format
        const transformedAgreement: Agreement = {
          id: agreementData.id.toString(),
          title: agreementData.title,
          description: agreementData.description,
          type:
            agreementData.visibility === AgreementVisibilityEnum.PRIVATE
              ? "Private"
              : "Public",
          // 🚨 CRITICAL: Use the actual parties, not the creator
          counterparty: counterPartyUsername,
          createdBy: firstPartyUsername, // Show first party as "createdBy" for consistency
          status: apiStatusToFrontend(agreementData.status),
          dateCreated: agreementData.createdAt,
          deadline: agreementData.deadline,
          amount: agreementData.amount
            ? agreementData.amount.toString()
            : undefined,
          token: agreementData.tokenSymbol || undefined,
          includeFunds: agreementData.type === 2 ? "yes" : "no",
          useEscrow: agreementData.type === 2,
          escrowAddress: agreementData.escrowContract || undefined,
          files: agreementData.files?.length || 0,
          images: agreementData.files?.map((file) => file.fileName) || [],

          // 🚨 CRITICAL FIX: Use actual parties' avatars for the agreement parties
          createdByAvatarId: getAvatarIdFromParty(agreementData.firstParty),
          counterpartyAvatarId: getAvatarIdFromParty(
            agreementData.counterParty,
          ),
          createdByUserId: getUserIdFromParty(agreementData.firstParty),
          counterpartyUserId: getUserIdFromParty(agreementData.counterParty),

          // 🚨 CRITICAL FIX: Add creator information separately with avatar
          creator: creatorUsername,
          creatorUserId: getUserIdFromParty(agreementData.creator),
          creatorAvatarId: getAvatarIdFromParty(agreementData.creator), // Add creator avatar ID
        };

        console.log("✅ Transformed Agreement:", {
          parties: `${transformedAgreement.createdBy} ↔ ${transformedAgreement.counterparty}`,
          creator: transformedAgreement.creator,
          creatorAvatarId: transformedAgreement.creatorAvatarId,
          firstPartyAvatarId: transformedAgreement.createdByAvatarId,
        });

        setAgreement(transformedAgreement);
      } catch (error) {
        console.error("Failed to fetch agreement:", error);
        toast.error("Failed to load agreement details");
        setAgreement(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAgreement();
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleSignAgreement = async () => {
    if (!id || !agreement) return;

    try {
      const agreementId = parseInt(id);
      await agreementService.signAgreement(agreementId, true);

      // Refresh agreement data
      const response = await agreementService.getAgreementDetails(agreementId);
      const updatedAgreementData = response.data;

      const updatedAgreement: Agreement = {
        ...agreement,
        status: apiStatusToFrontend(updatedAgreementData.status),
      };

      setAgreement(updatedAgreement);

      // Show success message
      alert("Agreement signed successfully!");
    } catch (error) {
      console.error("Failed to sign agreement:", error);
      alert("Failed to sign agreement. Please try again.");
    }
  };

  const handleDownloadFile = async (fileId: number) => {
    if (!id) return;

    try {
      const agreementId = parseInt(id);
      await agreementService.downloadFile(agreementId, fileId);
      // Note: The download endpoint should return the file blob
      // You might need to handle the file download response appropriately
    } catch (error) {
      console.error("Failed to download file:", error);
      alert("Failed to download file. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center">
        <div className="absolute inset-0 z-[50] rounded-full bg-cyan-500/10 blur-3xl"></div>
        <div className="text-center">
          {/* Pulsing gradient ring */}
          <div className="relative mx-auto mb-8">
            <div className="mx-auto size-32 animate-spin rounded-full border-4 border-cyan-400/30 border-t-cyan-400"></div>
            <div className="absolute inset-0 mx-auto size-32 animate-ping rounded-full border-2 border-cyan-400/40"></div>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-cyan-300">
              Loading Agreement
            </h3>
            <p className="text-sm text-cyan-200/70">
              Preparing your agreement details...
            </p>
          </div>

          {/* Progress dots */}
          <div className="mt-4 flex justify-center space-x-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-2 w-2 animate-bounce rounded-full bg-cyan-400/60"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!agreement) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-cyan-900/20 to-purple-900/20">
        <div className="text-center">
          <div className="mb-4 text-lg text-white">Agreement not found</div>
          <Button
            onClick={() => navigate("/agreements")}
            className="border-white/15 text-cyan-200 hover:bg-cyan-500/10"
          >
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
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Agreement Overview Card */}
            <div className="glass rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-6">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h1 className="mb-2 text-3xl font-bold text-white">
                    {agreement.title}
                  </h1>
                  <div className="flex items-center space-x-2 text-cyan-300">
                    {agreement.type === "Public" ? (
                      <>
                        <Globe className="h-4 w-4" />
                        <span>Public Agreement</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        <span>Private Agreement</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm text-cyan-300">Created by</div>
                  <div className="flex items-center justify-end gap-2 font-medium text-white">
                    <UserAvatar
                      userId={
                        agreement.creatorUserId || agreement.creator || ""
                      }
                      avatarId={agreement.creatorAvatarId || null}
                      username={agreement.creator || ""}
                      size="sm"
                    />

                    <button
                      onClick={() => {
                        const cleanUsername = (agreement.creator || "").replace(
                          /^@/,
                          "",
                        );
                        navigate(`/profile/${cleanUsername}`);
                      }}
                      className="text-cyan-300 hover:text-cyan-200 hover:underline"
                    >
                      {agreement.creator}
                    </button>
                  </div>
                </div>
              </div>

              {/* Key Details Grid */}
              <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-cyan-400" />
                    <div>
                      <div className="text-sm text-cyan-300">Parties</div>
                      <div className="flex items-center gap-2 text-white">
                        <div className="flex items-center gap-1">
                          <UserAvatar
                            userId={
                              agreement.createdByUserId || agreement.createdBy
                            }
                            avatarId={agreement.createdByAvatarId || null}
                            username={agreement.createdBy}
                            size="sm"
                          />
                          <button
                            onClick={() => {
                              const cleanUsername = agreement.createdBy.replace(
                                /^@/,
                                "",
                              );
                              const encodedUsername =
                                encodeURIComponent(cleanUsername);
                              navigate(`/profile/${encodedUsername}`);
                            }}
                            className="text-cyan-300 hover:text-cyan-200 hover:underline"
                          >
                            {agreement.createdBy}
                          </button>
                        </div>
                        <span className="text-cyan-400">↔</span>
                        <div className="flex items-center gap-1">
                          <UserAvatar
                            userId={
                              agreement.counterpartyUserId ||
                              agreement.counterparty
                            }
                            avatarId={agreement.counterpartyAvatarId || null}
                            username={agreement.counterparty}
                            size="sm"
                          />
                          <button
                            onClick={() => {
                              const cleanUsername =
                                agreement.counterparty.replace(/^@/, "");
                              const encodedUsername =
                                encodeURIComponent(cleanUsername);
                              navigate(`/profile/${encodedUsername}`);
                            }}
                            className="text-cyan-300 hover:text-cyan-200 hover:underline"
                          >
                            {agreement.counterparty}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-purple-400" />
                    <div>
                      <div className="text-sm text-cyan-300">Date Created</div>
                      <div className="text-white">
                        {formatDate(agreement.dateCreated)}
                      </div>
                    </div>
                  </div>
                  {agreement.includeFunds === "yes" && (
                    <div className="flex items-center space-x-3">
                      <DollarSign className="h-5 w-5 text-emerald-400" />
                      <div>
                        <div className="text-sm text-cyan-300">Amount</div>
                        <div className="text-white">
                          {agreement.amount} {agreement.token}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-yellow-400" />
                    <div>
                      <div className="text-sm text-cyan-300">Deadline</div>
                      <div className="text-white">
                        {formatDate(agreement.deadline)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-blue-400" />
                    <div>
                      <div className="text-sm text-cyan-300">
                        Agreement Type
                      </div>
                      <div className="text-white">{agreement.type}</div>
                    </div>
                  </div>

                  {agreement.includeFunds === "yes" && (
                    <div className="flex items-center space-x-3">
                      <Shield className="h-5 w-5 text-cyan-400" />
                      <div>
                        <div className="text-sm text-cyan-300">Escrow</div>
                        <div className="text-white">
                          {agreement.useEscrow ? "Enabled" : "Not Used"}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="mb-3 text-lg font-semibold text-white">
                  Description & Scope
                </h3>
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <p className="leading-relaxed whitespace-pre-line text-white/80">
                    {agreement.description}
                  </p>
                </div>
              </div>

              {/* Attached Files */}
              {agreement.images && agreement.images.length > 0 && (
                <div className="mb-6">
                  <h3 className="mb-3 text-lg font-semibold text-white">
                    Supporting Documents
                  </h3>
                  <div className="space-y-2">
                    {agreement.images.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-3 rounded-lg border border-white/10 bg-white/5 p-3"
                      >
                        {file.toLowerCase().endsWith(".pdf") ? (
                          <FileText className="h-5 w-5 text-red-400" />
                        ) : /\.(jpg|jpeg|png|gif|webp)$/i.test(file) ? (
                          <Image className="h-5 w-5 text-green-400" />
                        ) : (
                          <Paperclip className="h-5 w-5 text-cyan-400" />
                        )}
                        <span className="flex-1 text-white">{file}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-white/15 text-cyan-200 hover:bg-cyan-500/10"
                          onClick={() => handleDownloadFile(index)}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Financial Details */}
              {agreement.includeFunds === "yes" && (
                <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-4">
                  <h3 className="mb-3 text-lg font-semibold text-emerald-300">
                    Financial Details
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <div className="text-sm text-emerald-300">
                        Funds Included
                      </div>
                      <div className="text-lg font-semibold text-white">
                        Yes
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-emerald-300">Amount</div>
                      <div className="text-lg font-semibold text-white">
                        {agreement.amount} {agreement.token}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-emerald-300">
                        Escrow Protection
                      </div>
                      <div className="text-lg font-semibold text-white">
                        {agreement.useEscrow ? "Enabled" : "Not Used"}
                      </div>
                    </div>
                    {agreement.useEscrow && agreement.escrowAddress && (
                      <div className="md:col-span-2">
                        <div className="mb-2 text-sm text-emerald-300">
                          Escrow Contract
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 rounded bg-black/20 px-2 py-1 font-mono text-sm break-all text-white">
                            {showEscrowAddress
                              ? agreement.escrowAddress
                              : `${agreement.escrowAddress.slice(0, 10)}...${agreement.escrowAddress.slice(-8)}`}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setShowEscrowAddress(!showEscrowAddress)
                            }
                            className="border-white/15 text-cyan-200 hover:bg-cyan-500/10"
                          >
                            {showEscrowAddress ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Activity Timeline */}
            <div className="glass rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-6">
              <h3 className="mb-6 text-lg font-semibold text-white">
                Agreement Timeline
              </h3>

              <div className="flex items-start space-x-8 overflow-x-auto pb-4">
                {/* Step 1 - Agreement Created */}
                <div className="relative flex min-w-[10rem] flex-col items-center text-center">
                  <div className="z-10 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-400"></div>
                  <div className="mt-3 font-medium text-white">
                    Agreement Created
                  </div>
                  <div className="text-sm text-cyan-300">
                    {formatDate(agreement.dateCreated)}
                  </div>
                  <div className="mt-1 text-xs text-cyan-400/70">
                    <div className="flex items-center gap-2">
                      {" "}
                      <UserAvatar
                        userId={
                          agreement.creatorUserId || agreement.creator || ""
                        }
                        avatarId={agreement.creatorAvatarId || null}
                        username={agreement.creator || ""}
                        size="sm"
                      />
                      {agreement.creator}
                    </div>
                  </div>
                  <div className="absolute top-2 left-[calc(100%+0.5rem)] h-[2px] w-8 bg-cyan-400/50"></div>
                </div>

                {/* Step 2 - Based on Status */}
                {["signed", "completed", "disputed"].includes(
                  agreement.status,
                ) && (
                  <div className="relative flex min-w-[10rem] flex-col items-center text-center">
                    <div className="z-10 flex h-4 w-4 items-center justify-center rounded-full bg-green-400"></div>
                    <div className="mt-3 font-medium text-white">
                      Agreement Signed
                    </div>
                    <div className="text-sm text-cyan-300">
                      {formatDate(agreement.dateCreated)}
                    </div>
                    <div className="mt-1 text-xs text-cyan-400/70">
                      by both parties
                    </div>
                    <div className="absolute top-2 left-[calc(100%+0.5rem)] h-[2px] w-8 bg-green-400/50"></div>
                  </div>
                )}

                {/* Step 3 - Completed or Disputed */}
                {agreement.status === "completed" && (
                  <div className="relative flex min-w-[10rem] flex-col items-center text-center">
                    <div className="z-10 flex h-4 w-4 items-center justify-center rounded-full bg-green-400"></div>
                    <div className="mt-3 font-medium text-white">
                      Work Completed
                    </div>
                    <div className="text-sm text-cyan-300">
                      {formatDate(agreement.deadline)}
                    </div>
                    <div className="absolute top-2 left-[calc(100%+0.5rem)] h-[2px] w-8 bg-green-400/50"></div>
                  </div>
                )}

                {agreement.status === "disputed" && (
                  <div className="relative flex min-w-[10rem] flex-col items-center text-center">
                    <div className="z-10 flex h-4 w-4 items-center justify-center rounded-full bg-purple-400"></div>
                    <div className="mt-3 font-medium text-white">
                      Dispute Filed
                    </div>
                    <div className="text-sm text-cyan-300">Recently</div>
                    <div className="mt-1 text-xs text-purple-400/70">
                      Under review
                    </div>
                  </div>
                )}

                {/* Final Step */}
                {agreement.status === "completed" && (
                  <div className="relative flex min-w-[10rem] flex-col items-center text-center">
                    <div className="z-10 flex h-4 w-4 items-center justify-center rounded-full bg-green-400"></div>
                    <div className="mt-3 font-medium text-white">
                      Payment Released
                    </div>
                    <div className="text-sm text-cyan-300">
                      {formatDate(agreement.deadline)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Agreement Summary */}
            <div className="glass rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-6">
              <h3 className="mb-4 text-lg font-semibold text-white">
                Agreement Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-cyan-300">Agreement ID</span>
                  <span className="text-white">#{agreement.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-300">Type</span>
                  <span className="text-white">{agreement.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-300">Visibility</span>
                  <span className="text-white">
                    {agreement.type === "Public" ? "Public" : "Private"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-300">Status</span>
                  <span
                    className={`font-medium ${getStatusColor(agreement.status)} rounded px-2 py-1 text-xs`}
                  >
                    {agreement.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-300">Files Attached</span>
                  <span className="text-white">
                    {agreement.images?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-300">Funds Involved</span>
                  <span className="text-white">
                    {agreement.includeFunds === "yes" ? "Yes" : "No"}
                  </span>
                </div>
                {agreement.includeFunds === "yes" && (
                  <div className="flex justify-between">
                    <span className="text-cyan-300">Escrow Used</span>
                    <span className="text-white">
                      {agreement.useEscrow ? "Yes" : "No"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions Panel */}
            <div className="glass rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-6">
              <h3 className="mb-4 text-lg font-semibold text-white">Actions</h3>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full border-white/15 text-cyan-200 hover:bg-cyan-500/10"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Download Agreement
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-white/15 text-cyan-200 hover:bg-cyan-500/10"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Share Agreement
                </Button>
                {agreement.status === "pending" && (
                  <Button
                    variant="neon"
                    className="neon-hover w-full"
                    onClick={handleSignAgreement}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Sign Agreement
                  </Button>
                )}
                {agreement.status === "disputed" && (
                  <Button
                    variant="outline"
                    className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    View Dispute
                  </Button>
                )}
                {agreement.useEscrow && agreement.escrowAddress && (
                  <Button
                    variant="outline"
                    className="w-full border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    View Escrow
                  </Button>
                )}
              </div>
            </div>

            {/* Contract Information */}
            <div className="glass rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-6">
              <h3 className="mb-4 text-lg font-semibold text-white">
                Contract Info
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-cyan-300">Created</span>
                  <span className="text-white">
                    {formatDate(agreement.dateCreated)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-300">Expires</span>
                  <span className="text-white">
                    {formatDate(agreement.deadline)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
