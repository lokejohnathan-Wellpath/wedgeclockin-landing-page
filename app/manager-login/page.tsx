export default function ManagerLoginPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#101416",
        color: "#f4efe6",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 600,
          padding: 40,
          borderRadius: 24,
          background: "#1e2428",
          border: "1px solid #d4ad63",
          textAlign: "center",
        }}
      >
        <h1 style={{ color: "#d4ad63" }}>Manager PC Dashboard</h1>

        <p style={{ marginTop: 20 }}>
          Payroll Entry, Payroll Summary and CSV Export
          will be available here.
        </p>

        <p style={{ marginTop: 10, opacity: 0.7 }}>
          Coming Soon
        </p>

        <a
          href="/"
          style={{
            display: "inline-block",
            marginTop: 30,
            padding: "12px 28px",
            borderRadius: 999,
            background: "#d4ad63",
            color: "#000",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Back to Home
        </a>
      </div>
    </main>
  );
}