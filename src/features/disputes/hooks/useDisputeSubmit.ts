/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { toast } from "sonner";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { disputeService } from "../../../services/disputeServices";
import { DisputeTypeEnum } from "../../../types";
import type { CreateDisputeRequest } from "../../../types";
import { VOTING_ABI, VOTING_CA } from "../../../web3/config";
import { getVoteConfigs } from "../../../web3/readContract";
import {
  cleanTelegramUsername,
  isValidTelegramUsername,
} from "../../../lib/usernameUtils";
import { isValidWalletAddress } from "../utils/formatters";
import {
  MAX_FILE_SIZE,
  MAX_TOTAL_SIZE,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOCUMENT_TYPES,
} from "../constants/fileUpload";
import type { DisputeFormState } from "../types/form";
import { INITIAL_FORM_STATE } from "../types/form";

type TransactionStep = "idle" | "pending" | "success" | "error";

interface UseDisputeSubmitOptions {
  onSuccess: () => void;
  reloadDisputes: () => void;
  selectedChainId?: number | null;
}

export function useDisputeSubmit({
  onSuccess,
  reloadDisputes,
  selectedChainId,
}: UseDisputeSubmitOptions) {

  const effectiveChainId = selectedChainId;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionStep, setTransactionStep] =
    useState<TransactionStep>("idle");
  const [isProcessingPaidDispute, setIsProcessingPaidDispute] = useState(false);

  const transactionProcessingRef = useRef({
    hasProcessed: false,
    transactionHash: null as string | null,
  });

  const {
    data: hash,
    writeContract,
    isPending: isWritePending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  const { isSuccess: isTransactionSuccess, isError: isTransactionError } =
    useWaitForTransactionReceipt({ hash });

  const votingIdToUse = useMemo(() => {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return 100000 + (array[0] % 900000);
  }, []);

  // ─── Create dispute after on-chain tx ──────────────────────────────────────

  const createDisputeAfterTransaction = useCallback(
    async (transactionHash: string, form: DisputeFormState) => {
      setIsSubmitting(true);
      try {
        const cleanedDefendant = isValidWalletAddress(form.defendant)
          ? form.defendant
          : cleanTelegramUsername(form.defendant);

        const cleanedWitnesses = form.witnesses
          .filter((w) => w.trim())
          .map((w) => (isValidWalletAddress(w) ? w : cleanTelegramUsername(w)));

        const createDisputeData: CreateDisputeRequest = {
          title: form.title,
          description: form.description,
          requestKind: DisputeTypeEnum.Paid,
          defendant: cleanedDefendant,
          claim: form.claim,
          witnesses: cleanedWitnesses,
          ...(effectiveChainId !== null && { chainId: effectiveChainId }),
        };

        const files = form.evidence.map((uf) => uf.file);
        await disputeService.createDispute(
          createDisputeData,
          VOTING_CA[effectiveChainId as number], //97 or 56 depending on Environment
          files,
          effectiveChainId as number, // 97 or 56 depenidng on Environment
        );

        // Use the parameter here if needed for logging or tracking
        console.log(`Transaction completed: ${transactionHash}`);

        toast.success("Paid dispute submitted successfully!", {
          description: `${form.title} has been recorded on-chain and in our system`,
        });
        onSuccess();
        reloadDisputes();
      } catch (error: any) {
        toast.error("Failed to create dispute", {
          description:
            error.message ||
            "Transaction succeeded but dispute creation failed",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [effectiveChainId, onSuccess, reloadDisputes],
  );

  // ─── Watch transaction states ───────────────────────────────────────────────
  const formRef = useRef<DisputeFormState>(INITIAL_FORM_STATE);
  const setFormRef = (form: DisputeFormState) => {
    formRef.current = form;
  };

  useEffect(() => {
    if (isWritePending) {
      setTransactionStep("pending");
      transactionProcessingRef.current = {
        hasProcessed: false,
        transactionHash: null,
      };
    } else if (isTransactionSuccess && hash && isProcessingPaidDispute) {
      if (
        transactionProcessingRef.current.hasProcessed &&
        transactionProcessingRef.current.transactionHash === hash
      ) {
        return;
      }
      transactionProcessingRef.current = {
        hasProcessed: true,
        transactionHash: hash,
      };
      setTransactionStep("success");
      setIsProcessingPaidDispute(false);
      createDisputeAfterTransaction(hash, formRef.current);
    } else if (writeError || isTransactionError) {
      setTransactionStep("error");
      setIsProcessingPaidDispute(false);
      transactionProcessingRef.current = {
        hasProcessed: false,
        transactionHash: null,
      };
    }
  }, [
    isWritePending,
    isTransactionSuccess,
    writeError,
    isTransactionError,
    isProcessingPaidDispute,
    hash,
    createDisputeAfterTransaction,
  ]);

  // ─── On-chain transaction ───────────────────────────────────────────────────
  const createDisputeOnchain = useCallback(async () => {
    try {
      const contractAddress = VOTING_CA[effectiveChainId as number];
      if (!contractAddress) {
        throw new Error(
          `No contract address found for chain ID ${effectiveChainId}`,
        );
      }
      const configs = await getVoteConfigs(effectiveChainId as number);
      const feeValue = configs ? configs.feeAmount : undefined;

      writeContract({
        address: contractAddress,
        abi: VOTING_ABI.abi,
        functionName: "raiseDispute",
        args: [BigInt(votingIdToUse), false],
        value: feeValue,
      });
    } catch (error: any) {
      toast.error("Failed to initiate smart contract transaction", {
        description:
          error.message || "Please check your wallet connection and try again.",
      });
      setTransactionStep("error");
      setIsProcessingPaidDispute(false);
    }
  }, [effectiveChainId, votingIdToUse, writeContract]);

  // ─── Retry ─────────────────────────────────────────────────────────────────

  const retryTransaction = useCallback(
    (kind: "Pro Bono" | "Paid") => {
      setTransactionStep("idle");
      resetWrite();
      if (kind === "Paid") createDisputeOnchain();
    },
    [createDisputeOnchain, resetWrite],
  );

  // ─── Validation ────────────────────────────────────────────────────────────

  const validateForm = (form: DisputeFormState): string | null => {
    if (!form.title.trim()) return "Please enter a title";
    if (!form.defendant.trim()) return "Please enter defendant information";
    if (!form.description.trim()) return "Please enter a description";
    if (!form.claim.trim()) return "Please enter your claim";
    if (form.evidence.length === 0)
      return "Please upload at least one evidence file";

    const totalSize = form.evidence.reduce((t, f) => t + f.file.size, 0);
    if (totalSize > MAX_TOTAL_SIZE) {
      return `Total file size is ${(totalSize / 1024 / 1024).toFixed(2)}MB. Maximum is 50MB.`;
    }

    for (const file of form.evidence) {
      if (file.file.size > MAX_FILE_SIZE)
        return `File ${file.file.name} exceeds 10MB`;
      if (
        !ALLOWED_IMAGE_TYPES.includes(file.file.type) &&
        !ALLOWED_DOCUMENT_TYPES.includes(file.file.type)
      ) {
        return `File ${file.file.name} has unsupported type`;
      }
    }

    const cleanedDefendant = cleanTelegramUsername(form.defendant);
    if (
      !isValidTelegramUsername(cleanedDefendant) &&
      !isValidWalletAddress(form.defendant)
    ) {
      return "Enter a valid Telegram username or wallet address";
    }

    const invalidWitnesses = form.witnesses
      .filter((w) => w.trim())
      .map((w) => cleanTelegramUsername(w))
      .filter((w) => !isValidTelegramUsername(w) && !isValidWalletAddress(w));

    if (invalidWitnesses.length > 0) {
      return "Please enter valid Telegram usernames for all witnesses";
    }

    return null;
  };

  // ─── Submit ─────────────────────────────────────────────────────────────────
  const submit = async (e: React.FormEvent, form: DisputeFormState) => {
    e.preventDefault();

    const error = validateForm(form);
    if (error) {
      toast.error(error);
      return;
    }

    setFormRef(form);

    if (form.kind === "Paid") {
      setIsProcessingPaidDispute(true);
      await createDisputeOnchain();
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanedDefendant = isValidWalletAddress(form.defendant)
        ? form.defendant
        : cleanTelegramUsername(form.defendant);

      const cleanedWitnesses = form.witnesses
        .filter((w) => w.trim())
        .map((w) => (isValidWalletAddress(w) ? w : cleanTelegramUsername(w)));

      const createDisputeData: CreateDisputeRequest = {
        title: form.title,
        description: form.description,
        requestKind: DisputeTypeEnum.ProBono,
        defendant: cleanedDefendant,
        claim: form.claim,
        witnesses: cleanedWitnesses,
      };

      const files = form.evidence.map((uf) => uf.file);
      await disputeService.createDispute(createDisputeData, VOTING_CA[97], files);

      toast.success("Pro Bono dispute submitted successfully", {
        description: `${form.title} has been submitted for review`,
      });
      onSuccess();
      reloadDisputes();
    } catch (error: any) {
      toast.error("Failed to submit dispute", { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetOnModalClose = useCallback(() => {
    transactionProcessingRef.current = {
      hasProcessed: false,
      transactionHash: null,
    };
    setTransactionStep("idle");
    setIsProcessingPaidDispute(false);
    resetWrite();
  }, [resetWrite]);

  const isDisabled =
    isSubmitting || transactionStep === "pending" || isProcessingPaidDispute;

  return {
    submit,
    isSubmitting,
    transactionStep,
    isProcessingPaidDispute,
    retryTransaction,
    resetOnModalClose,
    votingIdToUse,
    isDisabled,
  };
}
