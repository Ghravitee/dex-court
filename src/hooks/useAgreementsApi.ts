// hooks/useAgreementsApi.ts - Fixed version
import { useState, useEffect, useCallback } from "react";
import { agreementService } from "../services/agreementServices";
import type {
  AgreementSummaryDTO,
  AgreementDetailsDTO,
} from "../services/agreementServices";

export const useAgreementsApi = () => {
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
    [], // No dependencies needed since it only uses setAgreementDetails and setDetailsLoading
  );

  // Wrap fetchMyAgreements in useCallback to prevent infinite re-renders
  const fetchMyAgreements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await agreementService.getMyAgreements();
      const agreementsList = response.results || [];
      setAgreements(agreementsList);

      // Automatically fetch details for each agreement
      if (agreementsList.length > 0) {
        await fetchAgreementDetails(agreementsList);
      }
    } catch (err) {
      console.error("Failed to fetch agreements:", err);
      setError("Failed to load agreements");
      setAgreements([]);
    } finally {
      setLoading(false);
    }
  }, [fetchAgreementDetails]); // Add fetchAgreementDetails as dependency since it's used inside

  useEffect(() => {
    fetchMyAgreements();
  }, [fetchMyAgreements]); // Now this is stable

  return {
    agreements,
    agreementDetails,
    loading: loading || detailsLoading, // Combine both loading states
    error,
    refetch: fetchMyAgreements,
  };
};
