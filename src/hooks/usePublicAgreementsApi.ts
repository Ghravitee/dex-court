// hooks/usePublicAgreementsApi.ts
import { useState, useEffect, useCallback } from "react";
import { agreementService } from "../services/agreementServices";
import type {
  AgreementSummaryDTO,
  AgreementDetailsDTO,
} from "../services/agreementServices";

export const usePublicAgreementsApi = (userId?: string) => {
  const [agreements, setAgreements] = useState<AgreementSummaryDTO[]>([]);
  const [agreementDetails, setAgreementDetails] = useState<{
    [key: number]: AgreementDetailsDTO;
  }>({});
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch detailed information for each agreement
  const fetchAgreementDetails = useCallback(
    async (agreementList: AgreementSummaryDTO[]) => {
      setDetailsLoading(true);
      const details: { [key: number]: AgreementDetailsDTO } = {};

      try {
        // Use Promise.all to fetch all details in parallel
        const detailPromises = agreementList.map(async (agreement) => {
          try {
            const detailResponse = await agreementService.getAgreementDetails(
              agreement.id,
            );
            details[agreement.id] = detailResponse.data;
          } catch (err) {
            console.error(
              `Failed to fetch details for agreement ${agreement.id}:`,
              err,
            );
          }
        });

        await Promise.all(detailPromises);
        setAgreementDetails(details);
      } catch (err) {
        console.error("Failed to fetch agreement details:", err);
      } finally {
        setDetailsLoading(false);
      }
    },
    [],
  );

  // Fetch public agreements for a specific user
  const fetchPublicAgreements = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      // First get all agreements
      const response = await agreementService.getAgreements();
      const allAgreements = response.results || [];

      // Filter agreements where the user is involved AND agreement is public
      const userAgreements = allAgreements.filter((agreement) => {
        const isUserInvolved =
          agreement.firstParty.id.toString() === userId ||
          agreement.counterParty.id.toString() === userId;

        // For now, we'll assume all agreements from the public endpoint are public
        // You might need to adjust this based on your actual visibility logic
        return isUserInvolved;
      });

      setAgreements(userAgreements);

      // Automatically fetch details for each agreement
      if (userAgreements.length > 0) {
        await fetchAgreementDetails(userAgreements);
      }
    } catch (err) {
      console.error("Failed to fetch public agreements:", err);
      setError("Failed to load user agreements");
      setAgreements([]);
    } finally {
      setLoading(false);
    }
  }, [userId, fetchAgreementDetails]);

  useEffect(() => {
    if (userId) {
      fetchPublicAgreements();
    }
  }, [userId, fetchPublicAgreements]);

  return {
    agreements,
    agreementDetails,
    loading: loading || detailsLoading,
    error,
    refetch: fetchPublicAgreements,
  };
};
