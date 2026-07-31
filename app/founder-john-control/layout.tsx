import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Private Control | Wedge Works",
  robots: { index: false, follow: false, nocache: true },
};

export default function FounderControlLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
