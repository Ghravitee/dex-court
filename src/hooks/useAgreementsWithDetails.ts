// hooks/useAgreementsWithDetails.ts
import { useQuery } from "@tanstack/react-query";
import { agreementService } from "../services/agreementServices";
import type { AgreementDetailsDTO } from "../services/agreementServices";

type FundsFilter = {
  includesFunds?: boolean;
  hasSecuredFunds?: boolean;
};

export function useAgreementsWithDetailsAndFundsFilter(filters?: FundsFilter) {
  return useQuery<AgreementDetailsDTO[]>({
    queryKey: ["agreements", "with-details-and-funds", filters],
    queryFn: async () => {
      const agreements = await agreementService.getAllAgreements();

      const detailedAgreements = await Promise.all(
        agreements.map(async (agreement) => {
          try {
            const details = await agreementService.getAgreementDetails(
              agreement.id,
            );
            return details;
          } catch (err) {
            console.warn(
              `Failed fetching details for agreement ${agreement.id}`,
              err,
            );
            return null;
          }
        }),
      );

      const valid = detailedAgreements.filter(
        (a): a is AgreementDetailsDTO => a !== null,
      );

      return valid.filter((agreement) => {
        if (
          filters?.includesFunds !== undefined &&
          agreement.includesFunds !== filters.includesFunds
        ) {
          return false;
        }

        if (
          filters?.hasSecuredFunds !== undefined &&
          agreement.hasSecuredFunds !== filters.hasSecuredFunds
        ) {
          return false;
        }

        return true;
      });
    },
  });
}
