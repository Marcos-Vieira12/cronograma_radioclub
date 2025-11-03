import { useState } from "react";
import {
    DndContext,
    closestCenter,
    useSensor,
    useSensors,
    PointerSensor,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Entry = {
    id: string;
    type: "label" | "item";
    text: string;
};

// Componente que representa cada linha (label ou item)
function Line({ entry, onChange }: { entry: Entry; onChange: (id: string, text: string) => void }) {
    const { id, type, text } = entry;

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id, disabled: type === "label" });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        padding: "10px",
        marginBottom: "6px",
        borderRadius: "6px",
        background:
            type === "label"
                ? "#262626" // label background (darker)
                : isDragging
                ? "#2b6cff" // dragging highlight (blue)
                : "#1f1f1f", // item background (dark)
        boxShadow: isDragging ? "0 6px 18px rgba(43,108,255,0.22)" : "none",
        cursor: type === "label" ? "default" : "grab",
        display: "flex",
        alignItems: "center",
        gap: 8,
        color: "#fff", // text color for inputs
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...(type === "item" ? listeners : {})}>
            {type === "label" ? (
                <input
                    value={text}
                    onChange={(e) => onChange(id, e.target.value)}
                    style={{
                        fontWeight: 700,
                        fontSize: 14,
                        border: "none",
                        background: "transparent",
                        outline: "none",
                        width: "100%",
                        color: "#fff",
                    }}
                />
            ) : (
                <input
                    value={text}
                    onChange={(e) => onChange(id, e.target.value)}
                    style={{
                        border: "none",
                        background: "transparent",
                        outline: "none",
                        width: "100%",
                        color: "#fff",
                    }}
                />
            )}
        </div>
    );
}

export default function DndKitWeeksSingleList() {
    const [entries, setEntries] = useState<Entry[]>([
        { id: "lbl-1", type: "label", text: "Semana 1" },
        { id: "itm-1", type: "item", text: "Item 1" },
        { id: "itm-2", type: "item", text: "Item 2" },

        { id: "lbl-2", type: "label", text: "Semana 2" },
        { id: "itm-3", type: "item", text: "Item 3" },
        { id: "itm-4", type: "item", text: "Item 4" },

        { id: "lbl-3", type: "label", text: "Semana 3" },
        { id: "itm-5", type: "item", text: "Item 5" },
        { id: "itm-6", type: "item", text: "Item 6" },

        { id: "lbl-4", type: "label", text: "Semana 4" },
        { id: "itm-7", type: "item", text: "Item 7" },
        { id: "itm-8", type: "item", text: "Item 8" },

        { id: "lbl-5", type: "label", text: "Semana 5" },
        { id: "itm-9", type: "item", text: "Item 9" },
        { id: "itm-10", type: "item", text: "Item 10" },

        { id: "lbl-6", type: "label", text: "Semana 6" },
        { id: "itm-11", type: "item", text: "Item 11" },
        { id: "itm-12", type: "item", text: "Item 12" },

        { id: "lbl-7", type: "label", text: "Semana 7" },
        { id: "itm-13", type: "item", text: "Item 13" },
        { id: "itm-14", type: "item", text: "Item 14" },

        { id: "lbl-8", type: "label", text: "Semana 8" },
        { id: "itm-15", type: "item", text: "Item 15" },
        { id: "itm-16", type: "item", text: "Item 16" },

        { id: "lbl-9", type: "label", text: "Semana 9" },
        { id: "itm-17", type: "item", text: "Item 17" },
        { id: "itm-18", type: "item", text: "Item 18" },

        { id: "lbl-10", type: "label", text: "Semana 10" },
        { id: "itm-19", type: "item", text: "Item 19" },
        { id: "itm-20", type: "item", text: "Item 20" },

        { id: "lbl-11", type: "label", text: "Semana 11" },
        { id: "itm-21", type: "item", text: "Item 21" },
        { id: "itm-22", type: "item", text: "Item 22" },

        { id: "lbl-12", type: "label", text: "Semana 12" },
        { id: "itm-23", type: "item", text: "Item 23" },
        { id: "itm-24", type: "item", text: "Item 24" },
    ]);

    const sensors = useSensors(useSensor(PointerSensor));

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        const oldIndex = entries.findIndex((e) => e.id === activeId);
        const overIndex = entries.findIndex((e) => e.id === overId);
        if (oldIndex === -1 || overIndex === -1) return;

        // só permitir mover se o elemento ativo for um item (labels não são arrastáveis já que estão disabled)
        if (entries[oldIndex].type !== "item") return;

        let newIndex = overIndex;

        // Se estiver sobre uma label, decide inserir antes/ depois dependendo da direção:
        if (entries[overIndex].type === "label") {
            if (oldIndex < overIndex) {
                // arrastando para baixo -> inserir depois da label
                newIndex = overIndex + 1;
            } else {
                // arrastando para cima -> inserir antes da label
                newIndex = overIndex;
            }
            // limite do índice
            if (newIndex > entries.length - 1) newIndex = entries.length - 1;
        }

        if (oldIndex === newIndex || oldIndex + 1 === newIndex) {
            // nada para fazer (posições equivalentes)
            return;
        }

        const newEntries = arrayMove(entries, oldIndex, newIndex);
        setEntries(newEntries);
    };

    const handleTextChange = (id: string, text: string) => {
        setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, text } : e)));
    };

    return (
        <div style={{ padding: 8, background: "#0b0b0b", minHeight: "100vh" }}>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={entries.map((e) => e.id)} strategy={verticalListSortingStrategy}>
                    <div
                        style={{
                            background: "#0f0f10",
                            borderRadius: 8,
                            padding: 8,
                            border: "1px solid #212121",
                            minWidth: 300,
                        }}
                    >
                        {entries.map((entry) => (
                            <Line key={entry.id} entry={entry} onChange={handleTextChange} />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
}
