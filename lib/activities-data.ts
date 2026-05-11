/**
 * MET values from: Ainsworth BE et al.
 * "2011 Compendium of Physical Activities: a second update of codes and MET values."
 * Med Sci Sports Exerc. 2011;43(8):1575–1581. DOI:10.1249/MSS.0b013e31821ece12
 *
 * Calorias = MET × peso_kg × (minutos / 60)
 */

export interface ActivityDef {
  name: string
  met: number
  category: string
  icon: string
}

export const ACTIVITIES: ActivityDef[] = [
  // Caminhada
  { name: 'Caminhada leve',           met: 2.8,  category: 'Cardio',      icon: '🚶' },
  { name: 'Caminhada moderada',        met: 3.5,  category: 'Cardio',      icon: '🚶' },
  { name: 'Caminhada rápida',          met: 4.3,  category: 'Cardio',      icon: '🚶' },
  { name: 'Caminhada em subida',       met: 5.3,  category: 'Cardio',      icon: '⛰️' },
  // Corrida
  { name: 'Corrida leve (6 km/h)',     met: 6.0,  category: 'Cardio',      icon: '🏃' },
  { name: 'Corrida moderada (8 km/h)', met: 8.3,  category: 'Cardio',      icon: '🏃' },
  { name: 'Corrida intensa (10 km/h)', met: 9.8,  category: 'Cardio',      icon: '🏃' },
  { name: 'Corrida rápida (12+ km/h)', met: 11.0, category: 'Cardio',      icon: '🏃' },
  // Ciclismo
  { name: 'Ciclismo leve',             met: 4.0,  category: 'Cardio',      icon: '🚴' },
  { name: 'Ciclismo moderado',         met: 6.8,  category: 'Cardio',      icon: '🚴' },
  { name: 'Ciclismo intenso',          met: 10.0, category: 'Cardio',      icon: '🚴' },
  { name: 'Spinning',                  met: 8.5,  category: 'Cardio',      icon: '🚴' },
  // Musculação
  { name: 'Musculação leve',           met: 3.0,  category: 'Musculação',  icon: '🏋️' },
  { name: 'Musculação moderada',       met: 3.5,  category: 'Musculação',  icon: '🏋️' },
  { name: 'Musculação intensa',        met: 5.0,  category: 'Musculação',  icon: '🏋️' },
  { name: 'CrossFit',                  met: 7.0,  category: 'Musculação',  icon: '🏋️' },
  // Outros cardio
  { name: 'Natação moderada',          met: 5.8,  category: 'Cardio',      icon: '🏊' },
  { name: 'Natação intensa',           met: 8.3,  category: 'Cardio',      icon: '🏊' },
  { name: 'Pular corda',              met: 10.0, category: 'Cardio',      icon: '⏭️' },
  { name: 'HIIT',                      met: 8.0,  category: 'Cardio',      icon: '⚡' },
  { name: 'Elíptico moderado',         met: 5.0,  category: 'Cardio',      icon: '🏃' },
  { name: 'Remo (ergômetro)',          met: 7.0,  category: 'Cardio',      icon: '🚣' },
  { name: 'Esteira inclinada',         met: 6.0,  category: 'Cardio',      icon: '🏃' },
  // Esportes
  { name: 'Futebol',                   met: 7.0,  category: 'Esportes',    icon: '⚽' },
  { name: 'Basquete',                  met: 6.5,  category: 'Esportes',    icon: '🏀' },
  { name: 'Vôlei',                     met: 4.0,  category: 'Esportes',    icon: '🏐' },
  { name: 'Tênis',                     met: 7.3,  category: 'Esportes',    icon: '🎾' },
  { name: 'Natação — esportes',        met: 6.0,  category: 'Esportes',    icon: '🏊' },
  // Flexibilidade / mente-corpo
  { name: 'Yoga',                      met: 2.5,  category: 'Flexibilidade', icon: '🧘' },
  { name: 'Pilates',                   met: 3.0,  category: 'Flexibilidade', icon: '🧘' },
  { name: 'Alongamento',               met: 2.3,  category: 'Flexibilidade', icon: '🤸' },
  { name: 'Dança',                     met: 5.0,  category: 'Flexibilidade', icon: '💃' },
]

export const ACTIVITY_CATEGORIES = [...new Set(ACTIVITIES.map((a) => a.category))]

export function calcCaloriesBurned(met: number, weightKg: number, durationMin: number): number {
  return Math.round(met * weightKg * (durationMin / 60))
}
