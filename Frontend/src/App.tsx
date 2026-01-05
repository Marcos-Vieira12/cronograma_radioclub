/**
 * Main application component (App).
 *
 * Controls the overall flow of a multi-step form:
 * - Keeps track of the current step (`part1`, `part2`, `part3`, `cronograma`);
 * - Stores all answers globally in `formData`;
 * - Sends previously stored answers (`InitialData`) back to components when going backwards;
 * - Handles navigation between steps with `handleNext` and `handlePrev`.
 *
 * Each sub-component (Part1, Part2, Part3, Cronograma) renders its own inputs
 * and returns a `QuestionResponse[]` when the user advances.
 */

import { useState } from "react";
import { Part1 } from "./components/Part1";
import { Part2 } from "./components/Part2";
import { Part3 } from "./components/Part3";
import titleImg from "./assets/title.png";
import mascoteImg from "./assets/mascote.png";
import type { PartData, formQuestion, Step } from "./types/types";
import './App.css'
import Swal from "sweetalert2";
/**
 * Maps each step to the next step in the workflow.
 */
const NEXT_STATE: Record<Step, Step> = {
  part1: "part2",
  part2: "part3",
  part3: "part1",
};

/**
 * Maps each step to the previous step in the workflow.
 */
const PREV_STATE: Record<Step, Step> = {
  part1: "part3",
  part2: "part1",
  part3: "part2",
};

export default function App() {
  // ======= Global States =======

  /**
   * Current step of the multi-step form.
   */
  const [step, setStep] = useState<Step>("part1");

  /**
   * Stores all user answers grouped by form part.
   * Each item contains a step (`part`) and its respective answers (`data`).
   */
  const [formData, setFormData] = useState<PartData[]>([]);

  // ======= Go Forward =======

  /**
   * Handles navigation to the next step.
   *
   * @param part Current step being completed.
   * @param data Collected answers for the current step.
   */
  const handleNext = (part: Step, data: formQuestion[]) => {
    // Replace existing answers from the same part with the new data.
    setFormData(prev => {
      const filtered = prev.filter(p => p.part !== part);
      return [...filtered, { part, data }];
    });

    // Move to the next step in sequence.
    setStep(NEXT_STATE[part]);
  };

  // ======= Go Back =======

  /**
   * Handles navigation to the previous step.
   *
   * @param part Current step from which the user is going back.
   */
  const handlePrev = (part: Step) => {
    setStep(PREV_STATE[part]);
  };

const handleUpload = async (part: string, data: any[]) => {
  // 🔹 1) Atualiza o formData **localmente** e no estado
  const updatedFormData = (() => {
    const filtered = formData.filter((p: any) => p.part !== part);
    return [...filtered, { part: part as Step, data }];
  })();

  setFormData(updatedFormData);

  // 🔹 2) Extrair respostas de todas as partes a partir de updatedFormData
  const respostas: Record<string, any> = {};

  updatedFormData.forEach((part: any) => {
    if (!Array.isArray(part.data)) return;
    part.data.forEach((q: any) => {
      if (q.id === "email" || q.id === "level" || q.id === "name") return;
      if (q.answer !== undefined && q.answer !== null && q.answer !== "") {
        respostas[q.question] = q.answer;
      }
    });
  });

  // 🔹 3) Extrair email, nível e nome
  const allQuestions = updatedFormData.flatMap((p: any) =>
    Array.isArray(p.data) ? p.data : []
  );

  const email =
    allQuestions.find((q: any) => q.id === "email")?.answer || "";
  const nivel =
    allQuestions.find((q: any) => q.id === "level")?.answer || "";
  const name =
    allQuestions.find((q: any) => q.id === "name")?.answer || "";

  // 🔹 4) Montar JSON
  const formatted = {
    name,
    nivel,
    email,
    respostas,
  };

  // 🔹 5) Swal de carregamento
  Swal.fire({
    title: "Gerando seu cronograma...",
    text: "Por favor, aguarde enquanto salvamos seus dados.",
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => Swal.showLoading(),
  });

  console.log(JSON.stringify(formatted));

  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/cronograma/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formatted),
      }
    );

    const dataResp = await response.json();

    if (!response.ok) {
      throw new Error(dataResp.error || "Erro ao salvar cronograma");
    }

    Swal.fire({
      icon: "success",
      title:
        dataResp.message ||
        "SHOW! agora nosso time de especialistas vai criar o seu cronograma e em breve te enviaremos por email 😁",
      confirmButtonText: "OK",
      confirmButtonColor: "#3085d6",
      allowOutsideClick: false,
      allowEscapeKey: false,
    });
  } catch (error: any) {
    console.error("Erro ao salvar cronograma:", error);
    Swal.fire({
      icon: "error",
      title: "Erro ao salvar cronograma",
      text: error.message || "Verifique o servidor e tente novamente.",
      confirmButtonText: "Fechar",
      confirmButtonColor: "#d33",
    });
  }
};


  // ======= Conditional Rendering =======

  return (
    <div>
      <img 
        src={titleImg} 
        alt="Título"
        style={{
          display: "block",
          width: "40vw",
          height: "auto",
          margin: "0 auto",
          alignContent: "center",
        }}
      />
     {/* <DndKitList />*/}
      {/* === Part 1 === */}
      {step === "part1" && (
        <Part1
          onNext={(data) => handleNext("part1", data)}
          InitialData={formData.find(p => p.part === "part1")?.data}
        />
        
      )}

      {/* === Part 2 === */}
      {step === "part2" && (
        <Part2
          level={formData.flatMap(p => p.data).find(q => q.id === "level")?.answer?.toString()}
          onNext={(data) => handleNext("part2", data)}
          onPrev={() => handlePrev("part2")}
          InitialData={formData.find(p => p.part === "part2")?.data}
        />
      )}

      {/* === Part 3 === */}
      {step === "part3" && (
        <Part3
          onNext={(data) => handleUpload("part3", data)}
          onPrev={() => handlePrev("part3")}
          InitialData={formData.find(p => p.part === "part3")?.data}
        />
      )}

      {/* Mascote no canto inferior direito, ao lado do formulário */}
      <img
        src={mascoteImg}
        alt="Mascote"
        style={{
          position: "fixed",
          right: "0rem",
          bottom: "0rem",
          width: "18vw",
          height: "auto",
          
          zIndex: 1000,
          pointerEvents: "none"
        }}
      />
    </div>
  );
}
