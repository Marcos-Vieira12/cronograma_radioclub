import { motion, AnimatePresence } from "framer-motion";
import "./styles/modal.css";
import type { Aula, Cronograma } from "./types";
import imgFeliz from "./assets/imgFeliz.png";
import svgLupa from "./assets/svgLupa.svg";
import React, { useEffect, useState } from "react";
import { FiltroPopover } from "./filtroPopover";
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
  onSend?: (id: string, email: string) => void;
}

type WeekData = {
  week: number | string;
  lessons: Aula[];
};

export const Modal = ({ open, onClose, data, onSend }: ModalProps) => {
  const remainingLessons = React.useMemo(() => {
    const remainingWeek = data?.c.cronograma.weeks.find(
      (w: any) => w.week === "remaining"
    );
    return remainingWeek?.lessons ?? [];
  }, [data]);

  const module_list = Array.from(
    new Set(remainingLessons.map((lesson: Aula) => lesson.module_name))
  );

  const [activeFilters, setActiveFilters] = useState<{
    modulo?: string;
    tempo?: string;
    ordenacao?: string;
  } | null>(null);

  const [filteredLessons, setFilteredLessons] =
    useState<Aula[]>(remainingLessons);

  useEffect(() => {
    setFilteredLessons(remainingLessons);
  }, [remainingLessons]);

  const handleFiltros = (filtros: {
    useModulo: boolean;
    moduloSelecionado: string | null;
    useTempo: boolean;
    tempoFiltroTipo: "mais" | "menos";
    tempoFiltroValor: number;
    ordenacao: "peso" | "A-Z" | "modulo";
  }) => {
    let resultado = [...remainingLessons];

    if (filtros.useModulo && filtros.moduloSelecionado) {
      resultado = resultado.filter(
        (a) => a.module_name === filtros.moduloSelecionado
      );
    }

    if (filtros.useTempo) {
      if (filtros.tempoFiltroTipo === "mais") {
        resultado = resultado.filter(
          (a) => a.duration_min > filtros.tempoFiltroValor
        );
      } else {
        resultado = resultado.filter(
          (a) => a.duration_min < filtros.tempoFiltroValor
        );
      }
    }

    if (filtros.ordenacao === "peso") {
      resultado.sort((a, b) => b.peso - a.peso);
    } else if (filtros.ordenacao === "A-Z") {
      resultado.sort((a, b) => a.lesson_theme.localeCompare(b.lesson_theme));
    } else if (filtros.ordenacao === "modulo") {
      resultado.sort(
        (a, b) =>
          module_list.indexOf(a.module_name) -
          module_list.indexOf(b.module_name)
      );
    }

    setActiveFilters({
      modulo:
        filtros.useModulo && filtros.moduloSelecionado
          ? filtros.moduloSelecionado
          : undefined,

      tempo: filtros.useTempo
        ? filtros.tempoFiltroTipo === "mais"
          ? `Mais de ${filtros.tempoFiltroValor} min`
          : `Menos de ${filtros.tempoFiltroValor} min`
        : undefined,

      ordenacao:
        filtros.ordenacao === "peso"
          ? "Peso"
          : filtros.ordenacao === "A-Z"
          ? "A-Z"
          : filtros.ordenacao === "modulo"
          ? "Módulos"
          : undefined,
    });

    setFilteredLessons(resultado);
  };

  const initialWeeks = React.useMemo<WeekData[]>(() => {
    const allWeeks = (data?.c.cronograma.weeks ?? []).filter(
      (w: any) => w.week !== "remaining"
    );
    return allWeeks as WeekData[];
  }, [data]);

  const [weeksState, setWeeksState] = useState<WeekData[]>(initialWeeks);

  useEffect(() => {
    setWeeksState(initialWeeks);
  }, [initialWeeks]);

  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    if (!destination) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    setWeeksState((prev) => {
      const sourceWeekIdx = prev.findIndex(
        (w) => String(w.week) === source.droppableId
      );
      const destWeekIdx = prev.findIndex(
        (w) => String(w.week) === destination.droppableId
      );

      if (sourceWeekIdx === -1 || destWeekIdx === -1) return prev;

      const newWeeks = prev.map((w) => ({
        ...w,
        lessons: [...w.lessons],
      }));

      const [moved] = newWeeks[sourceWeekIdx].lessons.splice(
        source.index,
        1
      );
      newWeeks[destWeekIdx].lessons.splice(destination.index, 0, moved);

      return newWeeks;
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
                  onClick={() => onSend?.(data.c.id, data.c.email)}
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
              <div className="available-list">
                <h2>Aulas Disponiveis</h2>
                <div className="search-field">
                  <img src={svgLupa} alt="lupa" />
                  <input type="text" placeholder="Buscar aula por nome.." />
                  <FiltroPopover
                    moduleList={module_list}
                    onAplicarFiltro={handleFiltros}
                  />
                </div>

                <div className="filter-list">
                  {activeFilters?.modulo && (
                    <div className="filter">
                      <p>{activeFilters.modulo}</p>
                    </div>
                  )}

                  {activeFilters?.tempo && (
                    <div className="filter">
                      <p>{activeFilters.tempo}</p>
                    </div>
                  )}

                  {activeFilters?.ordenacao && (
                    <div className="filter">
                      <p>Ordenado por: {activeFilters.ordenacao}</p>
                    </div>
                  )}
                </div>

                <div className="lesson-list">
                  {filteredLessons.map((aula, index) => (
                    <div key={index} className="lessons">
                      <div className="lesson-title">
                        <p>{aula.lesson_theme}</p>
                      </div>
                      <div className="lesson-duration">
                        <span> {aula.duration_min}</span>
                      </div>
                    </div>
                  ))}

                </div>
              </div>

              <DragDropContext onDragEnd={handleDragEnd}>
  <div className="weeks-list">
    {weeksState.map((weekObj) => (
      <Droppable
        droppableId={String(weekObj.week)}
        key={String(weekObj.week)}
      >
        {(provided) => (
          <div
            className="week"
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            <div className="week-top">
              <h2>Semana {weekObj.week}</h2>
            </div>

            <div className="week-body">
  {weekObj.lessons.map((aula, index) => {
    const draggableId = `${weekObj.week}-${index}-${aula.lesson_theme}`;

    return (
      <Draggable
        key={draggableId}
        draggableId={draggableId}
        index={index}
      >
        {(provided) => (
          <div
            className="lessons "
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
    );
  })}
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
