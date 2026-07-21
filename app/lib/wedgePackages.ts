export const WEDGE_PACKAGE_STORAGE_KEY = "wedge_founder_package_v1";

export type WedgePackageConfig = {
  name: string;
  annualPrice: number;
  monthlyPrice: number;
  freeMonths: number;
  managedDomainSetupFee: number;
  managedDomainRenewalFee: number;
  promotionLabel: string;
  promotionEnds: string;
  active: boolean;
  includeSubdomain: boolean;
  includeClockin: boolean;
  includeTapauJer: boolean;
  includeWedgeI: boolean;
  includeWedgeWeb: boolean;
};

export const DEFAULT_WEDGE_PACKAGE: WedgePackageConfig = {
  name: "Wedge Works Complete",
  annualPrice: 899,
  monthlyPrice: 59,
  freeMonths: 3,
  managedDomainSetupFee: 99,
  managedDomainRenewalFee: 120,
  promotionLabel: "Three-month WedgeWeb launch benefit",
  promotionEnds: "",
  active: true,
  includeSubdomain: true,
  includeClockin: true,
  includeTapauJer: true,
  includeWedgeI: true,
  includeWedgeWeb: true,
};
