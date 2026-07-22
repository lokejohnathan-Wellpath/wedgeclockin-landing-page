"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  SMARTPOS_TOKEN_KEY,
  smartPosRequest,
  type SmartPosSubscription,
} from "./lib/api";
import {
  BusinessSettingsPanel,
  CustomersPanel,
  InsightsPanel,
  InventoryPanel,
  NewAppointmentForm,
  PosPanel,
  RemindersPanel,
  SalesHistoryPanel,
  StaffPanel,
} from "./OperationsPanels";

type Vertical = "beauty" | "pet";
type Appointment = {
  id: string;
  startAt: string;
  subjectName: string;
  secondaryName?: string;
  serviceName: string;
  staffName: string;
  amount: number;
  status: "CONFIRMED" | "REMINDER_SENT" | "COMPLETED" | "MISSED" | "CANCELLED";
  aiSignal?: "RETURN_DUE" | "ATTENDANCE_RISK" | "LOYAL" | "RECOMMENDATION";
  aiReason?: string;
};
type Dashboard = {
  businessName: string;
  branchName: string;
  appointments: Appointment[];
  expectedSales: number;
  completedCount: number;
  insightCount: number;
  subscription: SmartPosSubscription;
};

const statusStyle: Record<Appointment["status"], string> = {
  CONFIRMED: "border-l-[#4f82b7] bg-[#edf5fb]",
  REMINDER_SENT: "border-l-[#d3a24d] bg-[#fff8e8]",
  COMPLETED: "border-l-[#5e9883] bg-[#eef8f3]",
  MISSED: "border-l-[#c85e5e] bg-[#fff0ef]",
  CANCELLED: "border-l-gray-400 bg-gray-50",
};
const signalStyle: Record<NonNullable<Appointment["aiSignal"]>, string> = {
  RETURN_DUE: "bg-[#e7b84e]",
  ATTENDANCE_RISK: "bg-[#db744e]",
  LOYAL: "bg-[#5e9883]",
  RECOMMENDATION: "bg-[#8b6db1]",
};

export default function SmartPosWorkspace({
  vertical,
}: {
  vertical: Vertical;
}) {
  const router = useRouter();
  const [active, setActive] = useState("Calendar");
  const [data, setData] = useState<Dashboard | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAppointment, setShowAppointment] = useState(false);
  const beauty = vertical === "beauty";
  const nav = [
    "Calendar",
    beauty ? "Clients" : "Owners & Pets",
    "Staff & Commission",
    "Point of Sale",
    "Sales & Receipts",
    "Inventory",
    "Reminders",
    "Insights",
    "Business Settings",
  ];
  const loadDashboard = useCallback(async () => {
    const result = await smartPosRequest<Dashboard>(
      `/api/smartpos/dashboard?vertical=${vertical}`,
    );
    setData(result);
    setSelected((current) => current || result.appointments[0]?.id || null);
  }, [vertical]);
  useEffect(() => {
    if (!localStorage.getItem(SMARTPOS_TOKEN_KEY)) {
      router.replace("/wedge-smartpos/login");
      return;
    }
    loadDashboard()
      .catch((caught) =>
        setError(
          caught instanceof Error ? caught.message : "Could not load your POS.",
        ),
      )
      .finally(() => setLoading(false));
  }, [router, loadDashboard]);
  const appointment = useMemo(
    () => data?.appointments.find((item) => item.id === selected),
    [data, selected],
  );
  async function complete(id: string) {
    try {
      await smartPosRequest(`/api/smartpos/appointments/${id}/complete`, {
        method: "POST",
      });
      setData((current) =>
        current
          ? {
              ...current,
              completedCount: current.completedCount + 1,
              appointments: current.appointments.map((item) =>
                item.id === id ? { ...item, status: "COMPLETED" } : item,
              ),
            }
          : current,
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not update appointment.",
      );
    }
  }
  function logout() {
    localStorage.removeItem(SMARTPOS_TOKEN_KEY);
    router.push("/wedge-smartpos/login");
  }
  if (loading) return <Centered text="Opening your POS..." />;
  if (error && !data)
    return (
      <Centered
        text={error}
        action="Return to Login"
        href="/wedge-smartpos/login"
      />
    );
  if (!data) return null;
  const trial =
    data.subscription.status === "TRIAL" ||
    data.subscription.status === "TRIAL_EXPIRING";
  return (
    <main className="min-h-screen bg-[#eef0ed] text-[#20282c]">
      <header className="border-b border-[#20282c]/10 bg-[#10191d] text-white">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-4">
          <a href="/wedge-smartpos" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d2aa62] font-black text-[#10191d]">
              W
            </span>
            <div>
              <p className="font-semibold">Wedge-SmartPOS</p>
              <p className="text-[9px] tracking-[.18em] text-white/45">
                {beauty ? "BEAUTY & WELLNESS" : "PET CARE"}
              </p>
            </div>
          </a>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-white/55 sm:block">
              {data.businessName} · {data.branchName}
            </span>
            <button
              onClick={logout}
              className="rounded-full border border-white/15 px-4 py-2 text-xs font-bold"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      {trial && (
        <div className="bg-[#d2aa62] px-5 py-2 text-center text-xs font-bold text-[#152024]">
          Free trial: {data.subscription.daysRemaining ?? 0} days remaining ·{" "}
          <a className="underline" href="/wedge-smartpos/payment">
            View subscription
          </a>
        </div>
      )}
      {data.subscription.status === "PAYMENT_REQUIRED" && (
        <div className="bg-[#a64f48] px-5 py-3 text-center text-sm font-bold text-white">
          Your free trial has ended.{" "}
          <a className="underline" href="/wedge-smartpos/payment">
            Subscribe to continue using your POS
          </a>
        </div>
      )}
      <div className="mx-auto grid max-w-[1500px] lg:grid-cols-[230px_1fr]">
        <aside className="border-r border-[#20282c]/10 bg-[#f8f6f1] p-4 lg:min-h-[calc(100vh-73px)]">
          <button
            onClick={() => setShowAppointment(true)}
            className="mb-5 w-full rounded-xl bg-[#d2aa62] px-4 py-3 text-sm font-bold text-[#152024]"
          >
            ＋ New Appointment
          </button>
          <nav className="flex gap-2 overflow-x-auto lg:block">
            {nav.map((item) => (
              <button
                key={item}
                onClick={() => setActive(item)}
                className={`mb-1 whitespace-nowrap rounded-lg px-4 py-3 text-left text-sm lg:w-full ${active === item ? "bg-[#20282c] font-bold text-white" : "text-[#5d686c] hover:bg-[#20282c]/5"}`}
              >
                {item}
              </button>
            ))}
          </nav>
          <a
            href="/wedge-smartpos/payment"
            className="mt-6 block rounded-xl border border-[#20282c]/10 bg-white p-4 text-sm font-bold"
          >
            Subscription & Payment →
          </a>
        </aside>
        <section className="p-5 sm:p-7 lg:p-9">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold tracking-[.2em] text-[#5e8983]">
                TODAY
              </p>
              <h1 className="mt-2 font-serif text-4xl">{active}</h1>
              <p className="mt-2 text-sm text-[#6d777a]">
                {beauty
                  ? "Clients, staff and appointments at a glance."
                  : "Owners, pets and grooming appointments at a glance."}
              </p>
            </div>
            <button className="rounded-lg border border-[#20282c]/10 bg-white px-4 py-2.5 text-sm font-semibold">
              Today
            </button>
          </div>
          {error && (
            <p className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
          {active === "Calendar" ? (
            <>
              <div className="mt-7 grid gap-4 sm:grid-cols-3">
                <Metric
                  label="Today's appointments"
                  value={String(data.appointments.length)}
                  note={`${data.completedCount} completed`}
                />
                <Metric
                  label="Expected sales"
                  value={money(data.expectedSales)}
                  note="Before products and tips"
                />
                <Metric
                  label="Customer signals"
                  value={String(data.insightCount)}
                  note="Wedge AI monitored"
                />
              </div>
              <div className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_.75fr]">
                <div className="rounded-2xl border border-[#20282c]/10 bg-white p-4 shadow-sm sm:p-6">
                  <div>
                    <h2 className="font-bold">Today&apos;s appointments</h2>
                    <p className="mt-1 text-xs text-[#7a8386]">
                      Appointment colour with a small AI indicator
                    </p>
                  </div>
                  {data.appointments.length ? (
                    <div className="mt-5 space-y-3">
                      {data.appointments.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setSelected(item.id)}
                          className={`grid w-full grid-cols-[58px_1fr_auto] items-center gap-3 rounded-xl border-l-4 p-3 text-left ${statusStyle[item.status]} ${selected === item.id ? "ring-2 ring-[#20282c]/15" : ""}`}
                        >
                          <b>
                            {new Date(item.startAt).toLocaleTimeString(
                              "en-MY",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                                timeZone: "Asia/Kuala_Lumpur",
                              },
                            )}
                          </b>
                          <span>
                            <span className="flex items-center gap-2 font-semibold">
                              {item.subjectName}
                              {item.secondaryName
                                ? ` · ${item.secondaryName}`
                                : ""}
                              {item.aiSignal && (
                                <span
                                  title={item.aiReason || "Customer insight"}
                                  className={`h-2.5 w-2.5 rounded-full ${signalStyle[item.aiSignal]}`}
                                />
                              )}
                            </span>
                            {(item.serviceName || item.staffName) && (
                              <span className="mt-1 block text-xs text-[#677175]">
                                {[item.serviceName, item.staffName]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </span>
                            )}
                          </span>
                          <span className="text-right">
                            <b>
                              {item.amount > 0
                                ? money(item.amount)
                                : "Price pending"}
                            </b>
                            <span className="mt-1 block text-[10px] font-bold">
                              {item.status.replaceAll("_", " ")}
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <Empty
                      vertical={vertical}
                      onAdd={() => setShowAppointment(true)}
                    />
                  )}
                </div>
                <aside className="space-y-4">
                  <div className="rounded-2xl bg-[#132126] p-6 text-white">
                    <p className="text-[10px] font-bold tracking-[.2em] text-[#d2aa62]">
                      WEDGE AI INSIGHT
                    </p>
                    {appointment ? (
                      <>
                        <h3 className="mt-4 font-serif text-2xl">
                          {appointment.subjectName}
                        </h3>
                        <p className="mt-3 text-sm leading-6 text-white/65">
                          {appointment.aiReason ||
                            "Customer spending and attendance patterns will appear here when enough history is available."}
                        </p>
                        <button className="mt-5 w-full rounded-lg bg-[#d2aa62] px-3 py-2.5 text-xs font-bold text-[#152024]">
                          Review Suggested Action
                        </button>
                      </>
                    ) : (
                      <p className="mt-4 text-sm leading-6 text-white/55">
                        Select an appointment to view customer insights.
                      </p>
                    )}
                  </div>
                  {appointment && (
                    <div className="rounded-2xl border border-[#20282c]/10 bg-white p-5">
                      <p className="text-xs font-bold text-[#6c7679]">
                        SELECTED APPOINTMENT
                      </p>
                      {appointment.serviceName && (
                        <p className="mt-3 font-semibold">
                          {appointment.serviceName}
                        </p>
                      )}
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <button
                          disabled={appointment.status === "COMPLETED"}
                          onClick={() => complete(appointment.id)}
                          className="rounded-lg bg-[#5e8983] px-3 py-2.5 text-xs font-bold text-white disabled:opacity-40"
                        >
                          Complete Appointment
                        </button>
                        <button
                          onClick={() => setActive("Point of Sale")}
                          className="rounded-lg border border-[#20282c]/10 px-3 py-2.5 text-xs font-bold"
                        >
                          Open POS
                        </button>
                      </div>
                    </div>
                  )}
                </aside>
              </div>
            </>
          ) : (
            <div className="mt-7">
              {(active === "Clients" || active === "Owners & Pets") && (
                <CustomersPanel vertical={vertical} />
              )}{" "}
              {active === "Staff & Commission" && <StaffPanel />}{" "}
              {active === "Point of Sale" && <PosPanel />}{" "}
              {active === "Sales & Receipts" && <SalesHistoryPanel />}{" "}
              {active === "Inventory" && <InventoryPanel />}{" "}
              {active === "Reminders" && <RemindersPanel />}{" "}
              {active === "Insights" && <InsightsPanel />}{" "}
              {active === "Business Settings" && <BusinessSettingsPanel />}
            </div>
          )}
        </section>
      </div>
      {showAppointment && (
        <NewAppointmentForm
          vertical={vertical}
          onCancel={() => setShowAppointment(false)}
          onDone={() => {
            setShowAppointment(false);
            setActive("Calendar");
            loadDashboard().catch((caught) =>
              setError(
                caught instanceof Error
                  ? caught.message
                  : "Could not refresh calendar.",
              ),
            );
          }}
        />
      )}
    </main>
  );
}

const money = (value: number) =>
  new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR" }).format(
    value || 0,
  );
function Metric({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-2xl border border-[#20282c]/10 bg-white p-5 shadow-sm">
      <p className="text-xs text-[#6d777a]">{label}</p>
      <p className="mt-2 font-serif text-3xl">{value}</p>
      <p className="mt-2 text-xs text-[#8a9294]">{note}</p>
    </div>
  );
}
function Empty({ vertical, onAdd }: { vertical: Vertical; onAdd: () => void }) {
  return (
    <div className="mt-8 rounded-2xl border border-dashed border-[#20282c]/15 bg-[#faf9f6] px-5 py-12 text-center">
      <p className="font-serif text-2xl">No appointments yet</p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#6d777a]">
        Add your first{" "}
        {vertical === "beauty"
          ? "client and appointment"
          : "owner, pet and grooming appointment"}{" "}
        to begin.
      </p>
      <button
        onClick={onAdd}
        className="mt-5 rounded-xl bg-[#20282c] px-5 py-3 text-sm font-bold text-white"
      >
        ＋ Add First Appointment
      </button>
    </div>
  );
}
function Centered({
  text,
  action,
  href,
}: {
  text: string;
  action?: string;
  href?: string;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f3efe7] p-6 text-center text-[#20282c]">
      <div>
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#20282c] font-black text-[#f1dfbc]">
          W
        </span>
        <p className="mt-5 font-semibold">{text}</p>
        {action && href && (
          <a
            href={href}
            className="mt-5 inline-block rounded-xl bg-[#20282c] px-5 py-3 text-sm font-bold text-white"
          >
            {action}
          </a>
        )}
      </div>
    </main>
  );
}
