import { motion, AnimatePresence } from "framer-motion";
import "./styles/modal.css";
import type { Aula, Cronograma } from "./types";
import imgFeliz from "./assets/imgFeliz.png";
import svgLupa from "./assets/svgLupa.svg";
import { useEffect, useMemo, useState } from "react";
import { FiltroPopover } from "./filtroPopover";
import { FiPlusCircle} from "react-icons/fi";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  data: { c: Cronograma } | null;
  onSend?: (
    id: string,
    email: string,
    cronogramaAtualizado: any
  ) => void;
}

type WeekData = { week: number | string; lessons: Aula[] };

type PopoverFiltros = {
  useModulo: boolean;
  moduloSelecionado: string | null;
  useTempo: boolean;
  tempoFiltroTipo: "mais" | "menos";
  tempoFiltroValor: number;
  ordenacao: "peso" | "A-Z" | "modulo";
};

const norm = (s: string) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export const Modal = ({ open, onClose, data, onSend }: ModalProps) => {
  const remaining = useMemo<Aula[]>(() => {
    const w = data?.c.cronograma.weeks.find((x: any) => x.week === "remaining");
    return w?.lessons ?? [];
  }, [data]);

  const initialWeeks = useMemo<WeekData[]>(
    () =>
      (data?.c.cronograma.weeks ?? []).filter(
        (w: any) => w.week !== "remaining"
      ) as WeekData[],
    [data]
  );

  const [selectedAvailable, setSelectedAvailable] = useState<Aula[]>([]);
  const [available, setAvailable] = useState<Aula[]>([]);
  const [weeks, setWeeks] = useState<WeekData[]>(initialWeeks);
  const [q, setQ] = useState("");
  const [f, setF] = useState<PopoverFiltros | null>(null);
  const [active, setActive] = useState<{
    modulo?: string;
    tempo?: string;
    ordenacao?: string;
  } | null>(null);

  useEffect(() => setAvailable(remaining), [remaining]);
  useEffect(() => setWeeks(initialWeeks), [initialWeeks]);

  const modules = useMemo(
    () => Array.from(new Set(available.map((a) => a.module_name))),
    [available]
  );

  const filtered = useMemo(() => {
    const key = (a: Aula) => `${a.module_name}||${a.lesson_theme}`;

    // selected items should always be shown and ignore all filters
    const selItems = selectedAvailable;

    // start with available items and apply filters/search only to them
    let avail = [...available];

    const t = norm(q);
    if (t) avail = avail.filter((a) => norm(a.lesson_theme).includes(t));

    if (f?.useModulo && f.moduloSelecionado)
      avail = avail.filter((a) => a.module_name === f.moduloSelecionado);

    if (f?.useTempo)
      avail =
        f.tempoFiltroTipo === "mais"
          ? avail.filter((a) => a.duration_min > f.tempoFiltroValor)
          : avail.filter((a) => a.duration_min < f.tempoFiltroValor);

    if (f?.ordenacao === "peso") avail.sort((a, b) => b.peso - a.peso);
    else if (f?.ordenacao === "A-Z")
      avail.sort((a, b) => a.lesson_theme.localeCompare(b.lesson_theme));
    else if (f?.ordenacao === "modulo")
      avail.sort(
        (a, b) =>
          modules.indexOf(a.module_name) - modules.indexOf(b.module_name)
      );

    // combine: selected first (preserve order), then available filtered (avoid duplicates)
    const selKeys = new Set(selItems.map(key));
    const rest = avail.filter((a) => !selKeys.has(key(a)));
    return [...selItems, ...rest];
  }, [available, q, f, modules, selectedAvailable]);

  const onFiltros = (x: PopoverFiltros) => {
    setF(x);
    setActive({
      modulo:
        x.useModulo && x.moduloSelecionado ? x.moduloSelecionado : undefined,
      tempo: x.useTempo
        ? x.tempoFiltroTipo === "mais"
          ? `Mais de ${x.tempoFiltroValor} min`
          : `Menos de ${x.tempoFiltroValor} min`
        : undefined,
      ordenacao:
        x.ordenacao === "peso"
          ? "Peso"
          : x.ordenacao === "A-Z"
          ? "A-Z"
          : x.ordenacao === "modulo"
          ? "Módulos"
          : undefined,
    });
  };
  // WeekData = { week: number | string; lessons: Aula[] }

const calcSummary = (weeks: WeekData[]) => {
  const minutes_per_week = weeks.map((w) =>
    w.lessons.reduce((sum, a) => sum + (Number(a.duration_min) || 0), 0)
  );
  const total_minutes = minutes_per_week.reduce((s, m) => s + m, 0);
  return { total_minutes, minutes_per_week };
};


  const onDragEnd = ({ source, destination }: DropResult) => {
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;

    // ===== LIXEIRA: soltou no remaining -> remove da week e volta pro available =====
    if (destination.droppableId === "remaining-trash") {
      let removed: Aula | null = null;

      setWeeks((prev) => {
        const s = prev.findIndex((w) => String(w.week) === source.droppableId);
        if (s < 0) return prev;

        const next = prev.map((w) => ({ ...w, lessons: [...w.lessons] }));
        removed = next[s].lessons.splice(source.index, 1)[0] ?? null;
        return next;
      });

      if (removed) setAvailable((prev) => [removed!, ...prev]);
      return;
    }

    // ===== mover entre weeks (como já era) =====
    setWeeks((prev) => {
      const s = prev.findIndex((w) => String(w.week) === source.droppableId);
      const d = prev.findIndex((w) => String(w.week) === destination.droppableId);
      if (s < 0 || d < 0) return prev;

      const next = prev.map((w) => ({ ...w, lessons: [...w.lessons] }));
      const [moved] = next[s].lessons.splice(source.index, 1);
      next[d].lessons.splice(destination.index, 0, moved);
      return next;
    });
  };

  return (
    <AnimatePresence>
      {open && data && (
        <motion.div
          className="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="modalBox"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="top">
              <div className="top-left">
                <img src={imgFeliz} alt="Ícone de felicidade" />
                <h2>Cronograma de {data.c.name}</h2>
              </div>
              <div className="top-right">
                <button
                  style={{ backgroundColor: "#02D6AD" }}
                  onClick={() => {
                  const summary = calcSummary(weeks);
                  const cronogramaAtualizado = {
                    ...data.c.cronograma,
                    weeks,
                    summary,
                  };
                  onSend?.(data.c.id, data.c.email, cronogramaAtualizado);
                }}
                >
                  Enviar
                </button>
                <button
                  style={{ backgroundColor: "#161F7A" }}
                  onClick={onClose}
                >
                  Sair
                </button>
              </div>
            </div>

            <div className="modal-body">
              {/* ======= DragDropContext agora envolve as duas colunas ======= */}
              <DragDropContext onDragEnd={onDragEnd}>
                <div className="available-list">
                  <h2>Aulas Disponiveis</h2>

                  <div className="search-field">
                    <img src={svgLupa} alt="lupa" />
                    <input
                      type="text"
                      placeholder="Buscar aula por nome.."
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                    />
                    <FiltroPopover
                      moduleList={modules}
                      onAplicarFiltro={onFiltros}
                    />
                  </div>

                  <div className="filter-list">
                    {active?.modulo && (
                      <div className="filter">
                        <p>{active.modulo}</p>
                      </div>
                    )}
                    {active?.tempo && (
                      <div className="filter">
                        <p>{active.tempo}</p>
                      </div>
                    )}
                    {active?.ordenacao && (
                      <div className="filter">
                        <p>Ordenado por: {active.ordenacao}</p>
                      </div>
                    )}
                  </div>

                  {/* ======= LIXEIRA: remaining vira droppable ======= */}
                  <Droppable droppableId="remaining-trash">
                    {(provided) => (
                      <div
                        className="lesson-list"
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                      >
                        {filtered.map((aula, i) => {
                          const key = (x: Aula) =>
                            `${x.module_name}||${x.lesson_theme}`;
                          const isSelected = selectedAvailable.some(
                            (s) => key(s) === key(aula)
                          );

                          return (
                            <div
                              key={`${aula.module_name}-${aula.lesson_theme}-${i}`}
                              className={`lessons ${
                                isSelected ? "selected" : ""
                              }`}
                              style={{
                                border: isSelected
                                  ? "2px solid #02D6AD"
                                  : "2px solid transparent",
                                borderRadius: 6,
                              }}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedAvailable((prev) =>
                                    prev.filter((s) => key(s) !== key(aula))
                                  );
                                  setAvailable((prev) =>
                                    prev.some((p) => key(p) === key(aula))
                                      ? prev
                                      : [aula, ...prev]
                                  );
                                } else {
                                  setSelectedAvailable((prev) => [
                                    ...prev,
                                    aula,
                                  ]);
                                  setAvailable((prev) =>
                                    prev.filter((p) => key(p) !== key(aula))
                                  );
                                }
                              }}
                            >
                              <div className="lesson-title">
                                <p>{aula.lesson_theme}</p>
                              </div>
                              <div className="lesson-duration">
                                <span>{aula.duration_min}</span>
                              </div>
                            </div>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>

                <div className="weeks-list">
                  {weeks.map((w) => (
                    <Droppable
                      droppableId={String(w.week)}
                      key={String(w.week)}
                    >
                      {(provided) => (
                        <div
                          className="week"
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                        >
                          <div className="week-top">
                            <h2>
                              Semana {w.week} (
                              {w.lessons.reduce(
                                (sum, a) => sum + (a.duration_min ?? 0),
                                0
                              )}{" "}
                              min)
                            </h2>

                            {selectedAvailable.length > 0 && (
                              <button
                                className="add-selected-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const key = (x: Aula) =>
                                    `${x.module_name}||${x.lesson_theme}`;
                                  const existingKeys = new Set(
                                    w.lessons.map(key)
                                  );
                                  const toAdd = selectedAvailable.filter(
                                    (s) => !existingKeys.has(key(s))
                                  );
                                  if (toAdd.length === 0) return;

                                  setWeeks((prev) =>
                                    prev.map((p) =>
                                      String(p.week) === String(w.week)
                                        ? {
                                            ...p,
                                            lessons: [...p.lessons, ...toAdd],
                                          }
                                        : p
                                    )
                                  );
                                  setSelectedAvailable((prev) =>
                                    prev.filter(
                                      (s) => !toAdd.some((t) => key(t) === key(s))
                                    )
                                  );
                                }}
                                title="Adicionar aulas selecionadas"
                              >
                                <FiPlusCircle size={20} />
                              </button>
                            )}
                          </div>

                          <div className="week-body">
                            {w.lessons.map((aula, i) => (
                              <Draggable
                                key={`${w.week}-${aula.lesson_theme}-${i}`}
                                draggableId={`${w.week}-${aula.lesson_theme}-${i}`}
                                index={i}
                              >
                                {(provided) => (
                                  <div
                                    className="lessons"
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                  >
                                    <div className="lesson-module">
                                      <p>{aula.module_name}</p>
                                    </div>
                                    <div className="lesson-title">
                                      <p>{aula.lesson_theme}</p>
                                    </div>
                                    <div className="lesson-duration">
                                      <span>{aula.duration_min}</span>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        </div>
                      )}
                    </Droppable>
                  ))}
                </div>
              </DragDropContext>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
