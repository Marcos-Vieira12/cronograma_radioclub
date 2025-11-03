import { useState, useEffect } from "react";
import type { formQuestion } from "../types/types";

interface IInputProps {
  question: formQuestion;
  onAdd: (value: any) => void;
}

export function Input(props: IInputProps) {
  const [customOption, setCustomOption] = useState<string>(""); // valor do campo "Outro"
  const [selected, setSelected] = useState<string[]>(
    Array.isArray(props.question.answer)
      ? props.question.answer
      : props.question.answer
      ? [props.question.answer]
      : []
  );

  useEffect(() => {
    // sincroniza customOption com o valor selecionado (se houver um valor que não esteja em options)
    const currentCustom = selected.find((v) => !(props.question.options ?? []).includes(v));
    setCustomOption(typeof currentCustom === "string" ? currentCustom : "");
  }, [props.question.answer, props.question.options]);

  const handleChange = (newValue: string | string[]) => {
    props.onAdd(newValue);
  };

  return (
    <div className="card">
      <p>{props.question.question}</p>

      {/* casos básicos */}
      {["text", "email", "textarea"].includes(props.question.inputType) && (
        props.question.inputType === "textarea" ? (
          <textarea
            placeholder={props.question.placeholder}
            value={props.question.answer as string}
            onChange={(e) => handleChange(e.target.value)}
            style={{ width: "100%", height: "80px", padding: "8px" }}
          />
        ) : (
          <input
            type={props.question.inputType}
            placeholder={props.question.placeholder}
            value={props.question.answer as string}
            onChange={(e) => handleChange(e.target.value)}
            style={{ width: "100%", padding: "8px" }}
          />
        )
      )}

      {/* select simples */}
      {props.question.inputType === "select" && (
        <select
          value={props.question.answer as string}
          onChange={(e) => handleChange(e.target.value)}
          style={{ width: "100%", padding: "8px" }}
        >
          <option value="">{props.question.placeholder ?? "Selecione..."}</option>
          {props.question.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )}

      {/* múltipla escolha com checkbox */}
      {props.question.inputType === "checkbox" && (
        <div>
          {props.question.options?.map((opt) => (
            <div key={opt} className="checkbox-option">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  value={opt}
                  checked={selected.includes(opt)}
                  onChange={(e) => {
                    let newSelected: string[];
                    if (e.target.checked) {
                      newSelected = [...selected, opt];
                    } else {
                      newSelected = selected.filter((v) => v !== opt);
                    }
                    setSelected(newSelected);
                    handleChange(newSelected);
                  }}
                />
                {opt}
              </label>
            </div>
          ))}

          {/* opção "Outro" */}
          {props.question.openOption && (
            <div className="chechbox-option">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  value={customOption}
                  checked={selected.includes(customOption)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setCustomOption("");
                      const newSelected = [...selected, ""];
                      setSelected(newSelected);
                      handleChange(newSelected);
                    } else {
                      const newSelected = selected.filter((v) => v !== customOption);
                      setSelected(newSelected);
                      handleChange(newSelected);
                      setCustomOption("");
                    }
                  }}
                />
                {props.question.openOption}
              </label>
              {selected.includes(customOption) && (
                <input
                  type="text"
                  placeholder="Especifique..."
                  value={customOption}
                  onChange={(e) => {
                    const newCustom = e.target.value;
                    setCustomOption(newCustom);
                    const newSelected = selected.filter((v) => v !== customOption);
                    newSelected.push(newCustom);
                    setSelected(newSelected);
                    handleChange(newSelected);
                  }}
                  style={{ marginLeft: "8px", padding: "4px" }}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
