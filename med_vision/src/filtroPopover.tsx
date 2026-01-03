import * as Popover from "@radix-ui/react-popover";
import Select from "react-select";
import { useState } from "react";
import "./styles/modal.css";
import svgFiltro from './assets/svgFiltro.svg';

export interface FiltroPopoverProps {
  moduleList: string[];
  onAplicarFiltro: (filtros: {
    useModulo: boolean;
    moduloSelecionado: string | null;
    useTempo: boolean;
    tempoFiltroTipo: "mais" | "menos";
    tempoFiltroValor: number;
    ordenacao: "peso" | "A-Z" | "modulo";
  }) => void;
}

export function FiltroPopover({ moduleList, onAplicarFiltro }: FiltroPopoverProps) {
  /** estados */
  const [useModulo, setUseModulo] = useState(false);
  const [moduloSelecionado, setModuloSelecionado] = useState<string | null>(null);

  const [useTempo, setUseTempo] = useState(false);
  const [tempoFiltroTipo, setTempoFiltroTipo] = useState<"mais" | "menos">("mais");
  const [tempoFiltroValor, setTempoFiltroValor] = useState<number>(30);

  const [ordenacao, setOrdenacao] = useState<"peso" | "A-Z" | "modulo">("peso");

  const aplicar = () => {
    onAplicarFiltro({
      useModulo,
      moduloSelecionado,
      useTempo,
      tempoFiltroTipo,
      tempoFiltroValor,
      ordenacao,
    });
  };

  const limpar = () => {
  setUseModulo(false);
  setModuloSelecionado(null);

  setUseTempo(false);
  setTempoFiltroTipo("mais");
  setTempoFiltroValor(30);

  setOrdenacao("peso");

  // também limpa no front
  onAplicarFiltro({
    useModulo: false,
    moduloSelecionado: null,
    useTempo: false,
    tempoFiltroTipo: "mais",
    tempoFiltroValor: 30,
    ordenacao: "peso",
  });
};

  return (
    <Popover.Root>
      {/* botão que abre o popover */}
      <Popover.Trigger asChild>
        <img
          src={svgFiltro}
          alt="Filtro"
          style={{ cursor: "pointer", width: "24px" }}
        />
      </Popover.Trigger>

      {/* conteúdo do popover */}
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="end"
          sideOffset={6}
          className="popover-content"
        >
          {/* CONTEÚDO DO FILTRO */}
          <div className="filtro-container">

            <h3>Filtrar por</h3>

            {/* Checkbox módulo */}
            <label className="filtro-item">
              <input
                type="checkbox"
                checked={useModulo}
                onChange={(e) => setUseModulo(e.target.checked)}
              />
              Módulo
            </label>

            {useModulo && (
              <Select
                placeholder="Selecione o módulo"
                options={moduleList.map((m) => ({ label: m, value: m }))}
                onChange={(opt) => setModuloSelecionado(opt ? opt.value : null)}
              />
            )}

            {/* Checkbox tempo */}
            <label className="filtro-item">
              <input
                type="checkbox"
                checked={useTempo}
                onChange={(e) => setUseTempo(e.target.checked)}
              />
              Tempo
            </label>

            {useTempo && (
              <div className="filtro-tempo">
                <select
                  value={tempoFiltroTipo}
                  onChange={(e) =>
                    setTempoFiltroTipo(e.target.value as "mais" | "menos")
                  }
                >
                  <option value="mais">Maior que</option>
                  <option value="menos">Menor que</option>
                </select>

                <input
                  type="number"
                  value={tempoFiltroValor}
                  min={1}
                  onChange={(e) => setTempoFiltroValor(Number(e.target.value))}
                />
                min
              </div>
            )}

            <h3>Ordenar por</h3>

            <select
              value={ordenacao}
              onChange={(e) =>
                setOrdenacao(
                  e.target.value as "peso" | "A-Z" | "modulo"
                )
              }
            >
              <option value="peso">Peso</option>
              <option value="A-Z">Alfabeto</option>
              <option value="modulo">Ordem dos módulos</option>
            </select>


              <Popover.Close asChild>
            <button className="btn-aplicar" onClick={aplicar}>
              Aplicar
            </button>
            </Popover.Close>

            <Popover.Close asChild>
                <button className="btn-limpar" onClick={limpar}>
                    limpar filtros
                </button>
            </Popover.Close>
            
          </div>

          {/* seta do popover */}
          <Popover.Arrow className="popover-arrow" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
