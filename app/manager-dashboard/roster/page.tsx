"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Employee = {
  id: string;
  employeeCode: string;
  fullName: string;
  department?: string;
  isActive?: boolean;
};

type Shift = {
  employeeId: string;
  date: string;
  isWorkingDay: boolean;
  startTime: string;
  endTime: string;
  breakMinutes: number;
};

type OvertimeRequest = {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  minutes: number;
  clockOut?: string | null;
  status: "pending" | "approved" | "rejected";
};

const dayNames = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function mondayOf(value: Date) {
  const date = new Date(value);
  date.setHours(12, 0, 0, 0);
  const weekday = date.getDay() || 7;
  date.setDate(date.getDate() - weekday + 1);
  return date;
}

function addDays(value: Date, days: number) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
}

function shiftKey(employeeId: string, date: string) {
  return `${employeeId}:${date}`;
}

function defaultShift(employeeId: string, date: string, dayIndex: number): Shift {
  return {
    employeeId,
    date,
    isWorkingDay: dayIndex < 5,
    startTime: "09:00",
    endTime: "18:00",
    breakMinutes: 60,
  };
}

function shiftMinutes(shift: Shift) {
  if (!shift.isWorkingDay) return 0;
  const [startHour, startMinute] = shift.startTime.split(":").map(Number);
  const [endHour, endMinute] = shift.endTime.split(":").map(Number);
  let minutes = endHour * 60 + endMinute - (startHour * 60 + startMinute);
  if (minutes < 0) minutes += 24 * 60;
  return Math.max(0, minutes - Math.max(0, shift.breakMinutes || 0));
}

function malaysiaDate(value: string) {
  return new Intl.DateTimeFormat("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00+08:00`));
}

export default function DutyRosterPage() {
  const router = useRouter();
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [selectedDay, setSelectedDay] = useState(0);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Record<string, Shift>>({});
  const [overtime, setOvertime] = useState<OvertimeRequest[]>([]);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const dates = useMemo(
    () => dayNames.map((_, index) => dateKey(addDays(weekStart, index))),
    [weekStart]
  );

  const loadRoster = useCallback(async () => {
    const token = localStorage.getItem("wc_manager_token");
    const api = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!token) {
      router.push("/manager-login");
      return;
    }
    if (!api) {
      setError("Service is not configured.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [employeeResponse, rosterResponse] = await Promise.all([
        fetch(`${api}/api/manager/employees`, { headers }),
        fetch(
          `${api}/api/manager/duty-roster?weekStart=${encodeURIComponent(
            dateKey(weekStart)
          )}`,
          { headers }
        ),
      ]);
      const employeeData = await employeeResponse.json();
      const rosterData = await rosterResponse.json();
      if (!employeeResponse.ok) {
        throw new Error(employeeData?.message || "Employees could not be loaded.");
      }
      if (!rosterResponse.ok) {
        throw new Error(
          rosterData?.message ||
            "Duty roster API is not deployed yet. Deploy the matching WedgeCLOCKin API update."
        );
      }

      const activeEmployees = (employeeData.employees || []).filter(
        (employee: Employee) => employee.isActive !== false
      );
      const stored = new Map<string, Shift>(
        (rosterData.schedules || []).map((shift: Shift) => [
          shiftKey(shift.employeeId, shift.date),
          shift,
        ])
      );
      const next: Record<string, Shift> = {};
      activeEmployees.forEach((employee: Employee) => {
        dates.forEach((date, index) => {
          const key = shiftKey(employee.id, date);
          next[key] = stored.get(key) || defaultShift(employee.id, date, index);
        });
      });

      setEmployees(activeEmployees);
      setShifts(next);
      setEnabled(Boolean(rosterData.enabled));
      setOvertime(rosterData.overtimeRequests || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Duty roster could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [dates, router, weekStart]);

  useEffect(() => {
    loadRoster();
  }, [loadRoster]);

  function updateShift(employeeId: string, date: string, patch: Partial<Shift>) {
    const key = shiftKey(employeeId, date);
    setShifts((current) => ({
      ...current,
      [key]: { ...current[key], ...patch },
    }));
    setMessage("");
  }

  async function saveRoster() {
    const token = localStorage.getItem("wc_manager_token");
    const api = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!token || !api) {
      setError("Manager session has expired.");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`${api}/api/manager/duty-roster`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enabled,
          weekStart: dateKey(weekStart),
          schedules: Object.values(shifts),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Duty roster could not be saved.");
      }
      setMessage(
        enabled
          ? "Roster saved. Clock-ins will now be compared with the scheduled start time."
          : "Roster saved as optional and disabled. Attendance will not be marked late."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Duty roster could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function decideOvertime(id: string, decision: "approved" | "rejected") {
    const token = localStorage.getItem("wc_manager_token");
    const api = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!token || !api) return;
    setError("");
    try {
      const response = await fetch(`${api}/api/manager/overtime/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ decision }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Overtime decision could not be saved.");
      }
      setOvertime((current) =>
        current.map((request) =>
          request.id === id ? { ...request, status: decision } : request
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Overtime decision failed.");
    }
  }

  const selectedDate = dates[selectedDay];
  const totals = useMemo(
    () =>
      employees.map((employee) => {
        const minutes = dates.reduce(
          (sum, date) =>
            sum + shiftMinutes(shifts[shiftKey(employee.id, date)] || defaultShift(employee.id, date, 0)),
          0
        );
        return { employeeId: employee.id, minutes };
      }),
    [dates, employees, shifts]
  );

  return (
    <main className="min-h-screen bg-[#101416] text-[#f4efe6]">
      <section className="mx-auto max-w-7xl px-6 py-8">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm tracking-[0.35em] text-[#d4ad63]">WEDGECLOCKIN</p>
            <h1 className="mt-2 text-4xl font-bold text-[#f0dfbd]">Duty Roster & OT</h1>
            <p className="mt-2 max-w-3xl text-white/55">
              Optional weekly scheduling in Malaysia time. Once enabled and saved,
              clock-ins are checked against the roster and overtime remains pending
              until a manager approves or rejects it.
            </p>
          </div>
          <button
            onClick={() => router.push("/manager-dashboard")}
            className="rounded-full border border-[#d4ad63]/50 px-6 py-3 font-semibold text-[#f0dfbd]"
          >
            Back to Dashboard
          </button>
        </header>

        <section className="mt-7 rounded-[2rem] border border-[#d4ad63]/25 bg-[#1e2428] p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <label className="flex items-center gap-3 font-semibold text-[#f0dfbd]">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(event) => setEnabled(event.target.checked)}
                className="h-5 w-5 accent-[#d4ad63]"
              />
              Use duty roster for lateness and OT detection
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setWeekStart(addDays(weekStart, -7))}
                className="rounded-full border border-white/15 px-4 py-2 text-white/70"
              >
                Previous week
              </button>
              <span className="rounded-full bg-black/20 px-5 py-2 text-sm text-[#f0dfbd]">
                {malaysiaDate(dates[0])} – {malaysiaDate(dates[6])}
              </span>
              <button
                onClick={() => setWeekStart(addDays(weekStart, 7))}
                className="rounded-full border border-white/15 px-4 py-2 text-white/70"
              >
                Next week
              </button>
            </div>
          </div>
          <p className="mt-4 text-xs leading-5 text-white/40">
            Malaysian safeguard: the dashboard highlights rosters above 45 scheduled
            hours per week. Actual entitlement and OT rates still follow the employee&apos;s
            contract and applicable law; approval creates the payable OT record.
          </p>
        </section>

        {error && (
          <div className="mt-5 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-red-200">
            {error}
          </div>
        )}
        {message && (
          <div className="mt-5 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-emerald-100">
            {message}
          </div>
        )}

        <div className="mt-7 flex gap-2 overflow-x-auto pb-2">
          {dayNames.map((name, index) => (
            <button
              key={name}
              onClick={() => setSelectedDay(index)}
              className={`min-w-32 rounded-2xl border px-4 py-3 text-left ${
                selectedDay === index
                  ? "border-[#d4ad63] bg-[#d4ad63] text-[#101416]"
                  : "border-white/10 bg-white/5 text-white/65"
              }`}
            >
              <span className="block font-bold">{name}</span>
              <span className="mt-1 block text-xs opacity-70">
                {malaysiaDate(dates[index])}
              </span>
            </button>
          ))}
        </div>

        <section className="mt-5 overflow-hidden rounded-[2rem] border border-white/10 bg-[#1e2428]">
          {loading ? (
            <p className="p-8 text-white/55">Loading roster…</p>
          ) : employees.length === 0 ? (
            <p className="p-8 text-white/55">No active employees found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="border-b border-white/10 text-white/45">
                  <tr>
                    <th className="px-5 py-4">Employee</th>
                    <th className="px-5 py-4">Working day</th>
                    <th className="px-5 py-4">Start</th>
                    <th className="px-5 py-4">End</th>
                    <th className="px-5 py-4">Unpaid break</th>
                    <th className="px-5 py-4">Weekly hours</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => {
                    const key = shiftKey(employee.id, selectedDate);
                    const shift = shifts[key] || defaultShift(employee.id, selectedDate, selectedDay);
                    const total = totals.find((item) => item.employeeId === employee.id)?.minutes || 0;
                    return (
                      <tr key={employee.id} className="border-b border-white/5">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-[#f0dfbd]">{employee.fullName}</p>
                          <p className="mt-1 text-xs text-white/40">
                            {employee.employeeCode} · {employee.department || "No department"}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={shift.isWorkingDay}
                              onChange={(event) =>
                                updateShift(employee.id, selectedDate, {
                                  isWorkingDay: event.target.checked,
                                })
                              }
                              className="accent-[#d4ad63]"
                            />
                            {shift.isWorkingDay ? "Scheduled" : "Rest day"}
                          </label>
                        </td>
                        <td className="px-5 py-4">
                          <input
                            type="time"
                            value={shift.startTime}
                            disabled={!shift.isWorkingDay}
                            onChange={(event) =>
                              updateShift(employee.id, selectedDate, {
                                startTime: event.target.value,
                              })
                            }
                            className="rounded-xl border border-white/10 bg-[#101416] px-3 py-2 disabled:opacity-30"
                          />
                        </td>
                        <td className="px-5 py-4">
                          <input
                            type="time"
                            value={shift.endTime}
                            disabled={!shift.isWorkingDay}
                            onChange={(event) =>
                              updateShift(employee.id, selectedDate, {
                                endTime: event.target.value,
                              })
                            }
                            className="rounded-xl border border-white/10 bg-[#101416] px-3 py-2 disabled:opacity-30"
                          />
                        </td>
                        <td className="px-5 py-4">
                          <input
                            type="number"
                            min="0"
                            max="480"
                            step="5"
                            value={shift.breakMinutes}
                            disabled={!shift.isWorkingDay}
                            onChange={(event) =>
                              updateShift(employee.id, selectedDate, {
                                breakMinutes: Math.max(0, Number(event.target.value) || 0),
                              })
                            }
                            className="w-24 rounded-xl border border-white/10 bg-[#101416] px-3 py-2 disabled:opacity-30"
                          />
                          <span className="ml-2 text-xs text-white/40">min</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={total > 2700 ? "font-bold text-amber-300" : "text-white/60"}>
                            {(total / 60).toFixed(1)}h
                          </span>
                          {total > 2700 && <p className="mt-1 text-xs text-amber-300/70">Review above 45h</p>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex justify-end border-t border-white/10 p-5">
            <button
              disabled={saving || loading}
              onClick={saveRoster}
              className="rounded-full bg-[#d4ad63] px-7 py-3 font-bold text-[#101416] disabled:opacity-40"
            >
              {saving ? "Saving…" : "Save Weekly Roster"}
            </button>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-[#1e2428] p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm tracking-[0.25em] text-[#d4ad63]">MANAGER DECISION</p>
              <h2 className="mt-2 text-2xl font-bold text-[#f0dfbd]">Overtime Requests</h2>
            </div>
            <p className="text-sm text-white/40">Only approved OT should flow into payroll.</p>
          </div>
          <div className="mt-5 space-y-3">
            {overtime.length === 0 ? (
              <p className="rounded-2xl bg-black/15 p-5 text-sm text-white/45">
                No overtime requests for this roster week.
              </p>
            ) : (
              overtime.map((request) => (
                <article
                  key={request.id}
                  className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/10 p-5 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div>
                    <p className="font-semibold text-[#f0dfbd]">{request.employeeName}</p>
                    <p className="mt-1 text-sm text-white/50">
                      {malaysiaDate(request.date)} · {(request.minutes / 60).toFixed(2)} hours
                    </p>
                  </div>
                  {request.status === "pending" ? (
                    <div className="flex gap-3">
                      <button
                        onClick={() => decideOvertime(request.id, "approved")}
                        className="rounded-full bg-emerald-500 px-5 py-2 font-bold text-[#07130d]"
                      >
                        Approve OT
                      </button>
                      <button
                        onClick={() => decideOvertime(request.id, "rejected")}
                        className="rounded-full border border-red-400/40 px-5 py-2 font-semibold text-red-200"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span
                      className={`rounded-full px-4 py-2 text-sm font-semibold ${
                        request.status === "approved"
                          ? "bg-emerald-500/10 text-emerald-200"
                          : "bg-red-500/10 text-red-200"
                      }`}
                    >
                      {request.status === "approved" ? "Approved" : "Rejected"}
                    </span>
                  )}
                </article>
              ))
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
