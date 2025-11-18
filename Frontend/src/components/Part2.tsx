import { useState } from "react";
import type { formQuestion } from "../types/types";
import { NavigationButtons } from "./NavigationButtons";
import { Input } from "./Input";
import Swal from "sweetalert2";

interface IPart2Props {
  level?: string;
  onNext: (data: formQuestion[]) => void;
  onPrev: () => void;
  InitialData?: formQuestion[];
}

export function Part2(props: IPart2Props) {
  // ======= Opções base =======
  let examsTitle = "";
  let examsOpenTitle = "";
  let subspecialtiesTitle = "";
  let subspecialtiesOpenTitle = "";

  let examslist = ["RX", "USG", "Densitometria", "Mamografia", "TC", "RM"];
  let subspecialtieslist = [
    "Neuro",
    "Tórax",
    "Abdome",
    "Mama",
    "Musculoesquelético",
    "Cabeça e Pescoço",
    "Pediatria",
    "Gineco/Obstetrícia",
    "Urologia",
    "Oncologia",
  ];

  // ======= Ajustes por nível =======
  switch (props.level) {
    case "R1":
      examsTitle =
        "Quais exames de imagem você já tem contato na prática ou vai ter nesse início de R1?";
      subspecialtiesTitle =
        "Quais subespecialidades você vai ter mais contato na Residência?";
      examsOpenTitle = "Quais exames de imagem sente mais dificuldade no momento?";
      subspecialtiesOpenTitle =
        "Quais temas você está vendo ou vai ver no primeiro ano de Residência? (ex: Pneumonia, AVC, Aneurisma, Abdome Agudo, Fraturas, física...)";
      break;
    case "R2":
      examsTitle =
        "Quais exames você mais lauda/interpreta e tem contato no R2 atualmente?";
      subspecialtiesTitle =
        "Quais subespecialidades você mais tem contato na Residência?";
      examsOpenTitle =
        "Quais desses exames de imagem sente mais dificuldade no momento? Algo passou batido no R1?";
      subspecialtiesOpenTitle =
        "Tem alguma subespecialidade que quer aprofundar mais ou revisar agora no R2?";
      examslist.push("Doppler", "AngioTC e AngioRM", "Fluoroscopia", "Contrastados");
      break;
    case "R3":
      examsTitle =
        "Quais exames você tem mais contato hoje na residência e gostaria de aprofundar?";
      subspecialtiesTitle =
        "Quais subespecialidades você mais tem contato na Residência e gostaria de aprofundar?";
      subspecialtiesOpenTitle =
        "Tem algum exame de imagem ou subespecialidade específica que você quer dominar ou revisar agora no R3? Ou algo que você sente que ficou pra trás do R1/R2?";
      examslist.push("Doppler", "AngioTC e AngioRM", "Fluoroscopia", "Contrastados", "PET-CT", "HSG");
      break;
    case "R4":
    case "Médico Radiologista":
      examsTitle =
        "Quais exames você realiza na sua prática atual e gostaria de revisar ou de se atualizar?";
      subspecialtiesTitle =
        "Em quais subespecialidades você tem mais interesse revisar ou se aprofundar agora?";
      subspecialtiesOpenTitle =
        "Tem algum exame de imagem ou tema que gostaria de priorizar primeiro?";
      examslist.push("Doppler", "AngioTC e AngioRM", "Fluoroscopia", "Contrastados", "PET-CT", "HSG");
      subspecialtieslist.push("Intervenção", "Cardiovascular");
      break;
  }

  // ======= Estado =======
  const [answers, setAnswers] = useState<Record<string, any>>({
    exams: props.InitialData?.find(q => q.id === "exams")?.answer || [],
    examsOpen: props.InitialData?.find(q => q.id === "examsOpen")?.answer || "",
    subspecialties: props.InitialData?.find(q => q.id === "subspecialties")?.answer || [],
    subspecialtiesOpen: props.InitialData?.find(q => q.id === "subspecialtiesOpen")?.answer || "",
    time: props.InitialData?.find(q => q.id === "time")?.answer || "",
    area: props.InitialData?.find(q => q.id === "area")?.answer || "",
  });

  const handleAdd = (id: string, value: any) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  // ======= Lista dinâmica =======
  const formQuestions: formQuestion[] = [
    { id: "exams", question: examsTitle, inputType: "checkbox", isRequired: true, options: examslist, answer: answers.exams },
    { id: "subspecialties", question: subspecialtiesTitle, inputType: "checkbox", isRequired: true, options: subspecialtieslist, answer: answers.subspecialties },
    { id: "subspecialtiesOpen", question: subspecialtiesOpenTitle, inputType: "textarea", isRequired: false, answer: answers.subspecialtiesOpen },
  ];

  if (props.level === "R1" || props.level === "R2") {
    formQuestions.splice(1, 0, { id: "examsOpen", question: examsOpenTitle, inputType: "textarea", isRequired: false, answer: answers.examsOpen });
  }
  if (props.level === "R3") {
    formQuestions.splice(0, 0, { id: "area", question: "Já decidiu qual área quer seguir no R4/Fellow? se sim, qual?", inputType: "text", isRequired: false, answer: answers.area });
  }
  if (props.level === "R4" || props.level === "Médico Radiologista") {
    formQuestions.splice(0, 0, {
      id: "time",
      question: "Há quanto tempo terminou a residência?",
      inputType: "select",
      isRequired: true,
      options: ["Menos de 1 ano", "Entre 1 e 3 anos", "Entre 3 e 5 anos", "Há mais de 5 anos"],
      answer: answers.time,
    });
  }

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

  // ======= Render =======
  return (
    <form onSubmit={(e) => { e.preventDefault(); handlerNext(); }}>
      {formQuestions.map(q => (
        <div key={q.id}>
          <Input question={q} onAdd={(value) => handleAdd(q.id, value)} />
          {errors[q.id]?.length > 0 && (
            <div style={{ color: "red", fontSize: "0.875rem", marginTop: "4px" }}>
              {errors[q.id].join(", ")}
            </div>
          )}
        </div>
      ))}

      <NavigationButtons nextvisible={true} prevvisible={true} onPrev={props.onPrev} />
    </form>
  );
}
