/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type { DisputeRow } from "../../../types";
import { disputeService } from "../../../services/disputeServices";
import { agreementService } from "../../../services/agreementServices";
import { getAgreement } from "../../../web3/readContract";

export function useDisputeData(id: string | undefined) {
  const [dispute, setDispute] = useState<DisputeRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [onChainAgreement, setOnChainAgreement] = useState<any | null>(null);
  const [onChainLoading, setOnChainLoading] = useState(false);
  const [escrowContractAddress, setEscrowContractAddress] = useState<
    `0x${string}` | null
  >(null);

  const fetchOnChainAgreement = useCallback(
    async (agreementData: any, escrowAddress?: `0x${string}`) => {
      if (!agreementData) return;
      try {
        const res = await getAgreement(
          escrowAddress as `0x${string}`,
          agreementData.chainId,
          BigInt(agreementData.contractAgreementId),
        );
        setOnChainAgreement(res);
      } catch (err) {
        console.error("Failed to fetch on-chain agreement:", err);
        setOnChainAgreement(null);
      } finally {
        setOnChainLoading(false);
      }
    },
    [],
  );

  const refreshDispute = useCallback(async (disputeId: number) => {
    const details = await disputeService.getDisputeDetails(disputeId);
    const transformed = disputeService.transformDisputeDetailsToRow(details);
    setDispute(transformed);
    return transformed;
  }, []);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const disputeId = parseInt(id);
    if (isNaN(disputeId)) {
      toast.error("Invalid dispute ID");
      setLoading(false);
      return;
    }

    setLoading(true);

    const fetch = async () => {
      try {
        const disputeDetails =
          await disputeService.getDisputeDetails(disputeId);
        const transformed =
          disputeService.transformDisputeDetailsToRow(disputeDetails);
        setDispute(transformed);

        if (transformed.agreement?.type === 2) {
          const agreementData = await agreementService.getAgreementDetails(
            transformed.agreement.id,
          );
          const escrowAddress = agreementData.escrowContractAddress;
          if (escrowAddress) {
            setEscrowContractAddress(escrowAddress as `0x${string}`);
            fetchOnChainAgreement(transformed, escrowAddress as `0x${string}`);
          }
        }
      } catch (error: any) {
        toast.error("Failed to load dispute details", {
          description: error.message,
        });
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [fetchOnChainAgreement, id]);

  return {
    dispute,
    setDispute,
    loading,
    onChainAgreement,
    onChainLoading,
    escrowContractAddress,
    refreshDispute,
  };
}
