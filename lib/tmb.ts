/**
 * Cálculo de Taxa Metabólica Basal (TMB) e Gasto Energético Total (GET)
 *
 * Equações validadas academicamente:
 * - Mifflin-St Jeor (1990): mais precisa para adultos em geral
 *   Mifflin MD et al. "A new predictive equation for resting energy expenditure in healthy individuals."
 *   Am J Clin Nutr. 1990;51(2):241–247. DOI:10.1093/ajcn/51.2.241
 *
 * - Harris-Benedict Revisada (Roza & Shizgal, 1984): clássica, amplamente usada
 *   Roza AM, Shizgal HM. "The Harris Benedict equation reevaluated."
 *   Am J Clin Nutr. 1984;40(1):168–182. DOI:10.1093/ajcn/40.1.168
 */

export type Sex = 'masculino' | 'feminino'

export type ActivityLevel =
  | 'sedentario'
  | 'leve'
  | 'moderado'
  | 'ativo'
  | 'muito_ativo'

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentario: 'Sedentário (sem exercícios)',
  leve: 'Leve (1–3x/semana)',
  moderado: 'Moderado (3–5x/semana)',
  ativo: 'Ativo (6–7x/semana)',
  muito_ativo: 'Muito ativo (atleta / trabalho físico intenso)',
}

// Fatores de atividade (Harris-Benedict / Mifflin)
const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentario: 1.2,
  leve: 1.375,
  moderado: 1.55,
  ativo: 1.725,
  muito_ativo: 1.9,
}

export interface TmbInput {
  weight_kg: number
  height_cm: number
  age_years: number
  sex: Sex
  activity: ActivityLevel
}

export interface TmbResult {
  tmb_mifflin: number
  tmb_harris: number
  get_mifflin: number
  get_harris: number
  /** Recomendado para exibição principal */
  recommended_tmb: number
  recommended_get: number
  activity_factor: number
}

export function calcTmb(input: TmbInput): TmbResult {
  const { weight_kg: w, height_cm: h, age_years: a, sex, activity } = input
  const factor = ACTIVITY_FACTORS[activity]

  // Mifflin-St Jeor (1990)
  const tmb_mifflin =
    sex === 'masculino'
      ? 10 * w + 6.25 * h - 5 * a + 5
      : 10 * w + 6.25 * h - 5 * a - 161

  // Harris-Benedict Revisada — Roza & Shizgal (1984)
  const tmb_harris =
    sex === 'masculino'
      ? 88.362 + 13.397 * w + 4.799 * h - 5.677 * a
      : 447.593 + 9.247 * w + 3.098 * h - 4.33 * a

  return {
    tmb_mifflin: Math.round(tmb_mifflin),
    tmb_harris: Math.round(tmb_harris),
    get_mifflin: Math.round(tmb_mifflin * factor),
    get_harris: Math.round(tmb_harris * factor),
    recommended_tmb: Math.round(tmb_mifflin),
    recommended_get: Math.round(tmb_mifflin * factor),
    activity_factor: factor,
  }
}

/** Sugestão de macros baseada no GET e objetivo */
export type Goal = 'perder' | 'manter' | 'ganhar'

export const GOAL_LABELS: Record<Goal, string> = {
  perder: 'Perder peso (déficit ~500 kcal)',
  manter: 'Manter peso',
  ganhar: 'Ganhar massa (superávit ~300 kcal)',
}

export function suggestCalories(get: number, goal: Goal): number {
  if (goal === 'perder') return Math.max(1200, get - 500)
  if (goal === 'ganhar') return get + 300
  return get
}
