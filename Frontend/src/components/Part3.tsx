import { useState } from "react";
import type { formQuestion } from "../types/types";
import { Input } from "./Input";
import { NavigationButtons } from "./NavigationButtons";
import Swal from "sweetalert2";

interface IPart3Props {
  onNext: (data: formQuestion[]) => void;
  onPrev: () => void;
  InitialData?: formQuestion[];
}

export function Part3(props: IPart3Props) {
  const [answers, setAnswers] = useState<Record<string, any>>({
    timePerWeek: props.InitialData?.find(q => q.id === "timePerWeek")?.answer || "",
    ExtraContent: props.InitialData?.find(q => q.id === "ExtraContent")?.answer || [],
    AdditionalInfo: props.InitialData?.find(q => q.id === "AdditionalInfo")?.answer || "",
  });

  const handleAdd = (id: string, value: any) => setAnswers(prev => ({ ...prev, [id]: value }));

  const formQuestions: formQuestion[] = [
    {
      id: "timePerWeek",
      question: "Quanto tempo, por semana, você consegue dedicar aos estudos com o RadioClub?",
      inputType: "select",
      isRequired: true,
      options: ["Até 1h", "Entre 1h e 2h", "Entre 2h e 3h", "Entre 3h e 4h", "Mais de 4h"],
      answer: answers.timePerWeek,
    },
    {
      id: "ExtraContent",
      question: "Além do conteúdo técnico, você se interessa por alguns desses outros temas?",
      inputType: "checkbox",
      isRequired: false,
      options: [
        "Inglês médico",
        "Como montar sua workstation",
        "Finanças médicas",
        "Trabalhos científicos",
        "Inteligência artificial",
        "Revalidação de diploma nos EUA",
        "Prefiro focar no conteúdo técnico",
      ],
      openOption: "Outro",
      answer: answers.ExtraContent,
    },
    {
      id: "AdditionalInfo",
      question:
        "Tem algo adicional que você gostaria de mencionar, ou acredita ser relevante sabermos, para montarmos seu cronograma? Fique à vontade!",
      inputType: "textarea",
      isRequired: false,
      placeholder: "Digite aqui...",
      answer: answers.AdditionalInfo,
    },
  ];

  // ======= Validação =======
  const [errors, setErrors] = useState<Record<string, string[]>>({});

const validade = () => {
  const newErrors: Record<string, string[]> = {};
  formQuestions.forEach((q) => (newErrors[q.id] = []));

  formQuestions.forEach((q) => {
    const value = answers[q.id];
    const isEmpty =
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim() === "") ||
      (Array.isArray(value) && value.length === 0);

    if (q.isRequired && isEmpty) {
      newErrors[q.id].push("Esse campo é obrigatório");
    }

    // valida formato de email
    if (
      q.inputType === "email" &&
      typeof value === "string" &&
      value.trim() !== ""
    ) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value.trim())) {
        newErrors[q.id].push("Formato de e-mail inválido");
      }
    }
  });

  setErrors(newErrors);

  // 🔥 Retorna também o próprio objeto de erros
  const isValid = Object.keys(newErrors).every((k) => newErrors[k].length === 0);
  return { isValid, newErrors };
};

// ======= Envio =======
const handlerNext = () => {
  const { isValid, newErrors } = validade();

  if (!isValid) {
    // 🚨 Agora usa diretamente newErrors, não o estado errors (sem delay)
    const hasRequiredErrors = Object.values(newErrors).some((arr) =>
      arr.includes("Esse campo é obrigatório")
    );
    const hasEmailErrors = Object.values(newErrors).some((arr) =>
      arr.includes("Formato de e-mail inválido")
    );

    let title = "";
    if (hasRequiredErrors && hasEmailErrors) {
      title = "Alguns campos estão incompletos e o e-mail parece incorreto 😅";
    } else if (hasRequiredErrors) {
      title = "Faltou preencher alguns campos obrigatórios 😅";
    } else if (hasEmailErrors) {
      title = "O e-mail informado não parece válido 🤔";
    } else {
      title = "Verifique suas respostas antes de continuar 😅";
    }

    Swal.fire({
      toast: true,
      position: "top-start",
      icon: "error",
      title,
      showConfirmButton: false,
      timer: 2500,
      background: "rgba(50, 54, 63, 0.85)", // 85% opaco — translúcido e elegante
      color: "rgba(255, 255, 255, 0.9)",   // texto levemente suavizado
      iconColor: "#ff5c5c",                // vermelho moderno
    });

    return;
  }
    const responses = formQuestions.map(q => ({ ...q, answer: answers[q.id] }));
    props.onNext(responses);
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); handlerNext(); }}>
      {formQuestions.map(q => (
        <div key={q.id}>
          <Input question={q} onAdd={(value) => handleAdd(q.id, value)} />
          {errors[q.id]?.length > 0 && (
            <div style={{ color: "red", fontSize: "0.875rem", marginTop: "2px" }}>
              {errors[q.id].join(", ")}
            </div>
          )}
        </div>
      ))}

      <NavigationButtons nextvisible={true} prevvisible={true} onPrev={props.onPrev} />
    </form>
  );
}
