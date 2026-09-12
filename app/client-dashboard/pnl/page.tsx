import ManagementPnlReport from "../../components/ManagementPnlReport";

export default function ClientPnlPage() {
  return (
    <ManagementPnlReport
      backHref="/client-dashboard"
      backLabel="Client Dashboard"
      eyebrow="REVIEWED MANAGEMENT ACCOUNTS"
    />
  );
}
