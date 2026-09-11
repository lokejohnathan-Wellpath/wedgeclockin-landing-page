import { founderRequest } from "../../lib/founderApi";
import type { FreeWedgeBusinessProfile } from "./freeBusinessClient";

export type RegistrationStatus = "PENDING" | "APPROVED" | "REJECTED";

export type BusinessRegistrationRequest = {
  id: string;
  status: RegistrationStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  localBusinessId?: string;
  businessId?: string;
  companyCode: string;
  legalName: string;
  tradingName?: string;
  businessType: string;
  ssmRegistrationNo?: string;
  contactName: string;
  email: string;
  mobile: string;
  entitlements?: {
    wedgeI: boolean;
    managedAccounts: boolean;
    books: boolean;
    clockIn: boolean;
  };
};

export type RegistrationSubmission = {
  requestId: string;
  status: RegistrationStatus;
  submittedAt: string;
  companyCode: string;
  businessId?: string;
};

const LOCAL_SUBMISSION_KEY = "wedge_i_registration_submission_v1";

function apiBaseUrl() {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
  if (!base) throw new Error("Wedge registration service is not configured.");
  return base;
}

async function publicRequest<T>(path: string, init: RequestInit = {}) {
  const response = await fetch(`${apiBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || "Business registration could not be submitted.");
  }
  return data as T;
}

export function getSavedRegistrationSubmission(): RegistrationSubmission | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LOCAL_SUBMISSION_KEY);
    return raw ? (JSON.parse(raw) as RegistrationSubmission) : null;
  } catch {
    return null;
  }
}

function saveRegistrationSubmission(submission: RegistrationSubmission) {
  if (typeof window !== "undefined") {
    localStorage.setItem(LOCAL_SUBMISSION_KEY, JSON.stringify(submission));
  }
}

export async function submitBusinessRegistration(profile: FreeWedgeBusinessProfile) {
  const result = await publicRequest<{
    success: true;
    registration: BusinessRegistrationRequest;
  }>("/api/business-registrations", {
    method: "POST",
    body: JSON.stringify({
      localBusinessId: profile.businessId,
      companyCode: profile.companyCode,
      legalName: profile.legalName,
      tradingName: profile.tradingName || undefined,
      businessType: profile.businessType,
      ssmRegistrationNo: profile.ssmRegistrationNo || undefined,
      contactName: profile.contactName,
      email: profile.email,
      mobile: profile.mobile,
    }),
  });

  const submission: RegistrationSubmission = {
    requestId: result.registration.id,
    status: result.registration.status,
    submittedAt: result.registration.submittedAt,
    companyCode: result.registration.companyCode,
    businessId: result.registration.businessId,
  };
  saveRegistrationSubmission(submission);
  return result.registration;
}

export async function refreshBusinessRegistration(requestId: string) {
  const result = await publicRequest<{
    success: true;
    registration: BusinessRegistrationRequest;
  }>(`/api/business-registrations/${encodeURIComponent(requestId)}`);
  const submission: RegistrationSubmission = {
    requestId: result.registration.id,
    status: result.registration.status,
    submittedAt: result.registration.submittedAt,
    companyCode: result.registration.companyCode,
    businessId: result.registration.businessId,
  };
  saveRegistrationSubmission(submission);
  return result.registration;
}

export function loadFounderBusinessRegistrations(status: RegistrationStatus | "ALL" = "PENDING") {
  const query = status === "ALL" ? "" : `?status=${encodeURIComponent(status)}`;
  return founderRequest<{ success: true; registrations: BusinessRegistrationRequest[] }>(
    `/api/founder/control/business-registrations${query}`,
  );
}

export function approveFounderBusinessRegistration(
  requestId: string,
  input: {
    managedAccounts: boolean;
    books: boolean;
    clockIn: boolean;
    assignedAccountsExecutive?: string;
  },
) {
  return founderRequest<{
    success: true;
    registration: BusinessRegistrationRequest;
    business: { businessId: string; companyCode: string };
  }>(`/api/founder/control/business-registrations/${encodeURIComponent(requestId)}/approve`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function rejectFounderBusinessRegistration(requestId: string, reason: string) {
  return founderRequest<{ success: true; registration: BusinessRegistrationRequest }>(
    `/api/founder/control/business-registrations/${encodeURIComponent(requestId)}/reject`,
    {
      method: "POST",
      body: JSON.stringify({ reason }),
    },
  );
}
