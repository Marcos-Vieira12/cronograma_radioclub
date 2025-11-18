import { useState, useEffect } from "react";
import type { formQuestion } from "../types/types";
import Select from "react-select";
import { AlignCenter } from "lucide-react";


interface IInputProps {
  question: formQuestion;
  error?:String[]; 
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
    <div className="question">
      <p>{props.question.question}</p>

      {/* casos básicos */}
      {["text", "email", "textarea"].includes(props.question.inputType) && (
        props.question.inputType === "textarea" ? (
          <textarea
            placeholder={props.question.placeholder}
            value={props.question.answer as string}
            onChange={(e) => handleChange(e.target.value)}
          />
        ) : (
          <input
            type={props.question.inputType}
            placeholder={props.question.placeholder}
            value={props.question.answer as string}
            onChange={(e) => handleChange(e.target.value)}
          />
        )
      )}

      {/* select simples */}
      {props.question.inputType === "select" && (
        <Select isSearchable={false} 
          menuPlacement="bottom"            // abre para baixo
          menuPosition="absolute"           // posicionamento padrão
          classNamePrefix="select"          // prefixo para classes internas
          value={
            props.question.answer
            ? { value: props.question.answer, label: props.question.answer }
            : null
          }
          onChange={(selectedOption) => handleChange(selectedOption?.value || "")}
          options={
            props.question.options?.map((opt) => ({
            value: opt,
            label: opt,
            })) || []
          }
          placeholder={props.question.placeholder ?? "Selecione..."}
          
        />                                              


      )}
          {/*<select
          value={props.question.answer as string}
          onChange={(e) => handleChange(e.target.value)}
        >
          <option value="">{props.question.placeholder ?? "Selecione..."}</option>
          {props.question.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>*/}

      {/* múltipla escolha com checkbox */}
      {props.question.inputType === "checkbox" && (
        <div className="checkbox">
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
                />
              )}
              </label>
            </div>
          )}
        </div>
      )}
      {props.error && props.error.length > 0 && (
        <div style={{ color: "#F87171", textShadow: "0 0 6px rgba(0,0,0,0.5)", fontSize: "0.875rem", marginTop: "2px" }}>
          {props.error.join(", ")}
        </div>
      )}
    </div>
  );
}
