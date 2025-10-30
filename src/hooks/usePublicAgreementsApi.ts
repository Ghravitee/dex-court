// hooks/usePublicAgreementsApi.ts - UPDATED VERSION
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
      if (agreementList.length === 0) return;

      setDetailsLoading(true);
      const details: { [key: number]: AgreementDetailsDTO } = {};

      try {
        console.log(
          `📋 Fetching details for ${agreementList.length} agreements...`,
        );

        // Use Promise.all to fetch all details in parallel with concurrency limit
        const concurrencyLimit = 5; // Limit concurrent requests to avoid overwhelming the API
        const batches = [];

        for (let i = 0; i < agreementList.length; i += concurrencyLimit) {
          const batch = agreementList.slice(i, i + concurrencyLimit);
          const batchPromises = batch.map(async (agreement) => {
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
              // Don't throw, just log and continue
            }
          });
          batches.push(Promise.all(batchPromises));
        }

        // Wait for all batches to complete
        for (const batch of batches) {
          await batch;
        }

        setAgreementDetails(details);
        console.log(
          `✅ Successfully fetched details for ${Object.keys(details).length} agreements`,
        );
      } catch (err) {
        console.error("Failed to fetch agreement details:", err);
      } finally {
        setDetailsLoading(false);
      }
    },
    [],
  );

  // Fetch public agreements for a specific user
  // In usePublicAgreementsApi.ts - update the fetchPublicAgreements function
  const fetchPublicAgreements = useCallback(async () => {
    if (!userId) {
      setAgreements([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setAgreements([]);

      console.log(`👤 Fetching agreements for user ${userId}...`);

      // Use the new method with top/skip parameters
      const userAgreements =
        await agreementService.getUserAgreementsWithTopSkip(userId);

      console.log(
        `📋 Found ${userAgreements.length} agreements for user ${userId}`,
      );

      if (userAgreements.length === 0) {
        console.log("📋 No agreements found for user");
      }

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
    } else {
      setAgreements([]);
      setAgreementDetails({});
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
