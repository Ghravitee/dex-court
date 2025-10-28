/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { agreementService } from "../services/agreementServices";

// Custom hook to get count of all agreements (public and private)
export function useAllAgreementsCount() {
  const [agreementsCount, setAgreementsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const loadAllAgreementsCount = async () => {
      try {
        setLoading(true);
        let totalCount = 0;

        // Fetch public agreements
        const publicAgreements = await agreementService.getAgreements();
        const publicAgreementsList = publicAgreements.results || [];
        totalCount += publicAgreementsList.length;

        // If user is authenticated, also fetch their private agreements
        if (isAuthenticated) {
          try {
            const myAgreements = await agreementService.getMyAgreements();
            const myAgreementsList = myAgreements.results || [];

            // Filter out agreements that are already counted in public agreements
            // and only count unique private agreements
            const privateAgreements = myAgreementsList.filter(
              (agreement: any) => agreement.visibility === 1, // PRIVATE visibility
            );

            totalCount += privateAgreements.length;
          } catch (error) {
            console.error("Failed to fetch private agreements:", error);
            // Continue with public count only if private fetch fails
          }
        }

        setAgreementsCount(totalCount);
      } catch (error) {
        console.error("Failed to fetch agreements count:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAllAgreementsCount();
  }, [isAuthenticated]);

  return { agreementsCount, loading };
}
