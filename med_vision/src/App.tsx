import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import './styles/App.css';
import logo from './assets/Logo.png';
import mascoteImg from './assets/Mascote.png';
import { Modal } from "./Modal";
import type { Cronograma } from "./types";
import imgDuvida from './assets/imgDuvida.png';

function App() {
  const [todosCronogramas, setTodosCronogramas] = useState<Cronograma[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCronograma, setSelectedCronograma] = useState<Cronograma | null>(null);
  const [showModal, setShowModal] = useState(false);

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

  // 🔹 Agora você tem duas listas SEPARADAS:
  const cronogramasPendentes = todosCronogramas.filter(c => !c.status);
  const cronogramasEnviados = todosCronogramas.filter(c => c.status);

  // 🔹 Função de envio (mantida)


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
    const response = await fetch(`http://127.0.0.1:8000/cronograma/remove?id=${id}`, {
      method: "POST",
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Erro ao excluir cronograma");

    Swal.fire({
      icon: "success",
      title: "Cronograma removido!",
      text: "Cronograma removido com sucesso.",
      confirmButtonColor: "#3085d6",
    });

    // remove de todas as listas derivadas
    setTodosCronogramas(prev => prev.filter(c => c.id !== id));
    setShowModal(false);

  } catch (error: any) {
    Swal.fire({
      icon: "error",
      title: "Erro ao enviar",
      text: error.message || "Não foi possível enviar o cronograma.",
      confirmButtonColor: "#d33",
    });
  }
}

  async function handleEnviar(id: string, email: string) {
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
      const response = await fetch(`https://cronograma-radioclub.onrender.com/cronograma/email?id=${id}`, {
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

      // Atualiza status localmente
      setTodosCronogramas(prev =>
        prev.map(c => (c.id === id ? { ...c, status: true } : c))
      );
      setShowModal(false);

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
      </div>

      <div className="List">
        <p>Cronogramas Abertos</p>
        <div className="CardsWrapper">
          {cronogramasPendentes.map((c) => (
            <div
              key={c.id}
              className="Card"
            >
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
            <div
              key={c.id}
              className="Card"
            >
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
          pointerEvents: "none"
        }}
      />
    </div>
  );
}

export default App;
