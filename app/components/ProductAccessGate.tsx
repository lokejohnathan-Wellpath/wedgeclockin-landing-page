"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  clearProductToken,
  productConfig,
  productRequest,
  productToken,
  type PaidProduct,
  type ProductSubscription,
} from "../lib/productAccess";
import { ensureOwnerProductAccess, ownerToken } from "../lib/ownerAccess";
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

    async function ensureToken() {
      if (productToken(product)) return true;
      if (product === "books" && ownerToken()) {
        try {
          return await ensureOwnerProductAccess("books");
        } catch {
          return false;
        }
      }
      return false;
    }

    async function openProduct() {
      const ready = await ensureToken();
      if (!ready) {
        router.replace(product === "books" ? "/client-login" : `${config.basePath}/login`);
        return;
      }

      try {
        let result: Session;
        try {
          result = await productRequest<Session>(product, "/api/saas/auth/session");
        } catch (firstError) {
          if (product === "books" && ownerToken()) {
            const refreshed = await ensureOwnerProductAccess("books");
            if (!refreshed) throw firstError;
            result = await productRequest<Session>(product, "/api/saas/auth/session");
          } else {
            throw firstError;
          }
        }

        if (result.account.product !== product) {
          clearProductToken(product);
          router.replace(product === "books" ? "/client-dashboard" : `${config.basePath}/login`);
          return;
        }

        if (product === "books") await bootstrapBooksCloudState();
        if (!cancelled) setSession(result);
      } catch (caught) {
        if (cancelled) return;
        const message = caught instanceof Error ? caught.message : "Access check failed.";
        setError(message);
        if (!productToken(product)) router.replace(product === "books" ? "/client-login" : `${config.basePath}/login`);
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
    return <main className="grid min-h-screen place-items-center bg-[#f4f0e8] text-[#5c4a30]">Checking {config.name} access and cloud records…</main>;
  }

  if (!session) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f4f0e8] px-6 text-center text-[#20282c]">
        <div>
          <h1 className="text-2xl font-bold">{error || "Login is required."}</h1>
          <a className="mt-6 inline-block rounded-full bg-[#b7892e] px-6 py-3 font-bold text-white" href={product === "books" ? "/client-login" : `${config.basePath}/login`}>
            {product === "books" ? "Client Login" : "Product Login"}
          </a>
        </div>
      </main>
    );
  }

  const blocked = !session.subscription.canWrite;
  if (blocked) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f4f0e8] px-6 text-center text-[#20282c]">
        <section className="max-w-xl rounded-[2rem] border border-[#20282c]/10 bg-white p-8 shadow-xl">
          <p className="text-xs font-bold tracking-[.22em] text-[#b08745]">{config.eyebrow}</p>
          <h1 className="mt-4 font-serif text-4xl">Your current access period has ended.</h1>
          <p className="mt-5 leading-7 text-[#657074]">Your existing records remain stored. Please contact the Wedge team to continue using {config.name}.</p>
          <a href={product === "books" ? "/client-dashboard" : "/"} className="mt-7 inline-flex rounded-full bg-[#20282c] px-7 py-4 font-bold text-white">{product === "books" ? "Return to Client Dashboard" : "Return to Wedge Works"}</a>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}
