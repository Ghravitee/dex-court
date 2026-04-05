/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { parseEther, parseUnits } from "viem";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
} from "wagmi";
import {
  ESCROW_ABI,
  ERC20_ABI,
  ZERO_ADDRESS,
  ESCROW_CA,
} from "../../../web3/config";
import { agreementService } from "../../../services/agreementServices";
import { isValidAddress } from "../../../web3/helper";
import { AgreementVisibilityEnum } from "../constants";
import { extractContractErrorMessage } from "../utils/validators";
import type { CreationStep, EscrowFormState, EscrowType } from "../types";

interface UseEscrowCreationOptions {
  contractAddress?: `0x${string}`;
  networkChainId?: number;
  onSuccess: () => void;
}

export function useEscrowCreation({
  contractAddress,
  networkChainId,
  onSuccess,
}: UseEscrowCreationOptions) {
  const { address } = useAccount();

  // ─── Step tracking ────────────────────────────────────────────────────────
  const [creationStep, setCreationStep] = useState<CreationStep>("idle");
  const [currentStepMessage, setCurrentStepMessage] = useState("");

  const updateStep = (step: CreationStep, message: string) => {
    setCreationStep(step);
    setCurrentStepMessage(message);
  };

  // ─── Status messages ──────────────────────────────────────────────────────
  const [uiError, setUiError] = useState<string | null>(null);
  const [uiSuccess, setUiSuccess] = useState<string | null>(null);

  const resetMessages = () => {
    setUiError(null);
    setUiSuccess(null);
  };

  // ─── wagmi write hooks ────────────────────────────────────────────────────
  const {
    data: txHash,
    writeContract,
    isPending: isTxPending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  const {
    data: approvalHash,
    writeContract: writeApproval,
    isPending: isApprovalPending,
    error: approvalError,
    reset: resetApproval,
  } = useWriteContract();

  const { isSuccess: txSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });
  const { isSuccess: approvalSuccess } = useWaitForTransactionReceipt({
    hash: approvalHash,
  });

  // ─── Approval continuation state ─────────────────────────────────────────
  const [pendingCreatePayload, setPendingCreatePayload] = useState<any>(null);
  const [createApprovalState, setCreateApprovalState] = useState({
    isApprovingToken: false,
    needsApproval: false,
  });

  const transactionDataRef = useRef<{ contractAgreementId: string } | null>(
    null,
  );

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedTxHash, setLastSyncedTxHash] = useState<string | null>(null);

  // ─── Error effects ────────────────────────────────────────────────────────
  useEffect(() => {
    if (writeError) {
      const msg = extractContractErrorMessage(writeError);
      setUiError(msg);
      toast.error(`Contract Error: ${msg}`);
    }
  }, [writeError]);

  useEffect(() => {
    if (approvalError) {
      const msg = extractContractErrorMessage(approvalError);
      setUiError(msg);
      toast.error(`Approval Error: ${msg}`);
    }
  }, [approvalError]);

  // ─── Approval success → continue to createAgreement ──────────────────────
  useEffect(() => {
    if (
      approvalSuccess &&
      createApprovalState.needsApproval &&
      pendingCreatePayload
    ) {
      try {
        updateStep(
          "creating_onchain",
          "Token approved. Creating escrow on blockchain...",
        );
        writeContract(pendingCreatePayload);
        setCreateApprovalState({
          isApprovingToken: false,
          needsApproval: false,
        });
        setPendingCreatePayload(null);
        updateStep(
          "waiting_confirmation",
          "Escrow creation submitted. Waiting for confirmation...",
        );
        setUiSuccess("Approval confirmed — creating agreement now");
      } catch {
        setUiError("Failed to create agreement after approval");
        updateStep("error", "Failed to create after approval");
      }
    }
  }, [
    approvalSuccess,
    createApprovalState.needsApproval,
    pendingCreatePayload,
    writeContract,
  ]);

  useEffect(() => {
    if (approvalSuccess) {
      setUiSuccess("Token approval confirmed!");
      toast.success("Token approval confirmed!");
      resetApproval();
    }
  }, [approvalSuccess, resetApproval]);

  // ─── Transaction success ──────────────────────────────────────────────────
  useEffect(() => {
    if (!txSuccess || !txHash || txHash === lastSyncedTxHash || isSyncing)
      return;

    setIsSyncing(true);
    setLastSyncedTxHash(txHash);
    updateStep("success", "Escrow created successfully!");
    setUiSuccess("✅ Escrow created successfully!");

    toast.success("Escrow Created Successfully!", {
      description:
        "Transaction confirmed. Both parties will receive Telegram notifications.",
    });

    setTimeout(() => {
      onSuccess();
      setCreationStep("idle");
      setCurrentStepMessage("");
      setIsSyncing(false);
      resetWrite();
    }, 2000);
  }, [txSuccess, txHash, lastSyncedTxHash, isSyncing, resetWrite, onSuccess]);

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const parseMilestonesFromForm = (
    milestonesInput: Array<{ percent: string; date: Date | null }>,
    deadlineDuration: number,
  ) => {
    const percBP: number[] = [];
    const offsets: number[] = [];
    const now = Math.floor(Date.now() / 1000);

    for (const m of milestonesInput) {
      const p = Number(m.percent);
      if (!m.percent || Number.isNaN(p) || p <= 0)
        throw new Error("Each milestone needs a valid percentage");
      percBP.push(Math.round(p * 100));

      let offset = 0;
      if (m.date) {
        offset = Math.floor(m.date.getTime() / 1000) - now;
        if (offset < 0) throw new Error("Milestone date must be in the future");
        if (offset > deadlineDuration)
          throw new Error("Milestone date cannot be after the deadline");
      }
      offsets.push(offset);
    }

    return { percBP, offsets };
  };

  const parseAmount = (amount: string, tokenAddr: string, decimals: number) => {
    if (!amount) throw new Error("empty amount");
    return tokenAddr === ZERO_ADDRESS
      ? parseEther(amount)
      : parseUnits(amount, decimals);
  };

  // ─── Main creation flow ───────────────────────────────────────────────────

  const createEscrowOnChain = useCallback(
    async (form: EscrowFormState, deadline: Date, escrowType: EscrowType) => {
      resetMessages();
      setCreationStep("idle");
      setCurrentStepMessage("");

      if (!contractAddress || !isValidAddress(contractAddress)) {
        const msg = "Escrow contract not configured for this network";
        setUiError(msg);
        updateStep("error", msg);
        toast.error("Network Error", {
          description: `Please switch to a supported network. Current chain: ${networkChainId}`,
        });
        return;
      }

      if (!address) {
        setUiError("Connect your wallet");
        updateStep("error", "Wallet not connected");
        return;
      }

      // ── Determine parties ─────────────────────────────────────────────────
      let serviceProviderAddr = "";
      let serviceRecipientAddr = "";
      let firstPartyAddr = "";
      let counterPartyAddr = "";

      if (escrowType === "myself") {
        if (!isValidAddress(form.counterparty)) {
          setUiError("Counterparty must be a valid address (0x...)");
          updateStep("error", "Invalid counterparty address");
          return;
        }
        if (form.payer === "me") {
          serviceRecipientAddr = address;
          serviceProviderAddr = form.counterparty;
        } else {
          serviceProviderAddr = address;
          serviceRecipientAddr = form.counterparty;
        }
        firstPartyAddr = address.toLowerCase();
        counterPartyAddr = form.counterparty.toLowerCase();
      } else {
        if (!isValidAddress(form.partyA) || !isValidAddress(form.partyB)) {
          setUiError("Both parties must be valid addresses");
          updateStep("error", "Invalid party addresses");
          return;
        }
        if (form.payerOther === "partyA") {
          serviceRecipientAddr = form.partyA;
          serviceProviderAddr = form.partyB;
          firstPartyAddr = form.partyB.toLowerCase();
          counterPartyAddr = form.partyA.toLowerCase();
        } else {
          serviceRecipientAddr = form.partyB;
          serviceProviderAddr = form.partyA;
          firstPartyAddr = form.partyA.toLowerCase();
          counterPartyAddr = form.partyB.toLowerCase();
        }
      }

      if (
        serviceProviderAddr.toLowerCase() === serviceRecipientAddr.toLowerCase()
      ) {
        setUiError("Service provider and recipient cannot be the same address");
        updateStep("error", "Parties cannot be the same");
        return;
      }

      // ── Token ─────────────────────────────────────────────────────────────
      let tokenAddr = ZERO_ADDRESS;
      if (form.token === "custom") {
        if (!isValidAddress(form.customTokenAddress)) {
          setUiError("Custom token must be a valid address");
          updateStep("error", "Invalid custom token address");
          return;
        }
        tokenAddr = form.customTokenAddress;
      } else if (form.token !== "ETH") {
        if (
          !form.customTokenAddress ||
          !isValidAddress(form.customTokenAddress)
        ) {
          setUiError(
            `${form.token} selected — paste its contract address in Custom Token field`,
          );
          updateStep("error", `Missing ${form.token} contract address`);
          return;
        }
        tokenAddr = form.customTokenAddress;
      }

      // ── Deadline ──────────────────────────────────────────────────────────
      const now = Math.floor(Date.now() / 1000);
      const deadlineSeconds = Math.floor(deadline.getTime() / 1000);
      if (deadlineSeconds <= now) {
        setUiError("Deadline must be in the future");
        updateStep("error", "Deadline must be in the future");
        return;
      }
      const deadlineDuration = deadlineSeconds - now;

      // ── Milestones ────────────────────────────────────────────────────────
      let vestingMode = false;
      let milestonePercs: number[] = [];
      let milestoneOffsets: number[] = [];

      try {
        const parsed = parseMilestonesFromForm(
          form.milestones,
          deadlineDuration,
        );
        if (parsed.percBP.length > 0) {
          vestingMode = true;
          milestonePercs = parsed.percBP;
          milestoneOffsets = parsed.offsets;
          if (milestonePercs.reduce((s, v) => s + v, 0) !== 10000) {
            setUiError("Milestone percentages must sum to 100%");
            updateStep("error", "Milestone percentages don't sum to 100%");
            return;
          }
        }
      } catch (err: any) {
        setUiError(err.message || "Invalid milestones");
        updateStep("error", "Invalid milestone format");
        return;
      }

      // ── Amount ────────────────────────────────────────────────────────────
      let amountBN: bigint;
      try {
        amountBN = parseAmount(
          form.amount,
          tokenAddr,
          form.tokenDecimals,
        ) as bigint;
        if (amountBN <= 0n) {
          setUiError("Parsed amount invalid");
          updateStep("error", "Invalid amount");
          return;
        }
      } catch {
        setUiError("Invalid amount format");
        updateStep("error", "Could not parse amount");
        return;
      }

      // ── Generate on-chain ID ──────────────────────────────────────────────
      const contractAgreementId = String(
        Math.floor(Math.random() * 900_000_000) + 100_000_000,
      );

      // ── Backend ───────────────────────────────────────────────────────────
      updateStep("creating_backend", "Creating agreement in database...");

      try {
        const filesToUpload = form.evidence.map((f) => f.file);

        try {
          await agreementService.createAgreement(
            {
              title: form.title,
              description: form.description,
              type: 2, // ESCROW
              visibility:
                form.type === "private"
                  ? AgreementVisibilityEnum.PRIVATE
                  : AgreementVisibilityEnum.PUBLIC,
              firstParty: firstPartyAddr,
              counterParty: counterPartyAddr,
              deadline: deadline.toISOString(),
              amount: parseFloat(form.amount),
              tokenSymbol: form.token === "custom" ? "custom" : form.token,
              customTokenAddress:
                form.token === "custom" ? form.customTokenAddress : undefined,
              includesFunds: true,
              secureTheFunds: true,
              chainId: networkChainId,
              payeeWalletAddress: serviceProviderAddr,
              payerWalletAddress: serviceRecipientAddr,
              contractAgreementId,
              escrowContractAddress:
                ESCROW_CA[networkChainId as number] ?? contractAddress,
            },
            filesToUpload,
          );
        } catch (backendErr) {
          console.warn(
            "Backend creation had minor issues, continuing:",
            backendErr,
          );
        }

        transactionDataRef.current = { contractAgreementId };

        // ── Smart contract call ───────────────────────────────────────────
        const agreementIdBN = BigInt(contractAgreementId);
        const callerIsDepositor =
          serviceRecipientAddr.toLowerCase() === address.toLowerCase();
        const tokenIsETH = tokenAddr === ZERO_ADDRESS;
        const milestonePercsBN = milestonePercs.map((p) => BigInt(p));
        const milestoneOffsetsBN = milestoneOffsets.map((o) => BigInt(o));

        const contractArgs = [
          agreementIdBN,
          serviceProviderAddr as `0x${string}`,
          serviceRecipientAddr as `0x${string}`,
          tokenAddr as `0x${string}`,
          BigInt(amountBN),
          BigInt(deadlineDuration),
          vestingMode,
          form.type === "private",
          milestonePercsBN as readonly bigint[],
          milestoneOffsetsBN as readonly bigint[],
        ] as const;

        // ERC20 + caller is depositor → approval flow
        if (!tokenIsETH && callerIsDepositor) {
          updateStep(
            "awaiting_approval",
            "Token approval required. Please check your wallet...",
          );
          setCreateApprovalState({
            isApprovingToken: true,
            needsApproval: true,
          });

          setPendingCreatePayload({
            address: contractAddress as `0x${string}`,
            abi: ESCROW_ABI.abi,
            functionName: "createAgreement",
            args: contractArgs,
            value: 0n,
          });

          updateStep("approving", "Approving token spending...");
          writeApproval({
            address: tokenAddr as `0x${string}`,
            abi: ERC20_ABI.abi,
            functionName: "approve",
            args: [contractAddress as `0x${string}`, amountBN],
          });

          setUiSuccess(
            "Approval submitted; will create agreement after confirmation",
          );
          return;
        }

        // Direct call
        updateStep("creating_onchain", "Creating escrow on blockchain...");
        const valueToSend = tokenIsETH && callerIsDepositor ? amountBN : 0n;

        writeContract({
          address: contractAddress as `0x${string}`,
          abi: ESCROW_ABI.abi,
          functionName: "createAgreement",
          args: contractArgs,
          value: valueToSend,
        });

        updateStep(
          "waiting_confirmation",
          "Transaction submitted. Waiting for blockchain confirmation...",
        );
        setUiSuccess("CreateAgreement transaction submitted — check wallet");
      } catch (err: any) {
        updateStep("error", "Failed to create agreement");

        const errorCode = err.response?.data?.error;
        const messages: Record<number, string> = {
          1: "Missing required information",
          7: "One or both parties need to register first",
          11: "Parties cannot be the same account",
        };

        const msg = messages[errorCode] || "Failed to create agreement";
        setUiError(msg);
        toast.error("Error", { description: msg });
      }
    },
    [address, contractAddress, networkChainId, writeContract, writeApproval],
  );

  return {
    // State
    creationStep,
    currentStepMessage,
    uiError,
    uiSuccess,
    isTxPending,
    isApprovalPending,
    createApprovalState,
    txHash,
    // Actions
    createEscrowOnChain,
    resetMessages,
    resetCreationStep: () => {
      setCreationStep("idle");
      setCurrentStepMessage("");
    },
    /** Drive the step indicator manually — used for the Preview Steps demo */
    previewStep: (step: CreationStep, message: string) =>
      updateStep(step, message),
  };
}
