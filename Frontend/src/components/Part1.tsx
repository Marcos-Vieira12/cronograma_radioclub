import { useState } from "react";
import { Input } from "./Input";
import { NavigationButtons } from "./NavigationButtons";
import type { formQuestion } from "../types/types";
import Swal from "sweetalert2";

interface IPart1Props {
  onNext: (data: formQuestion[]) => void;
  InitialData?: formQuestion[];
}

export function Part1(props: IPart1Props) {

  console.log("Initial Data Part1:", props.InitialData);
  const levelOptions = ["R1", "R2", "R3", "R4", "Médico Radiologista"];
  const objectiveOptions = [
    "Aprofundar conhecimentos na minha subespecialidade atual",
    "Expandir para novas subespecialidades da radiologia",
    "Melhorar interpretação de exames no dia a dia",
    "Desenvolver skills para ensino/supervisão de residentes",
    "Complementar minha formação como residente de radiologia",
    "Me atualizar com as inovações e protocolos mais recentes",
    "Participar ativamente da comunidade profissional",
    "Praticar com casos reais e discussões clínicas",
  ];

  // ======= 1. Estado único para todas as respostas =======
  const [answers, setAnswers] = useState<Record<string, any>>({
    name : props.InitialData?.find(q => q.id === "name")?.answer || "",
    level : props.InitialData?.find(q => q.id === "level")?.answer || "",
    objectives : props.InitialData?.find(q => q.id === "objectives")?.answer || [],
    email : props.InitialData?.find(q => q.id === "email")?.answer || "",
    hospital : props.InitialData?.find(q => q.id === "hospital")?.answer || "",
  }
  );

  // ======= 2. Definição dinâmica do formulário =======
  const formQuestions: formQuestion[] = [

  {
    id: "name",
    question: "Qual seu nome?",
    inputType: "text",
    placeholder: "Digite seu nome",
    isRequired: true,
    answer: answers.name
  },
    
  {
    id: "email",
    question: "Por gentileza, confirme o Email de sua assinatura:",
    inputType: "email",
    placeholder: "digite seu email",
    isRequired: true,
    answer: answers.email,
  },
  {
    id: "level",
    question: "Qual seu nível atual?",
    inputType: "select",
    isRequired: true,
    options: levelOptions,
    answer: answers.level,
  },
  {
    id: "objectives",
    question: "Quais seus objetivos com o Curso Radioclub?",
    inputType: "checkbox",
    isRequired: true,
    options: objectiveOptions,
    openOption: "Outro",
    answer: answers.objectives,
  },
  {
    id: "hospital",
    question: "Em qual hospital você faz/fez a residência?",
    inputType: "text",
    isRequired: false,
    answer: answers.hospital,
  },
];

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
  // ======= 3. Atualização dinâmica de um campo =======
const handleAdd = (id: string, value: any) => {
  setAnswers(prev => ({ ...prev, [id]: value }));
};

// ======= 5. Render =======
  return (
    <form className="form" noValidate onSubmit={(e) => { e.preventDefault(); handlerNext(); }}>
    {formQuestions.map((q) => (
      
        <Input 
          key={q.id}
          question={q}
          error = {errors[q.id]}
          onAdd={(value) => handleAdd(q.id, value)}
        />
      
    ))}


      <NavigationButtons nextvisible={true} />
    </form>
  );
}
