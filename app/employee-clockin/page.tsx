"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

type Employee = {
  id: string;
  employeeCode: string;
  fullName: string;
  companyName?: string;
  companyCode?: string;
  department?: string;
  position?: string;
  phoneNumber?: string;
  webFaceRegistered?: boolean;
  faceRegisteredAt?: string | null;
};

type AttendanceRecord = {
  clockIn: string | null;
  restOut: string | null;
  restIn: string | null;
  clockOut: string | null;
};

type PortalTab = "attendance" | "leave" | "overtime" | "profile";

type LeaveRecord = {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

type LeaveBalance = Record<string, number | null>;

type OvertimeRecord = {
  id: string;
  date: string;
  minutes: number;
  reason: string;
  status: "detected" | "pending" | "approved" | "rejected";
  ratio?: number;
  payableMinutes?: number;
  replacementMinutes?: number;
  replacementCreditMinutes?: number;
  managerNote?: string;
};

type ReplacementClaim = {
  id: string;
  date: string;
  minutes: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
};

const LEAVE_TYPES = ["Annual Leave", "Medical Leave", "Emergency Leave", "Unpaid Leave", "Replacement Leave", "Hospitalisation Leave", "Other Leave"];

const TOKEN_KEY = "wc_employee_token";
const EMPLOYEE_KEY = "wc_employee_profile";

function formatMalaysiaTime(value: string | null | undefined) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(new Date(value));
}

function getPosition() {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Location is not supported by this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });
  });
}

export default function EmployeeClockInPage() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [token, setToken] = useState("");
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [record, setRecord] = useState<AttendanceRecord | null>(null);
  const [activeTab, setActiveTab] = useState<PortalTab>("attendance");
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance>({});
  const [leaveType, setLeaveType] = useState(LEAVE_TYPES[0]);
  const [leaveStart, setLeaveStart] = useState("");
  const [leaveEnd, setLeaveEnd] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [overtime, setOvertime] = useState<OvertimeRecord[]>([]);
  const [replacementClaims, setReplacementClaims] = useState<ReplacementClaim[]>([]);
  const [replacementClaimMinutes, setReplacementClaimMinutes] = useState(0);
  const [otReasons, setOtReasons] = useState<Record<string, string>>({});
  const [otLoadingId, setOtLoadingId] = useState("");
  const [claimDate, setClaimDate] = useState("");
  const [claimHours, setClaimHours] = useState("");
  const [claimReason, setClaimReason] = useState("");
  const [claimLoading, setClaimLoading] = useState(false);
  const [outletShortName, setOutletShortName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [password, setPassword] = useState("");
  const [pdpaConsent, setPdpaConsent] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeAction, setActiveAction] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [locationReady, setLocationReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const locationRef = useRef<{ latitude: number; longitude: number } | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    locationRef.current = null;
    setCameraReady(false);
    setLocationReady(false);
    setCameraOpen(false);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMPLOYEE_KEY);
    setToken("");
    setEmployee(null);
    setRecord(null);
    setLeaves([]);
    setOvertime([]);
    setReplacementClaims([]);
    setActiveTab("attendance");
    setMessage("");
  }, []);

  const loadToday = useCallback(
    async (sessionToken: string) => {
      if (!apiBaseUrl) throw new Error("API service is not configured.");

      const response = await fetch(`${apiBaseUrl}/api/employee-portal/today`, {
        headers: { Authorization: `Bearer ${sessionToken}` },
        cache: "no-store",
      });
      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        logout();
        throw new Error("Your session has expired. Please log in again.");
      }
      if (!response.ok) throw new Error(data?.message || "Unable to load attendance.");

      setEmployee(data.employee);
      localStorage.setItem(EMPLOYEE_KEY, JSON.stringify(data.employee));
      setRecord(data.record || null);
    },
    [apiBaseUrl, logout],
  );

  const loadLeave = useCallback(async (sessionToken: string) => {
    if (!apiBaseUrl) throw new Error("API service is not configured.");
    const response = await fetch(`${apiBaseUrl}/api/employee-portal/leave`, {
      headers: { Authorization: `Bearer ${sessionToken}` },
      cache: "no-store",
    });
    const data = await response.json();
    if (response.status === 401 || response.status === 403) {
      logout();
      throw new Error("Your session has expired. Please log in again.");
    }
    if (!response.ok) throw new Error(data?.message || "Unable to load leave records.");
    setLeaves(data.leaves || []);
    setLeaveBalance(data.balance || {});
  }, [apiBaseUrl, logout]);

  const loadOvertime = useCallback(async (sessionToken: string) => {
    if (!apiBaseUrl) throw new Error("API service is not configured.");
    const response = await fetch(`${apiBaseUrl}/api/employee-portal/overtime`, {
      headers: { Authorization: `Bearer ${sessionToken}` },
      cache: "no-store",
    });
    const data = await response.json();
    if (response.status === 401 || response.status === 403) {
      logout();
      throw new Error("Your session has expired. Please log in again.");
    }
    if (!response.ok) throw new Error(data?.message || "Unable to load overtime records.");
    setOvertime(data.requests || []);
    setReplacementClaims(data.claims || []);
    setReplacementClaimMinutes(Number(data.replacementClaimMinutes || 0));
  }, [apiBaseUrl, logout]);

  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY) || "";
    const savedEmployee = localStorage.getItem(EMPLOYEE_KEY);

    if (!savedToken) return;

    const timer = window.setTimeout(() => {
      setToken(savedToken);
      if (savedEmployee) {
        try {
          setEmployee(JSON.parse(savedEmployee));
        } catch {
          localStorage.removeItem(EMPLOYEE_KEY);
        }
      }

      setIsLoading(true);
      loadToday(savedToken)
        .then(() => Promise.all([loadLeave(savedToken), loadOvertime(savedToken)]))
        .catch((err) => setError(err instanceof Error ? err.message : "Unable to load attendance."))
        .finally(() => setIsLoading(false));
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadLeave, loadOvertime, loadToday]);

  useEffect(() => stopCamera, [stopCamera]);

  useEffect(() => {
    const video = videoRef.current;
    const stream = streamRef.current;

    if (!cameraOpen || !video || !stream) return;

    function markCameraReady() {
      setCameraReady(true);
    }

    video.srcObject = stream;
    video.addEventListener("loadedmetadata", markCameraReady);
    void video.play().catch(() => {
      setError("The camera preview could not start. Check browser camera permission.");
    });

    if (video.readyState >= 1 && video.videoWidth > 0) {
      markCameraReady();
    }

    return () => video.removeEventListener("loadedmetadata", markCameraReady);
  }, [cameraOpen]);

  async function startCamera() {
    setError("");
    setMessage("");
    setCameraStarting(true);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Live camera access is not supported by this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 720 },
          height: { ideal: 960 },
        },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOpen(true);

      try {
        const position = await getPosition();
        locationRef.current = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setLocationReady(true);
      } catch {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setCameraOpen(false);
        throw new Error("Allow precise location access as well as camera access to clock in.");
      }
    } catch (cameraError) {
      setError(
        cameraError instanceof Error
          ? cameraError.message
          : "Allow front-camera access to verify your face.",
      );
    } finally {
      setCameraStarting(false);
    }
  }

  async function captureAndClockIn() {
    const video = videoRef.current;

    if (!cameraReady || !locationReady || !locationRef.current) {
      setError("Wait until both Camera Ready and GPS Ready are shown.");
      return;
    }

    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      setError("The camera is not ready. Wait a moment and try again.");
      return;
    }

    const maxSize = 1000;
    const scale = Math.min(1, maxSize / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    const context = canvas.getContext("2d");

    if (!context) {
      setError("The selfie could not be prepared.");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const clockInSelfieBase64 = canvas.toDataURL("image/jpeg", 0.86);
    const location = locationRef.current;
    stopCamera();
    await recordAction("clockIn", clockInSelfieBase64, location);
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!pdpaConsent) {
      setError("Please accept the PDPA and location notice.");
      return;
    }
    if (!apiBaseUrl) {
      setError("API service is not configured.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/employee-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outletShortName: outletShortName.trim().toUpperCase(),
          idNumber: idNumber.trim().toUpperCase(),
          password,
        }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data?.message || "Invalid login details.");

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(EMPLOYEE_KEY, JSON.stringify(data.employee));
      setToken(data.token);
      setEmployee(data.employee);
      setPassword("");
      await loadToday(data.token);
      await loadLeave(data.token);
      await loadOvertime(data.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setIsLoading(false);
    }
  }

  async function submitLeave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!apiBaseUrl || !token) return;
    setError("");
    setMessage("");
    setLeaveLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/employee-portal/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ leaveType, startDate: leaveStart, endDate: leaveEnd, reason: leaveReason }),
      });
      const data = await response.json();
      if (response.status === 401 || response.status === 403) logout();
      if (!response.ok) throw new Error(data?.message || "Leave request could not be submitted.");
      setLeaveStart("");
      setLeaveEnd("");
      setLeaveReason("");
      setMessage(data.message || "Leave request submitted.");
      await loadLeave(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Leave request could not be submitted.");
    } finally {
      setLeaveLoading(false);
    }
  }

  async function submitOvertime(request: OvertimeRecord) {
    if (!apiBaseUrl || !token) return;
    const reason = String(otReasons[request.id] || "").trim();
    if (!reason) {
      setError("Enter a reason for the OT application.");
      return;
    }
    setOtLoadingId(request.id);
    setError("");
    setMessage("");
    try {
      const response = await fetch(
        `${apiBaseUrl}/api/employee-portal/overtime/${encodeURIComponent(request.id)}/submit`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ reason }),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "OT application could not be submitted.");
      setMessage(data.message || "OT application submitted.");
      setOtReasons((current) => ({ ...current, [request.id]: "" }));
      await loadOvertime(token);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "OT application could not be submitted.");
    } finally {
      setOtLoadingId("");
    }
  }

  async function submitReplacementClaim(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!apiBaseUrl || !token) return;
    const hours = Number(claimHours);
    if (!Number.isFinite(hours) || hours <= 0) {
      setError("Enter valid replacement claim hours.");
      return;
    }
    setClaimLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/employee-portal/replacement-claims`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          date: claimDate,
          minutes: Math.round(hours * 60),
          reason: claimReason,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Replacement-hours claim could not be submitted.");
      setClaimDate("");
      setClaimHours("");
      setClaimReason("");
      setMessage(data.message || "Replacement-hours claim submitted.");
      await loadOvertime(token);
    } catch (claimError) {
      setError(claimError instanceof Error ? claimError.message : "Replacement-hours claim could not be submitted.");
    } finally {
      setClaimLoading(false);
    }
  }

  async function recordAction(
    action: "clockIn" | "restOut" | "restIn" | "clockOut",
    clockInSelfieBase64?: string,
    suppliedLocation?: { latitude: number; longitude: number },
  ) {
    if (!apiBaseUrl || !token) return;

    setError("");
    setMessage("");
    setActiveAction(action);

    try {
      let location: { latitude?: number; longitude?: number } = {};
      if (action === "clockIn") {
        if (!suppliedLocation) throw new Error("Camera and precise location are required to clock in.");
        location = suppliedLocation;
      }

      const response = await fetch(`${apiBaseUrl}/api/employee-portal/action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action, ...location, clockInSelfieBase64 }),
      });
      const data = await response.json();

      if (response.status === 401) logout();
      if (!response.ok) throw new Error(data?.message || "Attendance could not be recorded.");

      setRecord(data.record);
      setMessage(data.message || "Attendance updated.");
      if (action === "clockOut") await loadOvertime(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Attendance could not be recorded.");
    } finally {
      setActiveAction("");
    }
  }

  const status = !record?.clockIn
    ? "Ready to clock in"
    : record.clockOut
      ? "Shift completed"
      : record.restOut && !record.restIn
        ? "On rest"
        : "Working";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(200,164,103,0.12),transparent_34%),linear-gradient(180deg,#101416,#080b0d)] px-5 py-10 text-[#f4efe6]">
      <div className="mx-auto max-w-md">
        <header className="mb-7 flex items-center justify-between">
          <Link href="/" className="text-sm text-[#d4ad63] hover:underline">← Wedge Works</Link>
          {token && (
            <button onClick={logout} className="text-sm text-white/55 hover:text-white">Log out</button>
          )}
        </header>

        <section className="overflow-hidden rounded-[2rem] border border-[#d4ad63]/35 bg-[#1a2024]/95 shadow-2xl">
          <div className="border-b border-white/8 px-7 py-7 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#d4ad63] text-2xl font-bold text-[#111416]">◷</div>
            <p className="mt-4 text-xs font-semibold tracking-[0.3em] text-[#d4ad63]">WEDGECLOCKIN</p>
            <h1 className="mt-2 text-3xl font-bold text-[#f0dfbd]">Employee Clock In</h1>
            <p className="mt-2 text-sm text-white/50">Secure browser attendance in Malaysia time</p>
          </div>

          {!token ? (
            <form onSubmit={handleLogin} className="space-y-5 p-7">
              <Field label="Outlet Short Name" value={outletShortName} onChange={setOutletShortName} placeholder="Example: KL01" />
              <Field label="ID / Passport Number" value={idNumber} onChange={setIdNumber} placeholder="Enter your ID" />
              <Field label="Employee Password" value={password} onChange={setPassword} placeholder="Enter your password" type="password" />

              <label className="flex cursor-pointer gap-3 rounded-xl border border-white/8 bg-black/15 p-4 text-xs leading-5 text-white/55">
                <input type="checkbox" checked={pdpaConsent} onChange={(event) => setPdpaConsent(event.target.checked)} className="mt-1 accent-[#d4ad63]" />
                <span>I consent to the use of my identity and precise location for attendance verification under the PDPA notice.</span>
              </label>

              <Notice error={error} message={message} />
              <button disabled={isLoading} className="w-full rounded-full bg-[#d4ad63] px-6 py-4 font-bold text-[#111416] hover:bg-[#e4bf75] disabled:opacity-60">
                {isLoading ? "Signing in…" : "Employee Login"}
              </button>
            </form>
          ) : (
            <div className="p-7">
              <nav className="mb-6 grid grid-cols-4 rounded-2xl border border-white/8 bg-black/20 p-1" aria-label="Employee portal">
                {(["attendance", "leave", "overtime", "profile"] as PortalTab[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => { setActiveTab(tab); setError(""); setMessage(""); stopCamera(); }}
                    className={`rounded-xl px-2 py-3 text-xs font-semibold transition ${activeTab === tab ? "bg-[#d4ad63] text-[#111416]" : "text-white/50"}`}
                  >
                    {tab === "attendance" ? "Attendance" : tab === "leave" ? "My Leave" : tab === "overtime" ? "My OT" : "Profile"}
                  </button>
                ))}
              </nav>

              {activeTab === "attendance" && <>
              <div className="rounded-2xl border border-[#d4ad63]/20 bg-[#30281e] p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-white/40">Today&apos;s status</p>
                <p className="mt-2 text-2xl font-bold text-[#f0dfbd]">{status}</p>
                <p className="mt-2 text-sm text-white/55">{employee?.fullName} · {employee?.employeeCode}</p>
                {employee?.companyName && <p className="mt-1 text-xs text-white/35">{employee.companyName}</p>}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <TimeCard label="Clock In" value={record?.clockIn} />
                <TimeCard label="Rest Out" value={record?.restOut} />
                <TimeCard label="Rest In" value={record?.restIn} />
                <TimeCard label="Clock Out" value={record?.clockOut} />
              </div>

              <div className="mt-6 space-y-3">
                {!record?.clockIn && !cameraOpen && (
                  <ActionButton
                    label="Open Face Camera"
                    loading={cameraStarting}
                    onClick={() => void startCamera()}
                    primary
                  />
                )}
                {!record?.clockIn && cameraOpen && (
                  <div className="overflow-hidden rounded-2xl border border-[#d4ad63]/30 bg-black p-3">
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="aspect-[3/4] w-full rounded-xl bg-black object-cover"
                    />
                    <p className="mt-3 text-center text-xs text-white/50">
                      Face the camera alone in good lighting. Remove sunglasses and masks.
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs font-semibold">
                      <span className={`rounded-full px-3 py-2 ${cameraReady ? "bg-emerald-500/15 text-emerald-200" : "bg-amber-500/15 text-amber-200"}`}>
                        {cameraReady ? "Camera Ready" : "Starting Camera…"}
                      </span>
                      <span className={`rounded-full px-3 py-2 ${locationReady ? "bg-emerald-500/15 text-emerald-200" : "bg-amber-500/15 text-amber-200"}`}>
                        {locationReady ? "GPS Ready" : "Waiting for GPS…"}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="rounded-full border border-white/20 px-4 py-3 text-sm font-semibold text-white/70"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={activeAction === "clockIn" || !cameraReady || !locationReady}
                        onClick={() => void captureAndClockIn()}
                        className="rounded-full bg-[#d4ad63] px-4 py-3 text-sm font-bold text-[#111416] disabled:opacity-60"
                      >
                        {activeAction === "clockIn" ? "Verifying…" : "Capture & Clock In"}
                      </button>
                    </div>
                  </div>
                )}
                {record?.clockIn && !record.restOut && !record.clockOut && <ActionButton label="Rest Out" loading={activeAction === "restOut"} onClick={() => recordAction("restOut")} />}
                {record?.restOut && !record.restIn && !record.clockOut && <ActionButton label="Rest In" loading={activeAction === "restIn"} onClick={() => recordAction("restIn")} primary />}
                {record?.clockIn && !record.clockOut && !(record.restOut && !record.restIn) && <ActionButton label="Clock Out" loading={activeAction === "clockOut"} onClick={() => recordAction("clockOut")} />}
              </div>

              <div className="mt-5"><Notice error={error} message={message} /></div>
              <p className="mt-5 text-center text-xs leading-5 text-white/35">Clock In requires a live face match, precise GPS permission and the company&apos;s approved workplace radius.</p>
              </>}

              {activeTab === "leave" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <SummaryCard label="Pending" value={leaves.filter((leave) => leave.status === "pending").length} />
                    <SummaryCard label="Approved" value={leaves.filter((leave) => leave.status === "approved").length} />
                    <SummaryCard label="Annual Left" value={leaveBalance.annualLeaveBalance ?? "—"} />
                    <SummaryCard label="MC Left" value={leaveBalance.medicalLeaveBalance ?? "—"} />
                  </div>

                  <form onSubmit={submitLeave} className="space-y-4 rounded-2xl border border-[#d4ad63]/20 bg-[#30281e] p-5">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-[#d4ad63]">New request</p>
                      <h2 className="mt-1 text-xl font-bold text-[#f0dfbd]">Apply for Leave</h2>
                    </div>
                    <label className="block text-sm font-semibold text-white/70">Leave Type
                      <select value={leaveType} onChange={(event) => setLeaveType(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#101416] px-4 py-3 text-white outline-none focus:border-[#d4ad63]">
                        {LEAVE_TYPES.map((type) => <option key={type}>{type}</option>)}
                      </select>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <DateField label="Start Date" value={leaveStart} onChange={setLeaveStart} />
                      <DateField label="End Date" value={leaveEnd} onChange={setLeaveEnd} min={leaveStart} />
                    </div>
                    <label className="block text-sm font-semibold text-white/70">Reason
                      <textarea value={leaveReason} onChange={(event) => setLeaveReason(event.target.value)} maxLength={500} required rows={3} placeholder="Brief reason for leave" className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-[#101416] px-4 py-3 text-white outline-none focus:border-[#d4ad63]" />
                    </label>
                    <Notice error={error} message={message} />
                    <button disabled={leaveLoading} className="w-full rounded-full bg-[#d4ad63] px-5 py-3.5 font-bold text-[#111416] disabled:opacity-60">{leaveLoading ? "Submitting…" : "Submit for Approval"}</button>
                  </form>

                  <div>
                    <h2 className="text-lg font-bold text-[#f0dfbd]">Leave History</h2>
                    <div className="mt-3 space-y-3">
                      {leaves.length === 0 && <p className="rounded-xl border border-white/8 p-4 text-sm text-white/45">No leave requests yet.</p>}
                      {leaves.map((leave) => <LeaveCard key={leave.id} leave={leave} />)}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "overtime" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-3 gap-2">
                    <SummaryCard label="Detected" value={overtime.filter((item) => item.status === "detected").length} />
                    <SummaryCard label="Pending" value={overtime.filter((item) => item.status === "pending").length} />
                    <SummaryCard label="Claim Hours" value={(replacementClaimMinutes / 60).toFixed(2)} />
                  </div>

                  <section>
                    <h2 className="text-lg font-bold text-[#f0dfbd]">Overtime Applications</h2>
                    <p className="mt-1 text-xs leading-5 text-white/40">The system calculates eligible minutes from your roster and actual clock-out. You only provide the reason.</p>
                    <div className="mt-3 space-y-3">
                      {overtime.length === 0 && <p className="rounded-xl border border-white/8 p-4 text-sm text-white/45">No detected overtime yet.</p>}
                      {overtime.map((item) => (
                        <article key={item.id} className="rounded-xl border border-white/8 bg-white/[0.035] p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-[#f0dfbd]">{formatMalaysiaDate(item.date)}</p>
                              <p className="mt-1 text-xs text-white/45">Detected {(item.minutes / 60).toFixed(2)} hours</p>
                            </div>
                            <StatusBadge status={item.status} />
                          </div>
                          {item.status === "detected" ? (
                            <div className="mt-4">
                              <textarea value={otReasons[item.id] || ""} onChange={(event) => setOtReasons((current) => ({ ...current, [item.id]: event.target.value }))} rows={2} maxLength={500} placeholder="Reason for overtime" className="w-full resize-none rounded-xl border border-white/10 bg-[#101416] px-4 py-3 text-sm outline-none focus:border-[#d4ad63]" />
                              <button type="button" disabled={otLoadingId === item.id} onClick={() => void submitOvertime(item)} className="mt-3 w-full rounded-full bg-[#d4ad63] px-5 py-3 font-bold text-[#111416] disabled:opacity-60">{otLoadingId === item.id ? "Submitting…" : "Submit OT Application"}</button>
                            </div>
                          ) : (
                            <div className="mt-3 text-sm text-white/55">
                              <p>{item.reason || "No reason recorded."}</p>
                              {item.status === "approved" && (
                                <p className="mt-2 text-xs text-emerald-200/80">Paid: {((item.payableMinutes || 0) / 60).toFixed(2)}h · Replacement credit: {((item.replacementCreditMinutes || 0) / 60).toFixed(2)}h · Ratio {Number(item.ratio || 0).toFixed(2)}</p>
                              )}
                              {item.managerNote && <p className="mt-2 text-xs text-white/40">Manager: {item.managerNote}</p>}
                            </div>
                          )}
                        </article>
                      ))}
                    </div>
                  </section>

                  <form onSubmit={submitReplacementClaim} className="space-y-4 rounded-2xl border border-[#d4ad63]/20 bg-[#30281e] p-5">
                    <div><p className="text-xs uppercase tracking-[0.2em] text-[#d4ad63]">Replacement hours</p><h2 className="mt-1 text-xl font-bold text-[#f0dfbd]">Submit Hours Claim</h2></div>
                    <DateField label="Claim Date" value={claimDate} onChange={setClaimDate} />
                    <Field label="Hours" value={claimHours} onChange={setClaimHours} placeholder="Example: 2.5" type="number" />
                    <label className="block text-sm font-semibold text-white/70">Reason<textarea value={claimReason} onChange={(event) => setClaimReason(event.target.value)} maxLength={500} required rows={3} className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-[#101416] px-4 py-3 outline-none focus:border-[#d4ad63]" /></label>
                    <button disabled={claimLoading || replacementClaimMinutes <= 0} className="w-full rounded-full border border-[#d4ad63]/45 px-5 py-3.5 font-bold text-[#f0dfbd] disabled:opacity-40">{claimLoading ? "Submitting…" : "Submit Replacement Claim"}</button>
                  </form>

                  <section>
                    <h2 className="text-lg font-bold text-[#f0dfbd]">Replacement Claim History</h2>
                    <div className="mt-3 space-y-3">
                      {replacementClaims.length === 0 && <p className="rounded-xl border border-white/8 p-4 text-sm text-white/45">No replacement claims yet.</p>}
                      {replacementClaims.map((claim) => <article key={claim.id} className="rounded-xl border border-white/8 bg-white/[0.035] p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-[#f0dfbd]">{(claim.minutes / 60).toFixed(2)} hours</p><p className="mt-1 text-xs text-white/45">{formatMalaysiaDate(claim.date)}</p></div><StatusBadge status={claim.status} /></div><p className="mt-3 text-sm text-white/55">{claim.reason}</p></article>)}
                    </div>
                  </section>
                  <Notice error={error} message={message} />
                </div>
              )}

              {activeTab === "profile" && (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-[#d4ad63]/20 bg-[#30281e] p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/40">Employee profile</p>
                    <h2 className="mt-2 text-2xl font-bold text-[#f0dfbd]">{employee?.fullName}</h2>
                    <div className="mt-4 divide-y divide-white/8 text-sm">
                      <ProfileRow label="Employee Code" value={employee?.employeeCode} />
                      <ProfileRow label="Company" value={employee?.companyName || employee?.companyCode} />
                      <ProfileRow label="Department" value={employee?.department} />
                      <ProfileRow label="Position" value={employee?.position} />
                      <ProfileRow label="Phone" value={employee?.phoneNumber} />
                    </div>
                  </div>
                  <div className={`rounded-2xl border p-5 ${employee?.webFaceRegistered ? "border-emerald-400/25 bg-emerald-500/10" : "border-amber-400/30 bg-amber-500/10"}`}>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/45">Web face verification</p>
                    <p className="mt-2 text-xl font-bold">{employee?.webFaceRegistered ? "Registered ✓" : "Registration required"}</p>
                    <p className="mt-2 text-sm leading-6 text-white/60">
                      {employee?.webFaceRegistered
                        ? `Your encrypted web face profile is ready${employee.faceRegisteredAt ? ` since ${formatMalaysiaDate(employee.faceRegisteredAt)}` : ""}.`
                        : "Ask your manager to open Manager Dashboard → Face Registration and register your face for web clock-in."}
                    </p>
                  </div>
                  <p className="text-center text-xs leading-5 text-white/35">Employees can view their status here. Face enrollment stays manager-controlled to prevent another person registering on an employee&apos;s behalf.</p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string }) {
  return <div><label className="mb-2 block text-sm font-semibold text-white/70">{label}</label><input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required className="w-full rounded-xl border border-white/10 bg-[#101416] px-4 py-3 text-white outline-none focus:border-[#d4ad63]" /></div>;
}

function TimeCard({ label, value }: { label: string; value?: string | null }) {
  return <div className="rounded-xl border border-white/8 bg-white/[0.035] p-4"><p className="text-[11px] uppercase tracking-wider text-white/35">{label}</p><p className="mt-2 font-semibold text-[#f0dfbd]">{formatMalaysiaTime(value)}</p></div>;
}

function ActionButton({ label, loading, onClick, primary = false }: { label: string; loading: boolean; onClick: () => void; primary?: boolean }) {
  return <button type="button" disabled={loading} onClick={onClick} className={`w-full rounded-full px-6 py-4 font-bold transition disabled:opacity-60 ${primary ? "bg-[#d4ad63] text-[#111416] hover:bg-[#e4bf75]" : "border border-[#d4ad63]/45 bg-black/10 text-[#f0dfbd] hover:bg-[#d4ad63]/10"}`}>{loading ? "Recording…" : label}</button>;
}

function Notice({ error, message }: { error: string; message: string }) {
  if (error) return <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>;
  if (message) return <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{message}</div>;
  return null;
}

function formatMalaysiaDate(value: string) {
  return new Intl.DateTimeFormat("en-MY", { timeZone: "Asia/Kuala_Lumpur", day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

function DateField({ label, value, onChange, min }: { label: string; value: string; onChange: (value: string) => void; min?: string }) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuala_Lumpur", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  return <label className="block text-sm font-semibold text-white/70">{label}<input type="date" value={value} min={min || today} onChange={(event) => onChange(event.target.value)} required className="mt-2 w-full rounded-xl border border-white/10 bg-[#101416] px-3 py-3 text-white outline-none focus:border-[#d4ad63]" /></label>;
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-xl border border-white/8 bg-white/[0.035] p-3 text-center"><p className="text-xl font-bold text-[#f0dfbd]">{value}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-white/35">{label}</p></div>;
}

function StatusBadge({ status }: { status: "detected" | "pending" | "approved" | "rejected" }) {
  const style = status === "approved"
    ? "bg-emerald-500/15 text-emerald-200"
    : status === "rejected"
      ? "bg-red-500/15 text-red-200"
      : status === "detected"
        ? "bg-sky-500/15 text-sky-200"
        : "bg-amber-500/15 text-amber-200";
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${style}`}>{status}</span>;
}

function LeaveCard({ leave }: { leave: LeaveRecord }) {
  const statusStyle = leave.status === "approved" ? "bg-emerald-500/15 text-emerald-200" : leave.status === "rejected" ? "bg-red-500/15 text-red-200" : "bg-amber-500/15 text-amber-200";
  return <article className="rounded-xl border border-white/8 bg-white/[0.035] p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-[#f0dfbd]">{leave.leaveType}</p><p className="mt-1 text-xs text-white/45">{formatMalaysiaDate(leave.startDate)} – {formatMalaysiaDate(leave.endDate)}</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${statusStyle}`}>{leave.status}</span></div><p className="mt-3 text-sm leading-5 text-white/55">{leave.reason}</p></article>;
}

function ProfileRow({ label, value }: { label: string; value?: string }) {
  return <div className="flex items-center justify-between gap-4 py-3"><span className="text-white/40">{label}</span><span className="text-right font-medium text-white/75">{value || "—"}</span></div>;
}
