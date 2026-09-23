export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 16 }}>
      <div style={{ width: "min(420px, 100%)", display: "grid", gap: 20 }}>
        <div>
          <div className="logo" style={{ fontSize: 26 }}>Caderneta<i>.</i></div>
          <div className="muted" style={{ fontSize: 13 }}>Sem conexão com o banco — tudo entra por arquivo ou à mão.</div>
        </div>
        {children}
      </div>
    </main>
  );
}
