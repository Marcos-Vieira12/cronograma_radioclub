/**
 * Shared type definitions for the multi-step form components.
 *
 * This file centralizes all interfaces and type aliases used throughout
 * the form workflow, ensuring consistency between steps (Part1, Part2, Part3, Cronograma)
 * and between user inputs, responses, and navigation logic.
 */

/**
 * Supported input field types across the form.
 */
export type InputType = "text" | "email" | "select" | "textarea" | "checkbox";

/**
 * Represents a single question's response within a form step.
 *
 * @property id - Unique identifier for the question.
 * @property question - The full question text displayed to the user.
 * @property type - Input type used to answer (text, checkbox, etc.).
 * @property answer - User's response (string or string array for multi-select inputs).
 */

export interface formQuestion {
  id: string;
  inputType: InputType;
  placeholder?: string;
  question: string;
  answer?: string | string[];
  options?: string[];
  openOption?: string;
  isRequired?: boolean;
}

/**
 * Identifies the current step of the multi-step form.
 */
export type Step = "part1" | "part2" | "part3" | "cronograma";

/**
 * Represents a collection of responses within a specific form part.
 *
 * @property part - The corresponding step (e.g., part1, part2, part3, or cronograma).
 * @property data - List of all `QuestionResponse` objects answered in that part.
 */
export interface PartData {
  part: Step;
  data: formQuestion[];
}

