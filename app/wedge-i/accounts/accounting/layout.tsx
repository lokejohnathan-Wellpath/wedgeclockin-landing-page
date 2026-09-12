import AccountingTools from "./AccountingTools";

export default function AccountingCentreLayout({ children }: { children: React.ReactNode }) {
  return <>{children}<AccountingTools /></>;
}
