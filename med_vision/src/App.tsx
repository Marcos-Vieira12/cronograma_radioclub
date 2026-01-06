// src/App.tsx
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import "./styles/App.css";
import logo from "./assets/Logo.png";
import mascoteImg from "./assets/Mascote.png";
import { Modal } from "./Modal";
import type { Cronograma } from "./types";
import imgDuvida from "./assets/imgDuvida.png";

import { apiFetch, getToken, clearToken } from "./apiFetch";
import { Login } from "./Login";

function App() {
  const [todosCronogramas, setTodosCronogramas] = useState<Cronograma[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCronograma, setSelectedCronograma] = useState<Cronograma | null>(null);
  const [showModal, setShowModal] = useState(false);

  // ✅ Gate de autenticação (sem router)
  const [isAuthed, setIsAuthed] = useState<boolean>(() => !!getToken());

  function handleUnauthorized() {
    // volta pro login
    setIsAuthed(false);
    setTodosCronogramas([]);
    setShowModal(false);
    setLoading(false);
    setError("");
  }

  async function carregarTodos() {
    try {
      setLoading(true);
      setError("");

      const data = await apiFetch(
        "/cronograma/getall",
        { method: "POST" },
        handleUnauthorized
      );

      setTodosCronogramas(data.data);
    } catch (err: any) {
      // se foi 401, handleUnauthorized já cuidou
      if (err?.status === 401 || err?.message === "Not authenticated") return;

      setError(err.message);
      setTodosCronogramas([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAuthed) carregarTodos();
  }, [isAuthed]);

  const cronogramasPendentes = todosCronogramas.filter((c) => !c.status);
  const cronogramasEnviados = todosCronogramas.filter((c) => c.status);

  function handleModal(c: Cronograma) {
    setSelectedCronograma(c);
    setShowModal(true);
  }

  async function handleExcluir(id: string) {
    const confirm = await Swal.fire({
      text: `tem certeza que deseja excluir esse cronograma?`,
      imageUrl: imgDuvida,
      imageWidth: 220,
      imageHeight: "auto",
      imageAlt: "Ícone de dúvida",
      showCancelButton: true,
      confirmButtonText: "Sim, Excluir",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!confirm.isConfirmed) return;

    Swal.fire({
      title: "Excluindo cronograma...",
      text: "Por favor, aguarde.",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      await apiFetch(
        `/cronograma/remove?id=${encodeURIComponent(id)}`,
        { method: "POST" },
        handleUnauthorized
      );

      Swal.fire({
        icon: "success",
        title: "Cronograma removido!",
        text: "Cronograma removido com sucesso.",
        confirmButtonColor: "#3085d6",
      });

      setTodosCronogramas((prev) => prev.filter((c) => c.id !== id));
      setShowModal(false);
    } catch (error: any) {
      if (error?.status === 401 || error?.message === "Not authenticated") return;

      Swal.fire({
        icon: "error",
        title: "Erro ao excluir",
        text: error.message || "Não foi possível excluir o cronograma.",
        confirmButtonColor: "#d33",
      });
    }
  }

  async function handleEnviar(id: string, email: string, cronogramaAtualizado: any) {
  const confirm = await Swal.fire({
    title: "Enviar cronograma",
    text: `para ${email}?`,
    imageUrl: imgDuvida,
    imageWidth: 220,
    imageHeight: "auto",
    imageAlt: "Ícone de dúvida",
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
    // 1) UPDATE (espera concluir)
    await apiFetch(
      `/cronograma/update?id=${encodeURIComponent(id)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cronogramaAtualizado),
      },
      handleUnauthorized
    );

    // 2) EMAIL (só depois do update)
    const data = await apiFetch(
      `/cronograma/email?id=${encodeURIComponent(id)}`,
      { method: "POST" },
      handleUnauthorized
    );

    Swal.fire({
      icon: "success",
      title: "Cronograma enviado!",
      text: data.message || "Cronograma enviado com sucesso.",
      confirmButtonColor: "#3085d6",
    });

    setTodosCronogramas((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: true, cronograma: cronogramaAtualizado } : c))
    );

    setShowModal(false);
  } catch (error: any) {
    if (error?.status === 401 || error?.message === "Not authenticated") return;

    Swal.fire({
      icon: "error",
      title: "Erro ao enviar",
      text: error.message || "Não foi possível enviar o cronograma.",
      confirmButtonColor: "#d33",
    });
  }
}


  // ✅ Se não está logado, mostra a tela de login
  if (!isAuthed) {
    return (
      <Login
        onLoggedIn={() => {
          setIsAuthed(true);
        }}
      />
    );
  }

  // opcional: botão de sair (logout local)
  async function handleLogout() {
    clearToken();
    setIsAuthed(false);
  }

  if (loading) return <p style={{ padding: 20 }}>Carregando...</p>;
  if (error) return <p style={{ padding: 20 }}>Erro: {error}</p>;

  return (
    <div className="App">
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        data={selectedCronograma ? { c: selectedCronograma } : null}
        onSend={handleEnviar}
      />

      <div className="Top">
        <img src={logo} alt="Logo" />
        <h2>Central dos cronogramas dos alunos</h2>

        <button onClick={handleLogout} style={{ marginLeft: "auto" }}>
          Sair
        </button>
      </div>

      <div className="List">
        <p>Cronogramas Abertos</p>
        <div className="CardsWrapper">
          {cronogramasPendentes.map((c) => (
            <div key={c.id} className="Card">
              <h3>{c.name}</h3>
              <p className="Email">{c.email}</p>
              <p className="Nivel">
                <b>Nível:</b> {c.nivel}
              </p>

              <div className="StatusRow">
                <p className="StatusDate">
                  {c.status ? "Enviado" : "Aberto"}: {new Date(c.modifier).toLocaleDateString("pt-BR")}
                </p>

                <div className="CardButtons">
                  <button
                    className={`Btn ${c.status ? "Enviado" : "Editar"}`}
                    disabled={c.status}
                    onClick={() => handleModal(c)}
                  >
                    {c.status ? "Enviado" : "Editar"}
                  </button>

                  <button className="Btn Excluir" onClick={() => handleExcluir(c.id)}>
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p>Cronogramas Enviados</p>
        <div className="CardsWrapper">
          {cronogramasEnviados.map((c) => (
            <div key={c.id} className="Card">
              <h3>{c.name}</h3>
              <p className="Email">{c.email}</p>
              <p className="Nivel">
                <b>Nível:</b> {c.nivel}
              </p>

              <div className="StatusRow">
                <p className="StatusDate">
                  {c.status ? "Enviado" : "Aberto"}: {new Date(c.modifier).toLocaleDateString("pt-BR")}
                </p>

                <div className="CardButtons">
                  <button className={`Btn ${c.status ? "Enviado" : "Editar"}`} disabled={c.status}>
                    {c.status ? "Enviado" : "Editar"}
                  </button>

                  <button className="Btn Excluir" onClick={() => handleExcluir(c.id)}>
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <img
        src={mascoteImg}
        alt="Mascote"
        style={{
          position: "fixed",
          right: "3vw",
          bottom: "10.5vh",
          width: "20.5vw",
          height: "auto",
          zIndex: 1000,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

export default App;
