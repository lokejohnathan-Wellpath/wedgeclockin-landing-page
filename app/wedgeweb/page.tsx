"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { type V5Decision } from "./engine/v5DesignEngine";
import { interpretV6 } from "./engine/v6DesignEngine";
import {
  clearWedgeWebBrowserMemory,
  readBrowserValue,
  saveBrowserValue,
  V6_DRAFT_KEY,
  V6_HISTORY_KEY,
  V6_CONVERSATION_KEY,
  V6_TERMS_KEY,
} from "./engine/browserMemory";
import { recordFeedback } from "./engine/feedbackQueue";
import {
  DEFAULT_WEDGE_PACKAGE,
  WEDGE_PACKAGE_STORAGE_KEY,
  type WedgePackageConfig,
} from "../lib/wedgePackages";

type Offering = { name: string; price: string; description: string };
type SiteDraft = {
  businessName: string;
  industry: string;
  tagline: string;
  pageLabel: string;
  heroTitle: string;
  primaryCta: string;
  secondaryCta: string;
  heroLayout: "text-left" | "image-left" | "background" | "image-top" | "text-top";
  heroTextAlign: "left" | "center" | "right";
  description: string;
  whatsapp: string;
  phone: string;
  address: string;
  hours: string;
  facebook: string;
  instagram: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  boldText: boolean;
  watermark: boolean;
  headingFont: string;
  bodyFont: string;
  buttonRadius: number;
  cardRadius: number;
  imageOverlay: number;
  styleName: string;
  photos: string[];
  logo: string;
  heroZoom: number;
  heroX: number;
  heroY: number;
  heroFit: "cover" | "contain";
  heroMobileZoom: number;
  heroMobileX: number;
  heroMobileY: number;
  logoSize: number;
  logoX: number;
  logoY: number;
  logoOpacity: number;
  logoShape: "original" | "rounded" | "circle";
  logoMobileSize: number;
  logoMobileX: number;
  logoMobileY: number;
  useStandardPrivacy: boolean;
  privacyAccepted: boolean;
  privacyExtra: string;
  offerings: Offering[];
};
type PreviewPage = "home" | "offerings" | "contact" | "privacy";

const STORAGE_KEY = "wedgeweb_draft_v1";
const defaultDraft: SiteDraft = {
  businessName: "",
  industry: "Salon & Spa",
  tagline: "",
  pageLabel: "Services",
  heroTitle: "",
  primaryCta: "Explore",
  secondaryCta: "WhatsApp Us",
  heroLayout: "text-left",
  heroTextAlign: "left",
  description: "",
  whatsapp: "",
  phone: "",
  address: "",
  hours: "Monday – Saturday, 10:00 AM – 7:00 PM",
  facebook: "",
  instagram: "",
  primaryColor: "#b58a72",
  secondaryColor: "#6f8f7c",
  backgroundColor: "#fffaf5",
  textColor: "#282321",
  boldText: false,
  watermark: false,
  headingFont: "Playfair Display",
  bodyFont: "Inter",
  buttonRadius: 999,
  cardRadius: 28,
  imageOverlay: 0.16,
  styleName: "Warm Contemporary",
  photos: Array(20).fill(""),
  logo: "",
  heroZoom: 100,
  heroX: 50,
  heroY: 50,
  heroFit: "cover",
  heroMobileZoom: 100,
  heroMobileX: 50,
  heroMobileY: 50,
  logoSize: 72,
  logoX: 0,
  logoY: 0,
  logoOpacity: 100,
  logoShape: "original",
  logoMobileSize: 64,
  logoMobileX: 0,
  logoMobileY: 0,
  useStandardPrivacy: true,
  privacyAccepted: false,
  privacyExtra: "",
  offerings: [{ name: "", price: "", description: "" }],
};

const industryWords: Record<
  string,
  { page: string; verb: string; fallback: string }
> = {
  "Salon & Spa": {
    page: "Treatments",
    verb: "Book",
    fallback:
      "Thoughtful treatments designed around your comfort and confidence.",
  },
  "Slimming & Wellness Centre": {
    page: "Programmes",
    verb: "Book a Consultation",
    fallback:
      "Supportive wellness programmes shaped around your goals, comfort and confidence.",
  },
  "Food & Beverage": {
    page: "Menu",
    verb: "Order",
    fallback: "Fresh favourites, prepared with care and made to be enjoyed.",
  },
  Retail: {
    page: "Products",
    verb: "Enquire",
    fallback:
      "Quality products selected to make everyday life a little better.",
  },
  "Specialty Shop": {
    page: "Collections",
    verb: "Enquire",
    fallback:
      "Distinctive finds selected with personality, quality and local customers in mind.",
  },
  "Workshops & Classes": {
    page: "Classes",
    verb: "Reserve a Place",
    fallback:
      "Friendly, practical sessions where people can learn, create and grow together.",
  },
  "Guest House & Homestay": {
    page: "Rooms",
    verb: "Check Availability",
    fallback:
      "A comfortable local stay with thoughtful hospitality and a welcoming sense of place.",
  },
  "Pet Spa & Grooming": {
    page: "Pet Services",
    verb: "Book",
    fallback:
      "Gentle grooming and caring treatments that help every pet look and feel their best.",
  },
  "Professional Services": {
    page: "Services",
    verb: "Enquire",
    fallback:
      "Practical, dependable service for people and growing businesses.",
  },
  "Home & Repair": {
    page: "Services",
    verb: "Get a Quote",
    fallback:
      "Reliable workmanship and straightforward support when you need it.",
  },
  Other: {
    page: "Products & Services",
    verb: "Enquire",
    fallback:
      "A local business committed to helpful service and lasting relationships.",
  },
};

export default function WedgeWebPage() {
  const [draft, setDraft] = useState<SiteDraft>(defaultDraft);
  const [page, setPage] = useState<PreviewPage>("home");
  const [mode, setMode] = useState<"build" | "preview">("build");
  const [message, setMessage] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [designPrompt, setDesignPrompt] = useState("");
  const [designReply, setDesignReply] = useState(
    "Tell me how you want the website to look.",
  );
  const [designDecision, setDesignDecision] = useState<V5Decision | null>(null);
  const [designPulse, setDesignPulse] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [history, setHistory] = useState<SiteDraft[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [memoryStatus, setMemoryStatus] = useState("Opening local memory…");
  const [confirmedTerms, setConfirmedTerms] = useState<Record<string, string>>(
    {},
  );
  const [conversation, setConversation] = useState<
    Array<{ role: "user" | "assistant"; text: string }>
  >([]);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      let old = await readBrowserValue<Partial<SiteDraft>>(V6_DRAFT_KEY).catch(
        () => null,
      );
      if (!old) {
        const legacy = localStorage.getItem(STORAGE_KEY);
        if (legacy) {
          try {
            old = JSON.parse(legacy);
          } catch {
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      }
      if (old) {
        const photos = Array(20).fill("");
        if (Array.isArray(old.photos))
          old.photos.slice(0, 20).forEach((photo, index) => {
            photos[index] = photo;
          });
        else if ((old as { heroImage?: string }).heroImage)
          photos[0] = (old as { heroImage: string }).heroImage;
        setDraft({
          ...defaultDraft,
          ...old,
          primaryColor: old.primaryColor || defaultDraft.primaryColor,
          photos,
        });
      }
      const savedHistory = await readBrowserValue<SiteDraft[]>(
        V6_HISTORY_KEY,
      ).catch(() => null);
      if (savedHistory?.length) {
        setHistory(savedHistory.slice(-20));
        setHistoryIndex(Math.min(savedHistory.length, 20) - 1);
      }
      try {
        setConfirmedTerms(
          JSON.parse(localStorage.getItem(V6_TERMS_KEY) || "{}"),
        );
      } catch {
        localStorage.removeItem(V6_TERMS_KEY);
      }
      const savedConversation = await readBrowserValue<
        Array<{ role: "user" | "assistant"; text: string }>
      >(V6_CONVERSATION_KEY).catch(() => null);
      if (savedConversation?.length) {
        setConversation(savedConversation.slice(-12));
        const lastAssistant = [...savedConversation]
          .reverse()
          .find((item) => item.role === "assistant");
        if (lastAssistant) setDesignReply(lastAssistant.text);
      }
      setMemoryStatus("Saved privately on this device");
      setLoaded(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    setMemoryStatus("Saving on this device…");
    const timer = window.setTimeout(async () => {
      await saveBrowserValue(V6_DRAFT_KEY, draft).catch(() => null);
      setMemoryStatus("Saved privately on this device");
    }, 650);
    return () => window.clearTimeout(timer);
  }, [draft, loaded]);

  const inferredProfile = useMemo(
    () =>
      inferBusinessProfile(
        `${draft.businessName} ${draft.tagline} ${draft.description} ${draft.offerings.map((item) => item.name).join(" ")}`,
      ),
    [draft.businessName, draft.tagline, draft.description, draft.offerings],
  );
  const inferredWords = industryWords[inferredProfile.category] || industryWords.Other;
  const words = { ...inferredWords, page: draft.pageLabel || inferredWords.page };
  const complete = Boolean(
    draft.businessName.trim() &&
      draft.description.trim() &&
      draft.whatsapp.trim() &&
      draft.offerings.some((item) => item.name.trim()),
  );
  const whatsappUrl = useMemo(() => {
    const number = draft.whatsapp.replace(/\D/g, "");
    const text = `Hi ${draft.businessName || "there"}, I found you through your WedgeWeb website. I would like to know more.`;
    return number
      ? `https://wa.me/${number}?text=${encodeURIComponent(text)}`
      : "#";
  }, [draft.businessName, draft.whatsapp]);
  const facebookUrl = useMemo(
    () => externalUrl(draft.facebook),
    [draft.facebook],
  );
  const instagramUrl = useMemo(
    () => externalUrl(draft.instagram),
    [draft.instagram],
  );

  function update<K extends keyof SiteDraft>(key: K, value: SiteDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setMessage("");
  }
  function updateOffering(index: number, key: keyof Offering, value: string) {
    setDraft((current) => ({
      ...current,
      offerings: current.offerings.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    }));
  }
  async function saveDraft() {
    try {
      await saveBrowserValue(V6_DRAFT_KEY, draft);
      setMessage("Draft and photos saved privately on this device.");
      setMemoryStatus("Saved privately on this device");
    } catch {
      setMessage(
        "This browser could not save the draft. Remove a few photos or check browser storage permissions.",
      );
    }
  }
  function generate(event: FormEvent) {
    event.preventDefault();
    if (!complete) {
      setMessage(
        "Add your business name, introduction, WhatsApp number and at least one offering.",
      );
      return;
    }
    if (!draft.privacyAccepted) {
      setMessage("Review and confirm the personalised Privacy Policy before generating the final preview.");
      return;
    }
    saveDraft();
    setMode("preview");
    setPage("home");
  }
  function uploadImage(event: ChangeEvent<HTMLInputElement>, slot: number) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 8_000_000) {
      setMessage("Each original photo must be smaller than 8 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const max = 720;
        const scale = Math.min(1, max / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        canvas
          .getContext("2d")
          ?.drawImage(image, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL("image/jpeg", 0.68);
        setDraft((current) => ({
          ...current,
          photos: current.photos.map((photo, index) =>
            index === slot ? compressed : photo,
          ),
        }));
      };
      image.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  }

  function uploadLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 4_000_000) {
      setMessage("The logo must be smaller than 4 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => update("logo", String(reader.result || ""));
    reader.readAsDataURL(file);
  }

  function applyDesignPrompt(event: FormEvent) {
    event.preventDefault();
    if (!designPrompt.trim()) return;
    const decision = interpretV6(designPrompt, inferredProfile.category, draft, {
      lastStyle: draft.styleName,
      confirmedTerms,
    });
    setDesignDecision(decision);
    const responseText =
      decision.status === "apply"
        ? [decision.reply, ...decision.warnings].join(" ")
        : decision.reply;
    const nextConversation = [
      ...conversation,
      { role: "user" as const, text: designPrompt },
      { role: "assistant" as const, text: responseText },
    ].slice(-12);
    setConversation(nextConversation);
    saveBrowserValue(V6_CONVERSATION_KEY, nextConversation).catch(() => null);
    if (decision.status === "apply") {
      applyDesignChanges(decision.changes);
      setDesignReply([decision.reply, ...decision.warnings].join(" "));
      setDesignPulse(true);
      window.setTimeout(() => setDesignPulse(false), 2200);
      setDesignPrompt("");
    } else {
      setDesignReply(decision.reply);
    }
  }

  function confirmDesign() {
    if (!designDecision) return;
    recordFeedback({
      instruction: designPrompt,
      suggestedStyle: designDecision.detectedStyle,
      industry: inferredProfile.category,
      confirmedAt: new Date().toISOString(),
    });
    const termKey = designPrompt
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9#]+/g, " ")
      .trim();
    const learned = {
      ...confirmedTerms,
      [termKey]: designDecision.detectedStyle,
    };
    setConfirmedTerms(learned);
    localStorage.setItem(V6_TERMS_KEY, JSON.stringify(learned));
    applyDesignChanges(designDecision.changes);
    setDesignReply(
      [
        `Confirmed. I applied “${designDecision.detectedStyle}”.`,
        ...designDecision.warnings,
      ].join(" "),
    );
    const confirmationText = [
      `Confirmed. I applied “${designDecision.detectedStyle}”.`,
      ...designDecision.warnings,
    ].join(" ");
    const nextConversation = [
      ...conversation,
      { role: "assistant" as const, text: confirmationText },
    ].slice(-12);
    setConversation(nextConversation);
    saveBrowserValue(V6_CONVERSATION_KEY, nextConversation).catch(() => null);
    setDesignDecision(null);
    setDesignPrompt("");
    setDesignPulse(true);
    window.setTimeout(() => setDesignPulse(false), 2200);
  }

  function applyDesignChanges(changes: Partial<SiteDraft>) {
    const next = { ...draft, ...changes };
    const baseHistory = history.length
      ? history.slice(0, historyIndex + 1)
      : [draft];
    const nextHistory = [...baseHistory, next].slice(-20);
    setDraft(next);
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
    saveBrowserValue(V6_HISTORY_KEY, nextHistory).catch(() => null);
  }

  function undoDesign() {
    if (historyIndex <= 0) return;
    const index = historyIndex - 1;
    setHistoryIndex(index);
    setDraft(history[index]);
  }
  function redoDesign() {
    if (historyIndex >= history.length - 1) return;
    const index = historyIndex + 1;
    setHistoryIndex(index);
    setDraft(history[index]);
  }

  async function startOver() {
    if (
      !window.confirm(
        "Start over and remove this draft, uploaded photos and saved design choices from this device?",
      )
    )
      return;
    await clearWedgeWebBrowserMemory();
    setDraft(defaultDraft);
    setHistory([]);
    setHistoryIndex(-1);
    setConfirmedTerms({});
    setConversation([]);
    setDesignPrompt("");
    setDesignDecision(null);
    setDesignReply(
      "Your previous draft has been removed. Tell me how you want the new website to feel.",
    );
    setMessage(
      "Everything from the previous WedgeWeb draft was deleted from this device.",
    );
    setMemoryStatus("Fresh draft · nothing saved yet");
    setMode("build");
  }

  if (!loaded)
    return (
      <main className="min-h-screen bg-[#090d10] p-10 text-white/50">
        Opening WedgeWeb…
      </main>
    );

  return (
    <main
      className="min-h-screen bg-[#0D1316] text-[#F4EFE6]"
      style={{
        background:
          "radial-gradient(circle at 15% 5%, rgba(210,170,98,.10), transparent 30%), radial-gradient(circle at 90% 30%, rgba(94,137,131,.08), transparent 32%), #0D1316",
      }}
    >
      <header className="border-b border-white/8">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="font-bold text-[#f1dfbc]">
            Wedge Works <span className="text-[#c8a467]">/ WedgeWeb V6</span>
          </Link>
          <div className="flex gap-2">
            <button
              onClick={startOver}
              className="rounded-full border-2 border-[#C86A70] bg-[#8F3036] px-4 py-2 text-sm font-bold text-white shadow-lg hover:bg-[#A63B42] focus:outline-none focus:ring-2 focus:ring-white"
            >
              ↻ Start Over
            </button>
            <button
              onClick={() => setMode("build")}
              className={`rounded-full px-4 py-2 text-sm ${mode === "build" ? "bg-[#c8a467] text-[#111416]" : "border border-white/10 text-white/55"}`}
            >
              Build
            </button>
            <button
              onClick={() => setMode("preview")}
              className={`rounded-full px-4 py-2 text-sm ${mode === "preview" ? "bg-[#c8a467] text-[#111416]" : "border border-white/10 text-white/55"}`}
            >
              Preview
            </button>
          </div>
        </div>
      </header>

      {mode === "build" ? (
        <section className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[.9fr_1.1fr]">
          <div>
            <p className="text-xs font-semibold tracking-[.3em] text-[#c8a467]">
              DETERMINISTIC DESIGN INTELLIGENCE
            </p>
            <h1 className="mt-4 text-4xl font-bold text-[#f1dfbc]">
              Tell us about your business.
            </h1>
            <p className="mt-4 max-w-xl leading-7 text-white/50">
              Create a professional three-page website without domains, hosting
              or code. Your draft and preview are free.
            </p>
            <div className="mt-7 rounded-3xl border border-[#c8a467]/20 bg-[#151b1f] p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[#f1dfbc]">
                  Business Setup Progress
                </p>
                <span className="text-[10px] text-white/35">
                  {memoryStatus}
                </span>
              </div>
              <div className="mt-4 grid gap-2 text-xs">
                {[
                  [
                    "Business details",
                    Boolean(draft.businessName && draft.description),
                  ],
                  ["WhatsApp", Boolean(draft.whatsapp)],
                  ["Facebook visitor button", Boolean(draft.facebook)],
                  ["Instagram visitor button", Boolean(draft.instagram)],
                  ["Location", Boolean(draft.address)],
                  [
                    "Products / services",
                    draft.offerings.some((item) => Boolean(item.name)),
                  ],
                  ["Photos", draft.photos.some(Boolean)],
                  ["Privacy policy", draft.privacyAccepted],
                ].map(([label, done]) => (
                  <div
                    key={String(label)}
                    className="flex items-center justify-between rounded-xl bg-black/15 px-3 py-2"
                  >
                    <span className="text-white/55">{label}</span>
                    <span
                      className={
                        done ? "text-emerald-300" : "text-amber-200/60"
                      }
                    >
                      {done ? "Complete" : "Optional / missing"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <form
              onSubmit={applyDesignPrompt}
              className="mt-5 rounded-3xl border border-[#c8a467]/20 bg-[#151b1f] p-5"
            >
              <p className="text-sm font-semibold text-[#f1dfbc]">
                Design Assistant
              </p>
              <div className="mt-3 rounded-2xl bg-black/20 p-4 text-sm leading-6 text-white/55">
                {conversation.length ? (
                  <div className="max-h-56 space-y-3 overflow-y-auto">
                    {conversation.slice(-6).map((item, index) => (
                      <div
                        key={`${item.role}-${index}`}
                        className={
                          item.role === "user"
                            ? "ml-8 rounded-xl bg-[#c8a467]/10 px-3 py-2 text-[#ead7af]"
                            : "mr-5 rounded-xl bg-white/5 px-3 py-2 text-white/60"
                        }
                      >
                        <span className="mb-1 block text-[9px] font-bold uppercase tracking-wider opacity-45">
                          {item.role === "user" ? "You" : "Design Assistant"}
                        </span>
                        {item.text}
                      </div>
                    ))}
                  </div>
                ) : (
                  designReply
                )}
              </div>
              {designDecision?.status === "confirm" && (
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={confirmDesign}
                    className="rounded-full bg-[#c8a467] px-4 py-2 text-xs font-bold text-[#111416]"
                  >
                    Yes, apply it
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDesignDecision(null);
                      setDesignReply(
                        "No problem—describe the direction in another way.",
                      );
                    }}
                    className="rounded-full border border-white/15 px-4 py-2 text-xs text-white/60"
                  >
                    No, let me explain
                  </button>
                </div>
              )}
              <textarea
                value={designPrompt}
                onChange={(event) => setDesignPrompt(event.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Describe a cultural style, mood, business vibe, colours or typography…"
                className={inputClass}
              />
              <button
                disabled={!designPrompt.trim()}
                className="mt-3 w-full rounded-full bg-[#c8a467] px-5 py-3 font-bold text-[#111416] disabled:cursor-not-allowed disabled:opacity-45"
              >
                Interpret Design Direction
              </button>
            </form>
            <div
              className={`mt-5 rounded-3xl border bg-[#151b1f] p-5 transition ${designPulse ? "border-[#e5c37f] shadow-[0_0_35px_rgba(212,173,99,.35)]" : "border-white/10"}`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[#f1dfbc]">
                  Design Intelligence
                </p>
                <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-[10px] text-emerald-200">
                  WCAG guarded
                </span>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <dt className="text-white/35">Detected style</dt>
                  <dd className="mt-1 text-white/75">{draft.styleName}</dd>
                </div>
                <div>
                  <dt className="text-white/35">Confidence</dt>
                  <dd className="mt-1 text-white/75">
                    {designDecision?.confidence
                      ? `${designDecision.confidence}%`
                      : "Ready"}
                  </dd>
                </div>
                <div>
                  <dt className="text-white/35">Heading</dt>
                  <dd className="mt-1 text-white/75">{draft.headingFont}</dd>
                </div>
                <div>
                  <dt className="text-white/35">Body</dt>
                  <dd className="mt-1 text-white/75">{draft.bodyFont}</dd>
                </div>
              </dl>
              <div className="mt-4 flex gap-2">
                {[
                  draft.primaryColor,
                  draft.secondaryColor,
                  draft.backgroundColor,
                  draft.textColor,
                ].map((colour, index) => (
                  <span
                    key={`${colour}-${index}`}
                    title={colour}
                    className="h-9 flex-1 rounded-lg border border-white/10"
                    style={{ backgroundColor: colour }}
                  />
                ))}
              </div>
              <div className="mt-2 flex justify-between text-[9px] uppercase text-white/30">
                <span>{draft.primaryColor}</span>
                <span>{draft.textColor}</span>
              </div>
              <div className="mt-4 flex gap-2 border-t border-white/8 pt-4">
                <button
                  type="button"
                  onClick={undoDesign}
                  disabled={historyIndex <= 0}
                  className="flex-1 rounded-full border border-white/12 px-3 py-2 text-xs text-white/60 disabled:opacity-25"
                >
                  ← Undo
                </button>
                <button
                  type="button"
                  onClick={redoDesign}
                  disabled={
                    historyIndex < 0 || historyIndex >= history.length - 1
                  }
                  className="flex-1 rounded-full border border-white/12 px-3 py-2 text-xs text-white/60 disabled:opacity-25"
                >
                  Redo →
                </button>
                <span className="self-center text-[10px] text-white/30">
                  {history.length
                    ? `${historyIndex + 1}/${history.length}`
                    : "No history"}
                </span>
              </div>
            </div>
          </div>
          <form
            onSubmit={generate}
            className="space-y-5 rounded-[2rem] border border-white/10 bg-[#151b1f] p-6 sm:p-8"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Business name"
                value={draft.businessName}
                onChange={(value) => update("businessName", value)}
                placeholder="Serenity Spa"
              />
              <Field
                label="Customer tagline"
                value={draft.tagline}
                onChange={(value) => update("tagline", value)}
                placeholder="Confidence starts with feeling good"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Products / services page name"
                value={draft.pageLabel}
                onChange={(value) => update("pageLabel", value)}
                placeholder={inferredWords.page}
              />
              <div className="rounded-2xl border border-[#5E8983]/25 bg-[#5E8983]/8 p-4 text-xs leading-5 text-white/55">
                <span className="font-semibold text-[#B9D7D2]">Smart profile:</span>{" "}
                {inferredProfile.category} · {inferredProfile.confidence}% confidence. Suggested page: {inferredWords.page}.
              </div>
            </div>
            <label className="block text-sm text-white/65">
              Introduce your business
              <textarea
                value={draft.description}
                onChange={(event) => update("description", event.target.value)}
                placeholder={words.fallback}
                rows={4}
                className={inputClass}
              />
            </label>
            <div className="rounded-3xl border border-white/10 bg-black/10 p-5">
              <h2 className="font-bold text-[#F1DFBC]">Homepage hero wording</h2>
              <p className="mt-1 text-xs text-white/40">Every visible hero phrase can also be amended from Live Preview.</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Main headline" value={draft.heroTitle} onChange={(value) => update("heroTitle", value)} placeholder={`Welcome to ${draft.businessName || "your business"}.`} />
                <Field label="Main button wording" value={draft.primaryCta} onChange={(value) => update("primaryCta", value)} placeholder={`Explore ${words.page}`} />
                <Field label="Second button wording" value={draft.secondaryCta} onChange={(value) => update("secondaryCta", value)} placeholder="WhatsApp Us" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="WhatsApp number"
                value={draft.whatsapp}
                onChange={(value) => update("whatsapp", value)}
                placeholder="60123456789"
              />
              <Field
                label="Telephone"
                value={draft.phone}
                onChange={(value) => update("phone", value)}
                placeholder="Optional"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Address"
                value={draft.address}
                onChange={(value) => update("address", value)}
                placeholder="Ipoh, Perak"
              />
              <Field
                label="Opening hours"
                value={draft.hours}
                onChange={(value) => update("hours", value)}
                placeholder="Mon–Sat, 10am–7pm"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Facebook URL"
                value={draft.facebook}
                onChange={(value) => update("facebook", value)}
                placeholder="Optional"
              />
              <Field
                label="Instagram URL"
                value={draft.instagram}
                onChange={(value) => update("instagram", value)}
                placeholder="Optional"
              />
            </div>
            <div>
              <h2 className="font-bold text-[#f1dfbc]">
                Website design tokens
              </h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <ColorField
                  label="Primary"
                  value={draft.primaryColor}
                  onChange={(value) => update("primaryColor", value)}
                />
                <ColorField
                  label="Secondary"
                  value={draft.secondaryColor}
                  onChange={(value) => update("secondaryColor", value)}
                />
                <ColorField
                  label="Background"
                  value={draft.backgroundColor}
                  onChange={(value) => update("backgroundColor", value)}
                />
                <ColorField
                  label="Text"
                  value={draft.textColor}
                  onChange={(value) => update("textColor", value)}
                />
              </div>
              <div className="mt-4 grid gap-3 rounded-2xl border border-white/8 bg-black/10 p-4 text-xs text-white/55 sm:grid-cols-2">
                <span>
                  Heading: <b className="text-white/75">{draft.headingFont}</b>
                </span>
                <span>
                  Body: <b className="text-white/75">{draft.bodyFont}</b>
                </span>
              </div>
              <label className="mt-4 flex items-center gap-3 text-sm text-white/60">
                <input
                  type="checkbox"
                  checked={draft.boldText}
                  onChange={(event) => update("boldText", event.target.checked)}
                  className="accent-[#c8a467]"
                />
                Make all website wording bold
              </label>
              <label className="mt-3 flex items-center gap-3 text-sm text-white/60">
                <input
                  type="checkbox"
                  checked={draft.watermark}
                  onChange={(event) =>
                    update("watermark", event.target.checked)
                  }
                  className="accent-[#c8a467]"
                />
                Use Photo 1 as a subtle watermark
              </label>
            </div>
            <div>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="font-bold text-[#f1dfbc]">Photo library</h2>
                  <p className="mt-1 text-xs text-white/40">
                    Photo 1 is the main background. Photos 2–20 match your
                    products/services in order.
                  </p>
                </div>
                <span className="text-xs text-[#c8a467]">
                  {draft.photos.filter(Boolean).length}/20
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {draft.photos.map((photo, index) => (
                  <label
                    key={index}
                    className="group relative aspect-square cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-[#0c1114]"
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => uploadImage(event, index)}
                      className="sr-only"
                    />
                    {photo ? (
                      <img
                        src={photo}
                        alt={`Photo ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center text-xs text-white/30">
                        Upload
                      </span>
                    )}
                    <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-bold text-white">
                      {index + 1}
                    </span>
                    {photo && (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          setDraft((current) => ({
                            ...current,
                            photos: current.photos.map((item, itemIndex) =>
                              itemIndex === index ? "" : item,
                            ),
                          }));
                        }}
                        className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[10px] text-white"
                      >
                        ×
                      </button>
                    )}
                  </label>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/10 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-bold text-[#F1DFBC]">Business logo</h2>
                  <p className="mt-1 text-xs text-white/40">
                    Upload separately from Photos 1–20. Fine-tune it in Live Preview.
                  </p>
                </div>
                {draft.logo && (
                  <button type="button" onClick={() => update("logo", "")} className="rounded-full border border-[#C86A70]/60 px-3 py-2 text-xs text-[#F2A4A9]">
                    Remove logo
                  </button>
                )}
              </div>
              <label className="mt-4 flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-white/20 bg-[#0A1013] p-4">
                <input type="file" accept="image/*" onChange={uploadLogo} className="sr-only" />
                {draft.logo ? <img src={draft.logo} alt="Logo preview" className="h-16 w-16 object-contain" /> : <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-white/5 text-2xl">＋</span>}
                <span className="text-sm text-white/60">{draft.logo ? "Replace logo" : "Upload logo (PNG recommended)"}</span>
              </label>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-[#f1dfbc]">{words.page}</h2>
                <button
                  type="button"
                  onClick={() =>
                    update("offerings", [
                      ...draft.offerings,
                      { name: "", price: "", description: "" },
                    ])
                  }
                  className="text-sm text-[#c8a467]"
                >
                  + Add item
                </button>
              </div>
              <div className="mt-3 space-y-3">
                {draft.offerings.map((item, index) => (
                  <div
                    key={index}
                    className="grid gap-3 rounded-2xl border border-white/8 bg-black/10 p-4 sm:grid-cols-[1fr_.45fr]"
                  >
                    <Field
                      label="Name"
                      value={item.name}
                      onChange={(value) => updateOffering(index, "name", value)}
                      placeholder="Aromatherapy Massage"
                    />
                    <Field
                      label="Price"
                      value={item.price}
                      onChange={(value) =>
                        updateOffering(index, "price", value)
                      }
                      placeholder="RM120 / From RM180"
                    />
                    <div className="sm:col-span-2">
                      <Field
                        label="Short description"
                        value={item.description}
                        onChange={(value) =>
                          updateOffering(index, "description", value)
                        }
                        placeholder="Describe the value in one sentence"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/10 p-5">
              <h2 className="font-bold text-[#F1DFBC]">Privacy policy</h2>
              <p className="mt-2 text-xs leading-5 text-white/45">
                The standard policy automatically uses the business name, contact details, website address and current date.
              </p>
              <label className="mt-4 flex items-start gap-3 text-sm text-white/65">
                <input type="checkbox" checked={draft.useStandardPrivacy} onChange={(event) => update("useStandardPrivacy", event.target.checked)} className="mt-1 accent-[#D2AA62]" />
                Use the Wedge standard privacy-policy template
              </label>
              <label className="mt-4 block text-sm text-white/65">
                Optional amendments
                <textarea value={draft.privacyExtra} onChange={(event) => update("privacyExtra", event.target.value)} rows={3} placeholder="Add any business-specific privacy information…" className={inputClass} />
              </label>
              <label className="mt-4 flex items-start gap-3 text-sm text-white/65">
                <input type="checkbox" checked={draft.privacyAccepted} onChange={(event) => update("privacyAccepted", event.target.checked)} className="mt-1 accent-[#D2AA62]" />
                I have reviewed this Privacy Policy and confirm it reflects how {draft.businessName || "my business"} handles customer information.
              </label>
            </div>
            {message && (
              <p className="rounded-xl border border-[#c8a467]/20 bg-[#c8a467]/8 p-3 text-sm text-[#e4c98f]">
                {message}
              </p>
            )}
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={saveDraft}
                className="rounded-full border border-white/15 px-6 py-3 font-semibold text-white/65"
              >
                Save Draft
              </button>
              <button className="flex-1 rounded-full bg-[#c8a467] px-6 py-3 font-bold text-[#111416]">
                Generate Free Preview
              </button>
            </div>
          </form>
        </section>
      ) : (
        <PreviewShell
          draft={draft}
          page={page}
          setPage={setPage}
          words={words}
          whatsappUrl={whatsappUrl}
          facebookUrl={facebookUrl}
          instagramUrl={instagramUrl}
          chatOpen={chatOpen}
          setChatOpen={setChatOpen}
          onEdit={() => setMode("build")}
          onChangeDraft={setDraft}
        />
      )}
    </main>
  );
}

function PreviewShell({
  draft,
  page,
  setPage,
  words,
  whatsappUrl,
  facebookUrl,
  instagramUrl,
  chatOpen,
  setChatOpen,
  onEdit,
  onChangeDraft,
}: {
  draft: SiteDraft;
  page: PreviewPage;
  setPage: (page: PreviewPage) => void;
  words: { page: string; verb: string; fallback: string };
  whatsappUrl: string;
  facebookUrl: string;
  instagramUrl: string;
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
  onEdit: () => void;
  onChangeDraft: (draft: SiteDraft) => void;
}) {
  const accent = draft.primaryColor || "#b58a72";
  const [publishOpen, setPublishOpen] = useState(false);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [mediaEditor, setMediaEditor] = useState<"hero" | "logo" | null>(null);
  const [heroContentOpen, setHeroContentOpen] = useState(false);
  const gesture = useRef<{
    kind: "hero" | "logo" | "logo-resize";
    startX: number;
    startY: number;
    valueX: number;
    valueY: number;
    size: number;
  } | null>(null);
  const [packageConfig, setPackageConfig] = useState<WedgePackageConfig>(
    DEFAULT_WEDGE_PACKAGE,
  );
  useEffect(() => {
    const stored = localStorage.getItem(WEDGE_PACKAGE_STORAGE_KEY);
    if (stored) {
      try {
        setPackageConfig({ ...DEFAULT_WEDGE_PACKAGE, ...JSON.parse(stored) });
      } catch {
        localStorage.removeItem(WEDGE_PACKAGE_STORAGE_KEY);
      }
    }
  }, []);
  const siteStyle = {
    backgroundColor: draft.backgroundColor,
    color: draft.textColor,
    fontWeight: draft.boldText ? 700 : undefined,
    fontFamily: `${draft.bodyFont}, Arial, sans-serif`,
  };
  const headingStyle = { fontFamily: `${draft.headingFont}, Georgia, serif` };
  const updatePreview = <K extends keyof SiteDraft>(key: K, value: SiteDraft[K]) =>
    onChangeDraft({ ...draft, [key]: value });
  const effectiveYear = new Date().getFullYear();
  const heroZoom = device === "mobile" ? draft.heroMobileZoom : draft.heroZoom;
  const heroX = device === "mobile" ? draft.heroMobileX : draft.heroX;
  const heroY = device === "mobile" ? draft.heroMobileY : draft.heroY;
  const logoSize = device === "mobile" ? draft.logoMobileSize : draft.logoSize;
  const logoX = device === "mobile" ? draft.logoMobileX : draft.logoX;
  const logoY = device === "mobile" ? draft.logoMobileY : draft.logoY;

  function beginGesture(
    event: React.PointerEvent<HTMLElement>,
    kind: "hero" | "logo" | "logo-resize",
  ) {
    if ((kind === "hero" && mediaEditor !== "hero") || ((kind === "logo" || kind === "logo-resize") && mediaEditor !== "logo")) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current = { kind, startX: event.clientX, startY: event.clientY, valueX: kind === "hero" ? heroX : logoX, valueY: kind === "hero" ? heroY : logoY, size: logoSize };
  }

  function moveGesture(event: React.PointerEvent<HTMLElement>) {
    const active = gesture.current;
    if (!active) return;
    event.preventDefault();
    const dx = event.clientX - active.startX;
    const dy = event.clientY - active.startY;
    if (active.kind === "hero") {
      const rect = event.currentTarget.getBoundingClientRect();
      const nextX = Math.max(0, Math.min(100, active.valueX + (dx / rect.width) * 100));
      const nextY = Math.max(0, Math.min(100, active.valueY + (dy / rect.height) * 100));
      onChangeDraft({ ...draft, ...(device === "mobile" ? { heroMobileX: nextX, heroMobileY: nextY } : { heroX: nextX, heroY: nextY }) });
    } else if (active.kind === "logo") {
      onChangeDraft({ ...draft, ...(device === "mobile" ? { logoMobileX: active.valueX + dx, logoMobileY: active.valueY + dy } : { logoX: active.valueX + dx, logoY: active.valueY + dy }) });
    } else {
      const nextSize = Math.max(32, Math.min(220, active.size + Math.max(dx, dy)));
      updatePreview(device === "mobile" ? "logoMobileSize" : "logoSize", nextSize);
    }
  }

  function endGesture(event: React.PointerEvent<HTMLElement>) {
    if (gesture.current) event.currentTarget.releasePointerCapture(event.pointerId);
    gesture.current = null;
  }

  function zoomHero(event: React.WheelEvent<HTMLElement>) {
    if (mediaEditor !== "hero") return;
    event.preventDefault();
    const next = Math.max(50, Math.min(300, heroZoom + (event.deltaY < 0 ? 8 : -8)));
    updatePreview(device === "mobile" ? "heroMobileZoom" : "heroZoom", next);
  }
  const textAlignment =
    draft.heroTextAlign === "center"
      ? "items-center text-center"
      : draft.heroTextAlign === "right"
        ? "items-end text-right"
        : "items-start text-left";
  const heroTextBlock = (
    <div className={`relative z-10 flex w-full flex-col justify-center px-8 py-14 sm:px-14 ${textAlignment}`}>
      <p className="text-xs font-bold uppercase tracking-[.24em]" style={{ color: accent }}>{draft.tagline || "Made for you"}</p>
      <h1 className="mt-5 text-4xl font-bold leading-tight sm:text-6xl">{draft.heroTitle || `Welcome to ${draft.businessName || "your new website"}.`}</h1>
      <p className="mt-6 max-w-xl text-lg leading-8 opacity-75">{draft.description || words.fallback}</p>
      <div className={`mt-8 flex flex-wrap gap-3 ${draft.heroTextAlign === "center" ? "justify-center" : draft.heroTextAlign === "right" ? "justify-end" : "justify-start"}`}>
        <button onClick={() => setPage("offerings")} className="rounded-full px-6 py-3 font-bold text-white" style={{ backgroundColor: accent }}>{draft.primaryCta || `Explore ${words.page}`}</button>
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="rounded-full border border-current/20 px-6 py-3 font-semibold">{draft.secondaryCta || "WhatsApp Us"}</a>
      </div>
      {heroContentOpen && <span className="mt-5 rounded-full bg-black/70 px-3 py-1 text-[10px] text-white">Edit wording in the panel above</span>}
    </div>
  );
  const heroImageBlock = (
    <button
      onClick={() => draft.photos[0] && setMediaEditor("hero")}
      onPointerDown={(event) => beginGesture(event, "hero")}
      onPointerMove={moveGesture}
      onPointerUp={endGesture}
      onPointerCancel={endGesture}
      onWheel={zoomHero}
      aria-label="Adjust main picture"
      className={`relative h-full min-h-[340px] w-full touch-none overflow-hidden bg-[#e8ddd3] text-left ${mediaEditor === "hero" ? "cursor-move ring-4 ring-inset ring-[#D2AA62]" : ""}`}
      style={!draft.photos[0] ? { background: `linear-gradient(135deg,${accent}66,#eadfd5)` } : undefined}
    >
      {draft.photos[0] && <img src={draft.photos[0]} draggable={false} alt="Main business" className="pointer-events-none absolute inset-0 h-full w-full select-none" style={{ objectFit: draft.heroFit, objectPosition: `${heroX}% ${heroY}%`, transform: `scale(${heroZoom / 100})`, transformOrigin: `${heroX}% ${heroY}%` }} />}
      {draft.photos[0] && <span className="absolute bottom-4 right-4 z-20 rounded-full bg-black/75 px-4 py-2 text-xs font-bold text-white">{mediaEditor === "hero" ? "Drag image · wheel to zoom" : "Click to adjust"}</span>}
    </button>
  );
  return (
    <section className="mx-auto max-w-7xl px-4 py-7 sm:px-6">
      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#151b1f] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-[#c8a467]">
            Free preview
          </p>
          <p className="mt-1 text-sm text-white/45">
            Choose a publishing address when your design is ready.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setDevice(device === "desktop" ? "mobile" : "desktop")} className="rounded-full border border-white/15 px-4 py-2 text-sm">
            {device === "desktop" ? "Mobile view" : "Desktop view"}
          </button>
          {draft.photos[0] && (
            <button
              onClick={() => {
                setPage("home");
                setMediaEditor("hero");
              }}
              className="rounded-full border border-[#5E8983]/60 bg-[#5E8983]/10 px-4 py-2 text-sm text-[#B9D7D2]"
            >
              Adjust Main Picture
            </button>
          )}
          <button
            onClick={() => {
              setPage("home");
              setHeroContentOpen(!heroContentOpen);
            }}
            className="rounded-full border border-[#D2AA62]/60 bg-[#D2AA62]/10 px-4 py-2 text-sm text-[#F1DFBC]"
          >
            Edit Hero Words & Layout
          </button>
          {draft.logo && (
            <button
              onClick={() => setMediaEditor("logo")}
              className="rounded-full border border-[#5E8983]/60 bg-[#5E8983]/10 px-4 py-2 text-sm text-[#B9D7D2]"
            >
              Adjust Logo
            </button>
          )}
          <button
            onClick={onEdit}
            className="rounded-full border border-white/15 px-4 py-2 text-sm"
          >
            Edit
          </button>
          <button
            onClick={() => setPublishOpen(!publishOpen)}
            className="rounded-full bg-[#c8a467] px-4 py-2 text-sm font-bold text-[#111416]"
          >
            Choose Publishing
          </button>
        </div>
      </div>
      {publishOpen && (
        <div className="mb-4 grid gap-4 rounded-3xl border border-[#c8a467]/25 bg-[#151b1f] p-5 md:grid-cols-2">
          <article className="rounded-2xl border border-emerald-300/20 bg-emerald-300/5 p-5">
            <span className="text-[10px] font-bold uppercase tracking-[.2em] text-emerald-200">
              Included in {packageConfig.name}
            </span>
            <h3 className="mt-3 text-xl font-bold text-[#f1dfbc]">
              Wedge Works Subdomain
            </h3>
            <p className="mt-2 text-sm leading-6 text-white/50">
              Publish at an address such as{" "}
              <b className="text-white/70">yourbusiness.wedge-works.com</b>.
              Configuration and SSL are maintained by Wedge Works.
            </p>
            <p className="mt-3 text-sm font-semibold text-emerald-100">
              RM {packageConfig.annualPrice.toFixed(2)} yearly ·{" "}
              {packageConfig.freeMonths} free month
              {packageConfig.freeMonths === 1 ? "" : "s"}
            </p>
            <button
              onClick={() =>
                alert(
                  "Subdomain reservation will activate with the payment backend.",
                )
              }
              className="mt-4 rounded-full bg-emerald-300 px-4 py-2 text-sm font-bold text-[#101416]"
            >
              Select Included Subdomain
            </button>
          </article>
          <article className="rounded-2xl border border-[#c8a467]/25 bg-[#c8a467]/5 p-5">
            <span className="text-[10px] font-bold uppercase tracking-[.2em] text-[#e4c98f]">
              Managed service
            </span>
            <h3 className="mt-3 text-xl font-bold text-[#f1dfbc]">
              Managed Custom Domain
            </h3>
            <p className="mt-2 text-sm leading-6 text-white/50">
              Wedge Works checks availability, purchases on your behalf,
              connects and maintains the domain. Registration and renewal are
              billed separately.
            </p>
            <p className="mt-3 text-sm font-semibold text-[#e4c98f]">
              Setup RM {packageConfig.managedDomainSetupFee.toFixed(2)} ·
              renewal RM {packageConfig.managedDomainRenewalFee.toFixed(2)}
            </p>
            <button
              onClick={() =>
                alert(
                  "Managed domain requests will activate with the payment backend.",
                )
              }
              className="mt-4 rounded-full border border-[#c8a467]/40 px-4 py-2 text-sm font-bold text-[#f1dfbc]"
            >
              Request Managed Domain
            </button>
          </article>
        </div>
      )}
      {(mediaEditor === "hero" || mediaEditor === "logo") && (
        <div className="mb-4 rounded-3xl border border-[#D2AA62]/30 bg-[#161E22] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-bold text-[#F1DFBC]">Adjust {mediaEditor === "hero" ? "main picture" : "logo"}</p>
              <p className="mt-1 text-xs text-white/45">Editing {device} view · drag directly on the selected image, use the mouse wheel to zoom the hero, or drag the logo corner handle to resize.</p>
            </div>
            <button onClick={() => setMediaEditor(null)} className="rounded-full bg-[#D2AA62] px-4 py-2 text-sm font-bold text-[#0D1316]">Done editing</button>
          </div>
          {mediaEditor === "hero" ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Range label="Fine zoom" value={heroZoom} min={50} max={300} suffix="%" onChange={(value) => updatePreview(device === "mobile" ? "heroMobileZoom" : "heroZoom", value)} />
              <Range label="Horizontal position" value={heroX} min={0} max={100} suffix="%" onChange={(value) => updatePreview(device === "mobile" ? "heroMobileX" : "heroX", value)} />
              <Range label="Vertical position" value={heroY} min={0} max={100} suffix="%" onChange={(value) => updatePreview(device === "mobile" ? "heroMobileY" : "heroY", value)} />
              <label className="text-xs text-white/55">Fit mode<select value={draft.heroFit} onChange={(event) => updatePreview("heroFit", event.target.value as "cover" | "contain")} className={inputClass}><option value="cover">Cover area</option><option value="contain">Show full picture</option></select></label>
              <button onClick={() => onChangeDraft({ ...draft, ...(device === "mobile" ? { heroMobileZoom: 100, heroMobileX: 50, heroMobileY: 50 } : { heroZoom: 100, heroX: 50, heroY: 50 }), heroFit: "cover" })} className="rounded-full border border-white/15 px-4 py-2 text-xs text-white/60">Reset {device} picture</button>
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Range label="Logo size" value={logoSize} min={32} max={220} suffix="px" onChange={(value) => updatePreview(device === "mobile" ? "logoMobileSize" : "logoSize", value)} />
              <Range label="Horizontal offset" value={logoX} min={-150} max={150} suffix="px" onChange={(value) => updatePreview(device === "mobile" ? "logoMobileX" : "logoX", value)} />
              <Range label="Vertical offset" value={logoY} min={-60} max={100} suffix="px" onChange={(value) => updatePreview(device === "mobile" ? "logoMobileY" : "logoY", value)} />
              <Range label="Opacity" value={draft.logoOpacity} min={20} max={100} suffix="%" onChange={(value) => updatePreview("logoOpacity", value)} />
              <label className="text-xs text-white/55">Logo shape<select value={draft.logoShape} onChange={(event) => updatePreview("logoShape", event.target.value as SiteDraft["logoShape"])} className={inputClass}><option value="original">Original</option><option value="rounded">Rounded</option><option value="circle">Circle</option></select></label>
              <button onClick={() => onChangeDraft({ ...draft, ...(device === "mobile" ? { logoMobileSize: 64, logoMobileX: 0, logoMobileY: 0 } : { logoSize: 72, logoX: 0, logoY: 0 }), logoOpacity: 100, logoShape: "original" })} className="rounded-full border border-white/15 px-4 py-2 text-xs text-white/60">Reset {device} logo</button>
            </div>
          )}
        </div>
      )}
      {heroContentOpen && (
        <div className="mb-4 rounded-3xl border border-[#D2AA62]/30 bg-[#161E22] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="font-bold text-[#F1DFBC]">Hero words and layout</p><p className="mt-1 text-xs text-white/45">All changes appear immediately in the preview.</p></div>
            <button onClick={() => setHeroContentOpen(false)} className="rounded-full bg-[#D2AA62] px-4 py-2 text-sm font-bold text-[#0D1316]">Done editing</button>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Tagline" value={draft.tagline} onChange={(value) => updatePreview("tagline", value)} placeholder="Confidence starts with feeling good" />
            <Field label="Main headline" value={draft.heroTitle} onChange={(value) => updatePreview("heroTitle", value)} placeholder={`Welcome to ${draft.businessName || "your business"}.`} />
            <div className="md:col-span-2"><label className="block text-sm text-white/65">Description<textarea value={draft.description} onChange={(event) => updatePreview("description", event.target.value)} rows={3} className={inputClass} /></label></div>
            <Field label="Main button" value={draft.primaryCta} onChange={(value) => updatePreview("primaryCta", value)} placeholder={`Explore ${words.page}`} />
            <Field label="Second button" value={draft.secondaryCta} onChange={(value) => updatePreview("secondaryCta", value)} placeholder="WhatsApp Us" />
            <label className="block text-sm text-white/65">Hero layout<select value={draft.heroLayout} onChange={(event) => updatePreview("heroLayout", event.target.value as SiteDraft["heroLayout"])} className={inputClass}><option value="text-left">Text left · image right</option><option value="image-left">Image left · text right</option><option value="background">Full image · text overlay</option><option value="image-top">Image above · text below</option><option value="text-top">Text above · image below</option></select></label>
            <label className="block text-sm text-white/65">Text alignment<select value={draft.heroTextAlign} onChange={(event) => updatePreview("heroTextAlign", event.target.value as SiteDraft["heroTextAlign"])} className={inputClass}><option value="left">Left</option><option value="center">Centre</option><option value="right">Right</option></select></label>
          </div>
        </div>
      )}
      <div
        className={`relative mx-auto min-h-[720px] overflow-hidden rounded-[2rem] shadow-2xl transition-all ${device === "mobile" ? "max-w-[430px]" : "max-w-none"}`}
        style={siteStyle}
      >
        {draft.watermark && draft.photos[0] && (
          <div
            className="pointer-events-none absolute inset-0 z-0 bg-contain bg-center bg-no-repeat opacity-[0.06]"
            style={{ backgroundImage: `url(${draft.photos[0]})` }}
          />
        )}
        <div className="relative z-10">
          <header className={`flex gap-4 border-b border-current/10 px-6 py-5 ${device === "mobile" ? "flex-col" : "flex-col sm:flex-row sm:items-center sm:justify-between"}`}>
            <div className="flex items-center gap-3">
              {draft.logo && <button onClick={() => setMediaEditor("logo")} onPointerDown={(event) => beginGesture(event, "logo")} onPointerMove={moveGesture} onPointerUp={endGesture} onPointerCancel={endGesture} className={`relative touch-none rounded-lg outline-none ring-offset-2 hover:ring-2 hover:ring-current/25 ${mediaEditor === "logo" ? "ring-2 ring-[#D2AA62]" : ""}`} title="Select and drag logo"><img src={draft.logo} draggable={false} alt={`${draft.businessName || "Business"} logo`} className={`pointer-events-none object-contain ${draft.logoShape === "circle" ? "rounded-full" : draft.logoShape === "rounded" ? "rounded-xl" : ""}`} style={{ width: logoSize, height: logoSize, opacity: draft.logoOpacity / 100, transform: `translate(${logoX}px, ${logoY}px)` }} />{mediaEditor === "logo" && <span onPointerDown={(event) => beginGesture(event, "logo-resize")} onPointerMove={moveGesture} onPointerUp={endGesture} onPointerCancel={endGesture} className="absolute -bottom-3 -right-3 z-20 flex h-7 w-7 cursor-nwse-resize touch-none items-center justify-center rounded-full border-2 border-white bg-[#D2AA62] text-xs font-black text-[#0D1316]">↘</span>}<span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded bg-black/75 px-2 py-1 text-[9px] text-white opacity-0 hover:opacity-100">Drag to move</span></button>}
              <strong className="text-xl" style={headingStyle}>{draft.businessName || "Your Business"}</strong>
            </div>
            <nav className="flex gap-5 text-sm">
              {(["home", "offerings", "contact"] as PreviewPage[]).map(
                (item) => (
                  <button
                    key={item}
                    onClick={() => setPage(item)}
                    className={page === item ? "font-bold" : "opacity-55"}
                  >
                    {item === "home"
                      ? "Home"
                      : item === "offerings"
                        ? words.page
                        : "Contact Us"}
                  </button>
                ),
              )}
            </nav>
          </header>
          {page === "home" && (
            <div>
              {draft.heroLayout === "background" ? (
                <div className="relative grid min-h-[560px] overflow-hidden">
                  <div className="absolute inset-0">{heroImageBlock}</div>
                  <div className="pointer-events-none absolute inset-0 z-[5] bg-gradient-to-r from-black/75 via-black/45 to-black/20" />
                  <div className="relative z-10 flex text-white [&_a]:pointer-events-auto [&_button]:pointer-events-auto">{heroTextBlock}</div>
                </div>
              ) : draft.heroLayout === "image-top" ? (
                <div className="grid min-h-[650px] grid-rows-[minmax(340px,1fr)_auto]">{heroImageBlock}{heroTextBlock}</div>
              ) : draft.heroLayout === "text-top" ? (
                <div className="grid min-h-[650px] grid-rows-[auto_minmax(340px,1fr)]">{heroTextBlock}{heroImageBlock}</div>
              ) : (
                <div className={`grid min-h-[490px] ${device === "desktop" ? "lg:grid-cols-2" : "grid-cols-1"}`}>
                  {draft.heroLayout === "image-left" ? <>{heroImageBlock}{heroTextBlock}</> : <>{heroTextBlock}{heroImageBlock}</>}
                </div>
              )}
              <div className="grid gap-4 border-t border-current/10 px-8 py-8 sm:grid-cols-3 sm:px-14">
                <Info title="Opening hours" value={draft.hours} />
                <Info
                  title="Location"
                  value={draft.address || "Add your business location"}
                />
                <Info
                  title="Direct enquiry"
                  value="Chat with us through WhatsApp"
                />
              </div>
            </div>
          )}
          {page === "offerings" && (
            <div className="px-8 py-12 sm:px-14">
              <p
                className="text-xs font-bold uppercase tracking-[.24em]"
                style={{ color: accent }}
              >
                WHAT WE OFFER
              </p>
              <h1 className="mt-4 text-4xl font-bold">{words.page}</h1>
              <div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {draft.offerings
                  .filter((item) => item.name)
                  .map((item, index) => (
                    <article
                      key={index}
                      className="overflow-hidden rounded-3xl border border-current/10 bg-white/75 shadow-sm backdrop-blur-sm"
                    >
                      {draft.photos[index + 1] && (
                        <img
                          src={draft.photos[index + 1]}
                          alt={item.name}
                          className="aspect-[4/3] w-full object-cover"
                        />
                      )}
                      <div className="p-6">
                        <div
                          className="h-2 w-16 rounded-full"
                          style={{ backgroundColor: accent }}
                        />
                        <h2 className="mt-6 text-xl font-bold">{item.name}</h2>
                        <p
                          className="mt-2 font-semibold"
                          style={{ color: accent }}
                        >
                          {item.price || "Contact us"}
                        </p>
                        <p className="mt-4 text-sm leading-6 opacity-60">
                          {item.description ||
                            "Ask us for details and availability."}
                        </p>
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          className="mt-6 inline-block font-bold"
                          style={{ color: accent }}
                        >
                          {words.verb} through WhatsApp →
                        </a>
                      </div>
                    </article>
                  ))}
              </div>
            </div>
          )}
          {page === "contact" && (
            <div className="grid min-h-[570px] lg:grid-cols-2">
              <div className="px-8 py-12 sm:px-14">
                <p
                  className="text-xs font-bold uppercase tracking-[.24em]"
                  style={{ color: accent }}
                >
                  GET IN TOUCH
                </p>
                <h1 className="mt-4 text-4xl font-bold">Contact Us</h1>
                <p className="mt-5 text-black/55">
                  We&apos;d be happy to help with your questions, booking or
                  enquiry.
                </p>
                <div className="mt-8 space-y-5">
                  <Info
                    title="WhatsApp"
                    value={draft.whatsapp || "Add a WhatsApp number"}
                  />
                  <Info title="Telephone" value={draft.phone || "—"} />
                  <Info title="Address" value={draft.address || "—"} />
                  <Info title="Opening hours" value={draft.hours} />
                </div>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  className="mt-9 inline-flex rounded-full px-6 py-3 font-bold text-white"
                  style={{ backgroundColor: accent }}
                >
                  Continue to WhatsApp
                </a>
                {(facebookUrl || instagramUrl) && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {facebookUrl && (
                      <a
                        href={facebookUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-current/20 px-4 py-2 text-sm font-semibold"
                      >
                        Visit Facebook
                      </a>
                    )}
                    {instagramUrl && (
                      <a
                        href={instagramUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-current/20 px-4 py-2 text-sm font-semibold"
                      >
                        Follow on Instagram
                      </a>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-center bg-[#eee5dd] p-10">
                <div className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-xl">
                  <p className="font-bold">Send a quick enquiry</p>
                  <input
                    placeholder="Your name"
                    className="mt-5 w-full rounded-xl border border-black/10 p-3"
                  />
                  <input
                    placeholder="Phone number"
                    className="mt-3 w-full rounded-xl border border-black/10 p-3"
                  />
                  <textarea
                    placeholder="How can we help?"
                    rows={4}
                    className="mt-3 w-full rounded-xl border border-black/10 p-3"
                  />
                  <button
                    className="mt-3 w-full rounded-full py-3 font-bold text-white"
                    style={{ backgroundColor: accent }}
                  >
                    Prepare Enquiry
                  </button>
                </div>
              </div>
            </div>
          )}
          {page === "privacy" && (
            <div className="mx-auto max-w-4xl px-8 py-12 sm:px-14">
              <p className="text-xs font-bold uppercase tracking-[.24em]" style={{ color: accent }}>YOUR INFORMATION</p>
              <h1 className="mt-4 text-4xl font-bold" style={headingStyle}>Privacy Policy</h1>
              <p className="mt-3 text-sm opacity-55">Effective and last updated: {new Date().toLocaleDateString("en-MY", { day: "numeric", month: "long", year: "numeric" })}</p>
              <div className="mt-8 space-y-6 leading-7 opacity-75">
                <p><b>{draft.businessName || "This business"}</b> respects your privacy. This policy explains how information provided through this website, WhatsApp enquiries and contact links may be handled.</p>
                <section><h2 className="font-bold opacity-100">Information we receive</h2><p>We may receive your name, telephone number, enquiry details and any information you choose to send when contacting {draft.businessName || "the business"}.</p></section>
                <section><h2 className="font-bold opacity-100">How information is used</h2><p>Information is used to respond to enquiries, arrange bookings or orders, provide requested services and maintain appropriate business records.</p></section>
                <section><h2 className="font-bold opacity-100">Third-party services</h2><p>This website may link to WhatsApp, Facebook, Instagram and other services. Their own privacy terms apply when you continue to those platforms.</p></section>
                <section><h2 className="font-bold opacity-100">Contact and your choices</h2><p>To ask about, correct or request deletion of information, contact {draft.businessName || "the business"}{draft.phone ? ` at ${draft.phone}` : draft.whatsapp ? ` through WhatsApp at ${draft.whatsapp}` : " using the Contact Us page"}.</p></section>
                {draft.privacyExtra && <section><h2 className="font-bold opacity-100">Additional information</h2><p className="whitespace-pre-wrap">{draft.privacyExtra}</p></section>}
                <p className="rounded-2xl border border-current/10 p-4 text-sm">Wedge Works provides the website technology. {draft.businessName || "The merchant"} remains responsible for its customer-information practices.</p>
              </div>
            </div>
          )}
          <footer className="border-t border-current/10 px-6 py-7 text-sm opacity-65 sm:flex sm:items-center sm:justify-between">
            <p>© {effectiveYear} {draft.businessName || "Your Business"}. All rights reserved.</p>
            <div className="mt-3 flex flex-wrap gap-4 sm:mt-0"><button onClick={() => setPage("privacy")} className="underline underline-offset-4">Privacy Policy</button><button onClick={() => setPage("contact")} className="underline underline-offset-4">Contact Us</button><a href="https://wedge-works.com" target="_blank" rel="noreferrer">Powered by Wedge Works</a></div>
          </footer>
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="absolute bottom-28 right-6 z-30 rounded-full px-5 py-4 font-bold text-white shadow-xl ring-4 ring-white/70"
            style={{ backgroundColor: accent }}
          >
            {chatOpen ? "Close" : "Ask us"}
          </button>
          {chatOpen && (
            <div className="absolute bottom-48 right-6 z-30 w-[min(340px,calc(100%-3rem))] rounded-3xl bg-white p-5 shadow-2xl">
              <p className="font-bold">
                Hi! Welcome to {draft.businessName || "our website"}.
              </p>
              <p className="mt-2 text-sm leading-6 text-black/55">
                I can help you explore our {words.page.toLowerCase()} or prepare
                a WhatsApp enquiry.
              </p>
              <div className="mt-4 grid gap-2">
                {[`View ${words.page}`, "Opening hours", "Location"].map(
                  (label) => (
                    <button
                      key={label}
                      onClick={() =>
                        label.startsWith("View")
                          ? setPage("offerings")
                          : setPage("contact")
                      }
                      className="rounded-xl border border-black/10 px-4 py-2 text-left text-sm"
                    >
                      {label}
                    </button>
                  ),
                )}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  className="rounded-xl px-4 py-2 text-center text-sm font-bold text-white"
                  style={{ backgroundColor: accent }}
                >
                  Continue to WhatsApp
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

const inputClass =
  "mt-2 w-full rounded-xl border border-white/10 bg-[#0c1114] px-4 py-3 text-white outline-none focus:border-[#c8a467]";
function externalUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const url = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? parsed.toString()
      : "";
  } catch {
    return "";
  }
}
function inferBusinessProfile(value: string) {
  const text = value.toLowerCase();
  const profiles: Array<{ category: string; terms: string[] }> = [
    { category: "Food & Beverage", terms: ["food", "restaurant", "cafe", "coffee", "menu", "sushi", "bakery", "catering"] },
    { category: "Salon & Spa", terms: ["salon", "spa", "facial", "massage", "beauty", "hair", "nail"] },
    { category: "Slimming & Wellness Centre", terms: ["slim", "wellness", "weight", "body contour", "health programme"] },
    { category: "Pet Spa & Grooming", terms: ["pet", "groom", "dog", "cat", "animal"] },
    { category: "Guest House & Homestay", terms: ["guest house", "guesthouse", "homestay", "room", "accommodation", "villa", "hotel"] },
    { category: "Workshops & Classes", terms: ["workshop", "class", "course", "lesson", "training", "academy"] },
    { category: "Home & Repair", terms: ["repair", "renovation", "plumb", "electric", "workshop", "mechanic"] },
    { category: "Retail", terms: ["retail", "shop", "store", "product", "boutique", "fashion"] },
    { category: "Professional Services", terms: ["consult", "account", "legal", "agency", "professional", "service"] },
  ];
  const scored = profiles
    .map((profile) => ({ ...profile, score: profile.terms.filter((term) => text.includes(term)).length }))
    .sort((a, b) => b.score - a.score);
  const best = scored[0];
  return best?.score
    ? { category: best.category, confidence: Math.min(96, 68 + best.score * 9) }
    : { category: "Other", confidence: text.trim().length > 30 ? 58 : 35 };
}
function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block text-sm text-white/65">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={inputClass}
      />
    </label>
  );
}
function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="block text-sm text-white/65">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}
function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm text-white/65">
      {label}
      <span className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-[#0c1114] p-2">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-12 cursor-pointer rounded border-0 bg-transparent"
        />
        <span className="text-xs uppercase text-white/45">{value}</span>
      </span>
    </label>
  );
}
function Range({
  label,
  value,
  min,
  max,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  suffix: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block text-xs text-white/55">
      <span className="flex justify-between gap-3"><span>{label}</span><b className="text-[#F1DFBC]">{value}{suffix}</b></span>
      <input type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-3 w-full accent-[#D2AA62]" />
    </label>
  );
}
function Info({ title, value }: { title: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-black/35">
        {title}
      </p>
      <p className="mt-2 leading-6">{value || "—"}</p>
    </div>
  );
}
