import { useCallback } from "react";
import type { DisputeRow } from "../../../types";
import type { DisputeChatRole } from "@/pages/DisputeChat/types";
import { cleanTelegramUsername } from "../../../lib/usernameUtils";
import { normalizeUsername } from "../utils/formatter";
import { useAuth } from "../../../hooks/useAuth";

export function useDisputeRole(dispute: DisputeRow | null) {
  const { user } = useAuth();

  const getUserRoleNumber = useCallback((): number => {
    return user?.role || 1;
  }, [user?.role]);

  const isUserJudge = useCallback((): boolean => {
    return getUserRoleNumber() === 2;
  }, [getUserRoleNumber]);

  const isUserAdmin = useCallback((): boolean => {
    return getUserRoleNumber() === 3;
  }, [getUserRoleNumber]);

  const isUserCommunity = useCallback((): boolean => {
    return getUserRoleNumber() === 1;
  }, [getUserRoleNumber]);

  const isCurrentUserPlaintiff = useCallback((): boolean => {
    if (!user || !dispute) return false;
    const currentUsername = user.username || user.telegramUsername;
    const plaintiffUsername = cleanTelegramUsername(dispute.plaintiff);
    return (
      normalizeUsername(currentUsername) ===
      normalizeUsername(plaintiffUsername)
    );
  }, [user, dispute]);

  const isCurrentUserDefendant = useCallback((): boolean => {
    if (!user || !dispute) return false;
    const currentUsername = user.username || user.telegramUsername;
    const defendantUsername = cleanTelegramUsername(dispute.defendant);
    return (
      normalizeUsername(currentUsername) ===
      normalizeUsername(defendantUsername)
    );
  }, [user, dispute]);

  const getUserRole = useCallback((): DisputeChatRole | undefined => {
    if (!user || !dispute) return undefined;

    const currentUsername = user.username || user.telegramUsername;
    const normalizedCurrent = normalizeUsername(currentUsername);
    const plaintiffUsername = normalizeUsername(
      cleanTelegramUsername(dispute.plaintiff),
    );
    const defendantUsername = normalizeUsername(
      cleanTelegramUsername(dispute.defendant),
    );

    if (normalizedCurrent === plaintiffUsername) return "plaintiff";
    if (normalizedCurrent === defendantUsername) return "defendant";

    const allWitnesses = [
      ...(dispute.witnesses?.plaintiff || []),
      ...(dispute.witnesses?.defendant || []),
    ];
    const isWitness = allWitnesses.some(
      (w) => normalizeUsername(w.username) === normalizedCurrent,
    );
    if (isWitness) return "witness";
    if (isUserJudge() || isUserAdmin()) return "judge";

    return "community";
  }, [user, dispute, isUserJudge, isUserAdmin]);

  return {
    isUserJudge,
    isUserAdmin,
    isUserCommunity,
    isCurrentUserPlaintiff,
    isCurrentUserDefendant,
    getUserRole,
  };
}
