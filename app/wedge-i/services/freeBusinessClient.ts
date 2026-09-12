import type { BusinessType } from "../engine/benchmarks";

export type FreeWedgeBusinessProfile = {
  version: 1;
  businessId: string;
  companyCode: string;
  legalName: string;
  tradingName: string;
  businessType: BusinessType;
  ssmRegistrationNo: string;
  contactName: string;
  email: string;
  mobile: string;
  createdAt: string;
  updatedAt: string;
};

export type FreeWedgeBusinessInput = Omit<
  FreeWedgeBusinessProfile,
  "version" | "businessId" | "companyCode" | "createdAt" | "updatedAt"
>;

export type ApprovedBusinessProfileInput = {
  businessId: string;
  companyCode: string;
  legalName: string;
  tradingName?: string;
  businessType: string;
  registrationNumber?: string;
  ownerName: string;
  ownerEmail: string;
  phone?: string;
};

const FREE_BUSINESS_KEY = "wedge_i_free_business_profile_v1";
const BUSINESS_TYPES: BusinessType[] = [
  "Retail",
  "F&B",
  "Beauty / Aesthetic / Medical",
  "Service",
  "Manufacturing",
  "General SME",
];

function sanitiseCodePart(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, 8) || "BUSINESS";
}

function randomPart() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
  }
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

function asBusinessType(value: string): BusinessType {
  return BUSINESS_TYPES.includes(value as BusinessType)
    ? (value as BusinessType)
    : "General SME";
}

export function getFreeBusinessProfile(): FreeWedgeBusinessProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(FREE_BUSINESS_KEY);
    if (!raw) return null;
    const profile = JSON.parse(raw) as FreeWedgeBusinessProfile;
    if (profile?.version !== 1 || !profile.businessId || !profile.legalName) return null;
    return profile;
  } catch {
    return null;
  }
}

export function saveFreeBusinessProfile(input: FreeWedgeBusinessInput) {
  if (typeof window === "undefined") throw new Error("Business registration is available in the browser only.");

  const existing = getFreeBusinessProfile();
  const now = new Date().toISOString();
  const identity = existing ?? {
    businessId: `WIF-${randomPart()}`,
    companyCode: `${sanitiseCodePart(input.tradingName || input.legalName)}-${randomPart().slice(0, 4)}`,
    createdAt: now,
  };

  const profile: FreeWedgeBusinessProfile = {
    version: 1,
    businessId: identity.businessId,
    companyCode: identity.companyCode,
    legalName: input.legalName.trim(),
    tradingName: input.tradingName.trim(),
    businessType: input.businessType,
    ssmRegistrationNo: input.ssmRegistrationNo.trim(),
    contactName: input.contactName.trim(),
    email: input.email.trim().toLowerCase(),
    mobile: input.mobile.trim(),
    createdAt: identity.createdAt,
    updatedAt: now,
  };

  localStorage.setItem(FREE_BUSINESS_KEY, JSON.stringify(profile));
  window.dispatchEvent(new Event("wedge-free-business-changed"));
  return profile;
}

export function saveApprovedBusinessProfile(input: ApprovedBusinessProfileInput) {
  if (typeof window === "undefined") return null;
  const existing = getFreeBusinessProfile();
  const now = new Date().toISOString();
  const profile: FreeWedgeBusinessProfile = {
    version: 1,
    businessId: input.businessId,
    companyCode: input.companyCode,
    legalName: input.legalName.trim(),
    tradingName: String(input.tradingName || "").trim(),
    businessType: asBusinessType(input.businessType),
    ssmRegistrationNo: String(input.registrationNumber || existing?.ssmRegistrationNo || "").trim(),
    contactName: input.ownerName.trim(),
    email: input.ownerEmail.trim().toLowerCase(),
    mobile: String(input.phone || "").trim(),
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
  localStorage.setItem(FREE_BUSINESS_KEY, JSON.stringify(profile));
  window.dispatchEvent(new Event("wedge-free-business-changed"));
  return profile;
}

export function clearFreeBusinessProfile() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(FREE_BUSINESS_KEY);
  window.dispatchEvent(new Event("wedge-free-business-changed"));
}

export function freeBusinessMatchesName(profile: FreeWedgeBusinessProfile, companyName: string) {
  const target = companyName.trim().toLowerCase();
  return Boolean(target) && [profile.legalName, profile.tradingName]
    .filter(Boolean)
    .some((name) => name.trim().toLowerCase() === target);
}
