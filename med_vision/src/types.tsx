export interface Cronograma {
  id: string;
  name: string;
  email: string;
  nivel: string;
  respostas: Record<string, string | string[]>;
  cronograma: CronogramaData;
  status: boolean; // true = enviado / false = pendente
  modifier: string;
}

export interface Aula {
  module_name: string;
  lesson_theme: string;
  duration_min: number;
  peso: number;
}

export interface WeekBlock {
  week: number | "remaining";
  lessons: Aula[];
}

export interface CronogramaSummary {
  total_minutes: number;
  minutes_per_week: number[];
}

export interface CronogramaParams {
  tempo_min_semana: number;
  tempo_max_semana: number;
}

export interface CronogramaData {
  weeks: WeekBlock[];
  summary: CronogramaSummary;
  params: CronogramaParams;
}


export type AulaUI = Aula & { uid: string };
