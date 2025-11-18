import { useEffect, useState } from "react";
import Swal from "sweetalert2";

interface Cronograma {
  id: string;
  name: string;
  email: string;
  nivel: string;
  respostas: any;
  cronograma: any;
  status: boolean;
}

function App() {
  const [todosCronogramas, setTodosCronogramas] = useState<Cronograma[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusAtual, setStatusAtual] = useState<"pendente" | "enviado">("pendente");

  // 🔹 Busca TODOS os cronogramas apenas uma vez
  async function carregarTodos() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("https://cronograma-radioclub.onrender.com/cronograma/getall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Erro ao buscar cronogramas");

      setTodosCronogramas(data.data);
    } catch (err: any) {
      setError(err.message);
      setTodosCronogramas([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarTodos();
  }, []);

  // 🔹 Filtra no front
  const cronogramasVisiveis = todosCronogramas.filter((c) =>
    statusAtual === "pendente" ? !c.status : c.status
  );

  // 🔹 Envio do cronograma
  async function handleEnviar(id: string, email: string) {
    const confirm = await Swal.fire({
      title: "Enviar cronograma?",
      text: `Deseja enviar o cronograma para ${email}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sim, enviar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
    });

    if (!confirm.isConfirmed) return;

    Swal.fire({
      title: "Enviando cronograma...",
      text: "Por favor, aguarde.",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const response = await fetch(`http://127.0.0.1:8000/cronograma/email?id=${id}`, {
        method: "POST",
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Erro ao enviar cronograma");

      Swal.fire({
        icon: "success",
        title: "Cronograma enviado!",
        text: data.message || "Cronograma enviado com sucesso.",
        confirmButtonColor: "#3085d6",
      });

      // Atualiza lista local sem precisar refazer fetch
      setTodosCronogramas((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: true } : c))
      );

    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Erro ao enviar",
        text: error.message || "Não foi possível enviar o cronograma.",
        confirmButtonColor: "#d33",
      });
    }
  }

  if (loading) return <p style={{ padding: 20 }}>Carregando...</p>;
  if (error) return <p style={{ padding: 20 }}>Erro: {error}</p>;

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h2 style={{ marginBottom: "10px" }}>Lista de Cronogramas</h2>

      {/* 🔹 Botões de filtro */}
      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={() => setStatusAtual("pendente")}
          style={{
            marginRight: "10px",
            backgroundColor: statusAtual === "pendente" ? "#3085d6" : "#ccc",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Pendentes
        </button>

        <button
          onClick={() => setStatusAtual("enviado")}
          style={{
            backgroundColor: statusAtual === "enviado" ? "#3085d6" : "#ccc",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Enviados
        </button>
      </div>

      {/* 🔹 Cards */}
      {cronogramasVisiveis.length === 0 && <p>Nenhum cronograma encontrado.</p>}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
        {cronogramasVisiveis.map((c) => (
          <div
            key={c.id}
            onClick={() => handleEnviar(c.id, c.email)}
            style={{
              width: "240px",
              padding: "12px",
              borderRadius: "8px",
              backgroundColor: "#f7f7f7",
              boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.03)";
              e.currentTarget.style.boxShadow = "0 4px 10px rgba(0,0,0,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "0 2px 5px rgba(0,0,0,0.1)";
            }}
          >
            <h3 style={{ margin: "0 0 6px 0", fontSize: "16px", color: "#333" }}>{c.name}</h3>
            <p style={{ margin: "2px 0", fontSize: "13px", color: "#666" }}>{c.email}</p>
            <p style={{ margin: "2px 0", fontSize: "13px", color: "#666" }}>
              <b>Nível:</b> {c.nivel}
            </p>
            <p
              style={{
                marginTop: "8px",
                fontSize: "12px",
                fontWeight: "bold",
                color: c.status ? "#4caf50" : "#ff9800",
              }}
            >
              {c.status ? "Enviado" : "Pendente"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
