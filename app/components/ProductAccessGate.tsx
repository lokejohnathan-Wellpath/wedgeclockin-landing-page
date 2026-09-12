"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  clearProductToken,
  productConfig,
  productRequest,
  productToken,
  saveProductToken,
  type PaidProduct,
  type ProductSubscription,
} from "../lib/productAccess";
import { FOUNDER_TOKEN_KEY, founderRequest } from "../lib/founderApi";
import {
  bootstrapBooksCloudState,
  startBooksCloudMirror,
} from "../wedge-i/books/books-sync";

type Session = {
  account: {
    id: string;
    product: PaidProduct;
    businessName: string;
    ownerName: string;
    email: string;
  };
  subscription: ProductSubscription;
};

export default function ProductAccessGate({
  product,
  children,
}: {
  product: PaidProduct;
  children: ReactNode;
}) {
  const router = useRouter();
  const config = productConfig[product];
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    function founderAvailable() {
      return typeof window !== "undefined" && Boolean(localStorage.getItem(FOUNDER_TOKEN_KEY));
    }

    function currentBusinessId() {
      if (typeof window === "undefined") return "";
      return new URLSearchParams(window.location.search).get("businessId") || "";
    }

    async function prepareFounderBooksAccess() {
      const businessId = currentBusinessId();
      if (product !== "books" || !businessId || !founderAvailable()) return false;
      const result = await founderRequest<{ success: true; token: string }>(
        `/api/founder/control/businesses/${encodeURIComponent(businessId)}/books/access`,
        { method: "POST" },
      );
      saveProductToken("books", result.token);
      return true;
    }

    async function ensureToken() {
      if (productToken(product)) return true;
      try {
        return await prepareFounderBooksAccess();
      } catch {
        return false;
      }
    }

    async function openProduct() {
      const ready = await ensureToken();
      if (!ready) {
        router.replace(product === "books" ? "/founder-john-control/businesses" : `${config.basePath}/login`);
        return;
      }

      try {
        let result: Session;
        try {
          result = await productRequest<Session>(product, "/api/saas/auth/session");
        } catch (firstError) {
          clearProductToken(product);
          if (!(await prepareFounderBooksAccess())) throw firstError;
          result = await productRequest<Session>(product, "/api/saas/auth/session");
        }

        if (result.account.product !== product) {
          clearProductToken(product);
          router.replace(product === "books" ? "/founder-john-control/businesses" : `${config.basePath}/login`);
          return;
        }

        if (product === "books") await bootstrapBooksCloudState();
        if (!cancelled) setSession(result);
      } catch (caught) {
        if (cancelled) return;
        setError(caught instanceof Error ? caught.message : "Access check failed.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void openProduct();
    return () => { cancelled = true; };
  }, [config.basePath, product, router]);

  useEffect(() => {
    if (!session || product !== "books") return;
    return startBooksCloudMirror();
  }, [product, session]);

  if (loading) {
    return <main className="grid min-h-screen place-items-center bg-[#f4f0e8] text-[#5c4a30]">Opening internal {config.name} records…</main>;
  }

  if (!session) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f4f0e8] px-6 text-center text-[#20282c]">
        <div>
          <h1 className="text-2xl font-bold">{error || "Founder access is required."}</h1>
          <a className="mt-6 inline-block rounded-full bg-[#20282c] px-6 py-3 font-bold text-white" href="/founder-john-control/businesses">Return to Managed Businesses</a>
        </div>
      </main>
    );
  }

  if (!session.subscription.canWrite) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f4f0e8] px-6 text-center text-[#20282c]">
        <section className="max-w-xl rounded-[2rem] border border-[#20282c]/10 bg-white p-8 shadow-xl">
          <p className="text-xs font-bold tracking-[.22em] text-[#b08745]">INTERNAL WEDGE TOOL</p>
          <h1 className="mt-4 font-serif text-4xl">WedgeBooks is currently read-only.</h1>
          <p className="mt-5 leading-7 text-[#657074]">The accounting records remain stored. Review the business status in Founder Control.</p>
          <a href="/founder-john-control/businesses" className="mt-7 inline-flex rounded-full bg-[#20282c] px-7 py-4 font-bold text-white">Managed Businesses</a>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}
