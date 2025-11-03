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
import { Cronograma } from "./components/Cronograma";
import type { PartData, formQuestion, Step } from "./types/types";
import './App.css'
import { SortableContext } from "@dnd-kit/sortable";
import DndKitList from "./components/SortableContext";

/**
 * Maps each step to the next step in the workflow.
 */
const NEXT_STATE: Record<Step, Step> = {
  part1: "part2",
  part2: "part3",
  part3: "cronograma",
  cronograma: "part1",
};

/**
 * Maps each step to the previous step in the workflow.
 */
const PREV_STATE: Record<Step, Step> = {
  part1: "cronograma",
  part2: "part1",
  part3: "part2",
  cronograma: "part3",
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

  // ======= Conditional Rendering =======

  return (
    <div>

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
          onNext={(data) => handleNext("part3", data)}
          onPrev={() => handlePrev("part3")}
          InitialData={formData.find(p => p.part === "part3")?.data}
        />
      )}

      {/* === Schedule (Cronograma) === */}
      {step === "cronograma" && (
        <Cronograma
          onNext={(data) => handleNext("cronograma", data)}
          onPrev={() => handlePrev("cronograma")}
          data = {formData}
        />
      )}
    </div>
  );
}
