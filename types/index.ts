export type MealType = 'cafe_manha' | 'lanche_manha' | 'almoco' | 'lanche_tarde' | 'jantar' | 'ceia'
export type FoodSource = 'tbca' | 'custom'
export type FoodCategory =
  | 'cereais'
  | 'leguminosas'
  | 'carnes_aves'
  | 'peixes'
  | 'ovos'
  | 'laticinios'
  | 'vegetais'
  | 'frutas'
  | 'gorduras'
  | 'bebidas'
  | 'preparacoes'
  | 'outros'

export const MEAL_LABELS: Record<MealType, string> = {
  cafe_manha: 'Café da Manhã',
  lanche_manha: 'Lanche da Manhã',
  almoco: 'Almoço',
  lanche_tarde: 'Lanche da Tarde',
  jantar: 'Jantar',
  ceia: 'Ceia',
}

export const MEAL_ICONS: Record<MealType, string> = {
  cafe_manha: '☀️',
  lanche_manha: '🍎',
  almoco: '🍽️',
  lanche_tarde: '🥐',
  jantar: '🌙',
  ceia: '⭐',
}

export const CATEGORY_LABELS: Record<FoodCategory, string> = {
  cereais: 'Cereais e Derivados',
  leguminosas: 'Leguminosas',
  carnes_aves: 'Carnes e Aves',
  peixes: 'Peixes e Frutos do Mar',
  ovos: 'Ovos',
  laticinios: 'Laticínios',
  vegetais: 'Vegetais e Legumes',
  frutas: 'Frutas',
  gorduras: 'Gorduras e Óleos',
  bebidas: 'Bebidas',
  preparacoes: 'Preparações',
  outros: 'Outros',
}

export interface Food {
  id: string
  name: string
  calories_per_100g: number
  protein_per_100g: number
  carbs_per_100g: number
  fat_per_100g: number
  fiber_per_100g: number
  category: FoodCategory
  source: FoodSource
  created_by?: string
}

export interface MealLogItem {
  id: string
  meal_log_id: string
  food_id: string
  food: Food
  quantity_g: number
}

export interface MealLog {
  id: string
  user_id: string
  date: string
  meal_type: MealType
  items: MealLogItem[]
}

export interface MarmitaItem {
  id: string
  marmita_id: string
  food_id: string
  food: Food
  quantity_g: number
}

export interface Marmita {
  id: string
  user_id: string
  name: string
  description?: string
  items: MarmitaItem[]
  created_at: string
}

export interface Profile {
  id: string
  name: string
  calorie_goal: number
  protein_goal: number
  carbs_goal: number
  fat_goal: number
}

export interface WeeklyPlan {
  id: string
  user_id: string
  date: string
  meal_type: MealType
  marmita_id?: string
  marmita?: Marmita
}

export function calcNutrients(food: Food, grams: number) {
  const ratio = grams / 100
  return {
    calories: Math.round(food.calories_per_100g * ratio * 10) / 10,
    protein: Math.round(food.protein_per_100g * ratio * 10) / 10,
    carbs: Math.round(food.carbs_per_100g * ratio * 10) / 10,
    fat: Math.round(food.fat_per_100g * ratio * 10) / 10,
  }
}

export function sumMarmita(items: MarmitaItem[]) {
  return items.reduce(
    (acc, item) => {
      const n = calcNutrients(item.food, item.quantity_g)
      return {
        calories: acc.calories + n.calories,
        protein: acc.protein + n.protein,
        carbs: acc.carbs + n.carbs,
        fat: acc.fat + n.fat,
      }
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )
}
