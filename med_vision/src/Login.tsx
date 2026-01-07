// src/Login.tsx
import { useState } from "react";
import Swal from "sweetalert2";
import { apiFetch, setToken } from "./apiFetch";

type Props = {
  onLoggedIn: () => void;
};

export function Login({ onLoggedIn }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await apiFetch(
        "/auth/login",
        {
          method: "POST",
          public: true,
          body: JSON.stringify({ email, password }),
        }
      );

      const token = data?.access_token;
      if (!token) throw new Error("Login não retornou token");

      setToken(token);
      Swal.fire({ icon: "success", title: "Logado!", timer: 900, showConfirmButton: false });
      onLoggedIn();
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Falha no login",
        text: err?.message || "Não foi possível logar",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 20 }}>
      <form
        onSubmit={handleSubmit}
        style={{
          width: "min(420px, 92vw)",
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: 18,
          display: "grid",
          gap: 12,
        }}
      >
        <h2 style={{ margin: 0 }}>Entrar</h2>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Email</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            autoComplete="username"
            style={{ padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Senha</span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            autoComplete="current-password"
            style={{ padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: 12,
            borderRadius: 10,
            border: "none",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <p style={{ margin: 0, fontSize: 12, opacity: 0.7 }}>
          Se for o lucão, use com moderação
        </p>
      </form>
    </div>
  );
}
