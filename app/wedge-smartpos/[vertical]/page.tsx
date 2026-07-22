import { notFound } from "next/navigation";
import SmartPosWorkspace from "../SmartPosWorkspace";

export function generateStaticParams() {
  return [{ vertical: "beauty" }, { vertical: "pet" }];
}

export default async function VerticalWorkspace({ params }: { params: Promise<{ vertical: string }> }) {
  const { vertical } = await params;
  if (vertical !== "beauty" && vertical !== "pet") notFound();
  return <SmartPosWorkspace vertical={vertical} />;
}
