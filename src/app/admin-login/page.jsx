"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    // Usaremos envío nativo del form; sólo manejamos loading en el botón
    setLoading(true);
  };

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", padding: 20 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16 }}>Acceso administrador</h1>
      <form method="post" action="/api/auth/login-web" onSubmit={handleSubmit}>
        <label style={{ display: "block", marginBottom: 8 }}>Correo</label>
        <input
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@ejemplo.com"
          required
          style={{ width: "100%", padding: 10, marginBottom: 12, border: "1px solid #ddd", borderRadius: 6 }}
        />

        <label style={{ display: "block", marginBottom: 8 }}>Contraseña</label>
        <input
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          style={{ width: "100%", padding: 10, marginBottom: 12, border: "1px solid #ddd", borderRadius: 6 }}
        />

        {error && (
          <div style={{ color: "#b00020", marginBottom: 12 }}>{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 6,
            border: 0,
            background: "#111",
            color: "#fff",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
      <p style={{ marginTop: 12, textAlign: 'center', color: '#666' }}>
        ¿Eres cliente? <a href="/login" style={{ color: '#d4af37', fontWeight: 600 }}>Inicia sesión aquí</a>
      </p>
    </div>
  );
}
