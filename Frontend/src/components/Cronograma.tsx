import { NavigationButtons } from "./NavigationButtons";

interface ICronogramaProps {
  onNext?: (data?: any) => void;
  onPrev?: () => void;
  data?: any;
}

export function Cronograma(props: ICronogramaProps) {

const handleDownload = async () => {
  // 🔹 Passo 1: Extrair respostas de todas as partes
  const respostas: Record<string, any> = {};

  props.data.forEach((part: any) => {
    part.data.forEach((q: any) => {
      // Ignora email e nível na lista de respostas
      if (q.id === "email" || q.id === "level") return;

      if (q.answer !== undefined && q.answer !== null && q.answer !== "") {
        respostas[q.question] = q.answer;
      }
    });
  });

  // 🔹 Passo 2: Extrair email e nível
  const email = props.data
    .flatMap((p: any) => p.data)
    .find((q: any) => q.id === "email")?.answer || "";

  const nivel = props.data
    .flatMap((p: any) => p.data)
    .find((q: any) => q.id === "level")?.answer || "";

  // 🔹 Passo 3: Gerar ID aleatório
  const respondent_id = Math.random().toString(36).substring(2, 8);

  // 🔹 Passo 4: Montar o JSON no formato do backend
  const formatted = {
    respondent_id,
    nivel,
    email,
    respostas,
  };

  try {
    // 🔹 Passo 5: Enviar o JSON pro backend e receber o PDF
    const response = await fetch("https://cronograma-radioclub.onrender.com/cronograma/pfd", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formatted),
    });

    if (!response.ok) {
      throw new Error(`Erro ao gerar PDF: ${response.status}`);
    }

    // 🔹 Passo 6: Converter resposta em blob (PDF)
    const blob = await response.blob();

    // 🔹 Passo 7: Criar link e baixar o PDF
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "cronograma.pdf";
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Erro ao gerar ou baixar o PDF:", error);
    alert("Falha ao gerar o PDF. Verifique o servidor.");
  }
};



  return (
    <div className="flex flex-col items-center gap-6 bg-white p-6 rounded-md shadow-md w-[400px]">
      <h2 className="text-xl font-semibold">Cronograma</h2>
      <p>Seu cronograma personalizado foi gerado com sucesso!</p>
      <p>Clique abaixo para baixar o arquivo JSON com os detalhes.</p>

      {/* Botão para baixar o arquivo */}
      <button
        onClick={handleDownload}
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded transition"
      >
        📥 Baixar JSON
      </button>

      <NavigationButtons
        nextvisible={false}
        prevvisible={true}
        onPrev={props.onPrev}
      />
    </div>
  );
}
