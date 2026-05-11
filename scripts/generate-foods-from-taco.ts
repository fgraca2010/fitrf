/**
 * Script para gerar lib/foods-data.ts e supabase/005_seed_taco_foods.sql
 * a partir do CSV oficial da TACO (UNICAMP/NEPA) disponível no GitHub.
 *
 * Uso: npx tsx scripts/generate-foods-from-taco.ts
 */

import fs from 'fs'
import path from 'path'
import https from 'https'

const CSV_URL =
  'https://raw.githubusercontent.com/machine-learning-mocha/taco/master/tabelas/alimentos.csv'

const CATEGORY_MAP: Record<string, string> = {
  'Cereais e derivados': 'cereais',
  'Leguminosas e derivados': 'leguminosas',
  'Carnes e derivados': 'carnes_aves',
  'Aves e derivados': 'carnes_aves',
  'Pescados e frutos do mar': 'peixes',
  'Ovos e derivados': 'ovos',
  'Leite e derivados': 'laticinios',
  'Verduras, hortaliças e derivados': 'vegetais',
  'Frutas e derivados': 'frutas',
  'Gorduras e óleos': 'gorduras',
  'Nozes e sementes': 'gorduras',
  'Bebidas (alcoólicas e não alcoólicas)': 'bebidas',
  'Alimentos preparados': 'preparacoes',
  'Produtos açucarados': 'outros',
  'Miscelâneas': 'outros',
  'Outros alimentos industrializados': 'outros',
}

function fetchText(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        fetchText(res.headers.location!).then(resolve).catch(reject)
        return
      }
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => resolve(data))
      res.on('error', reject)
    }).on('error', reject)
  })
}

function parseNum(val: string): number | null {
  const trimmed = val.trim()
  if (!trimmed || trimmed === 'NA' || trimmed === '*') return null
  if (trimmed === 'Tr') return 0
  return parseFloat(trimmed.replace(',', '.')) || null
}

interface Food {
  name: string
  category: string
  calories: number
  protein: number | null
  carbs: number | null
  fat: number | null
  fiber: number | null
}

function parseCSV(csv: string): Food[] {
  const lines = csv.split('\n').filter(Boolean)
  const foods: Food[] = []

  // Skip header (line 0)
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(';')
    if (cols.length < 11) continue

    // Columns (0-indexed):
    // 0: id, 1: category, 2: name, 3: umidade, 4: kcal, 5: kJ,
    // 6: protein, 7: lipids, 8: cholesterol, 9: carbs, 10: fiber
    const rawCategory = cols[1]?.trim()
    const rawName = cols[2]?.trim()
    const category = CATEGORY_MAP[rawCategory] ?? 'outros'
    const calories = parseNum(cols[4])
    const protein = parseNum(cols[6])
    const fat = parseNum(cols[7])
    const carbs = parseNum(cols[9])
    const fiber = parseNum(cols[10])

    if (!rawName || calories === null) continue

    foods.push({ name: rawName, category, calories, protein, carbs, fat, fiber })
  }

  return foods
}

function toTsEntry(f: Food): string {
  const esc = (s: string) => s.replace(/'/g, "\\'")
  return `  { name: '${esc(f.name)}', calories_per_100g: ${f.calories}, protein_per_100g: ${f.protein ?? 0}, carbs_per_100g: ${f.carbs ?? 0}, fat_per_100g: ${f.fat ?? 0}, fiber_per_100g: ${f.fiber ?? 0}, category: '${f.category}', source: 'tbca' },`
}

function toSqlValue(f: Food): string {
  const esc = (s: string) => s.replace(/'/g, "''")
  return `('${esc(f.name)}', ${f.calories}, ${f.protein ?? 0}, ${f.carbs ?? 0}, ${f.fat ?? 0}, ${f.fiber ?? 0}, '${f.category}', 'tbca')`
}

async function main() {
  console.log('Baixando CSV da TACO...')
  const csv = await fetchText(CSV_URL)
  const foods = parseCSV(csv)
  console.log(`Parsed ${foods.length} alimentos.`)

  // Group by category for readability in TS file
  const grouped = new Map<string, Food[]>()
  for (const f of foods) {
    if (!grouped.has(f.category)) grouped.set(f.category, [])
    grouped.get(f.category)!.push(f)
  }

  const categoryLabels: Record<string, string> = {
    cereais: 'Cereais e Derivados',
    leguminosas: 'Leguminosas',
    carnes_aves: 'Carnes, Aves e Derivados',
    peixes: 'Peixes e Frutos do Mar',
    ovos: 'Ovos e Derivados',
    laticinios: 'Leite e Derivados',
    vegetais: 'Verduras e Hortaliças',
    frutas: 'Frutas e Derivados',
    gorduras: 'Gorduras, Óleos, Nozes e Sementes',
    bebidas: 'Bebidas',
    preparacoes: 'Alimentos Preparados',
    outros: 'Outros',
  }

  const tsLines: string[] = [
    "import { Food } from '@/types'",
    '',
    '// Gerado automaticamente por scripts/generate-foods-from-taco.ts',
    '// Fonte: TACO - Tabela Brasileira de Composição de Alimentos (UNICAMP/NEPA)',
    `// ${foods.length} alimentos · https://github.com/machine-learning-mocha/taco`,
    '',
    "export const TBCA_FOODS: Omit<Food, 'id' | 'created_by'>[] = [",
  ]

  const orderKeys = ['cereais', 'leguminosas', 'carnes_aves', 'peixes', 'ovos', 'laticinios', 'vegetais', 'frutas', 'gorduras', 'bebidas', 'preparacoes', 'outros']
  for (const key of orderKeys) {
    const group = grouped.get(key)
    if (!group?.length) continue
    tsLines.push(``, `  // ${categoryLabels[key]}`)
    for (const f of group) tsLines.push(toTsEntry(f))
  }

  tsLines.push(']', '')

  const tsOut = path.join(process.cwd(), 'lib', 'foods-data.ts')
  fs.writeFileSync(tsOut, tsLines.join('\n'), 'utf8')
  console.log(`✓ Escrito: ${tsOut}`)

  // SQL migration
  const sqlLines = [
    '-- Migração: upsert completo da TACO (UNICAMP/NEPA) — ~600 alimentos',
    '-- Gerado por scripts/generate-foods-from-taco.ts',
    '-- Execute no SQL Editor do Supabase para atualizar bases existentes.',
    '',
    '-- Garante constraint única no nome para o upsert funcionar',
    'ALTER TABLE foods ADD CONSTRAINT foods_name_unique UNIQUE (name);',
    '',
    'INSERT INTO foods (name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, category, source)',
    'VALUES',
    foods.map((f, i) => `  ${toSqlValue(f)}${i < foods.length - 1 ? ',' : ''}`).join('\n'),
    "ON CONFLICT (name) DO UPDATE SET",
    "  calories_per_100g = EXCLUDED.calories_per_100g,",
    "  protein_per_100g  = EXCLUDED.protein_per_100g,",
    "  carbs_per_100g    = EXCLUDED.carbs_per_100g,",
    "  fat_per_100g      = EXCLUDED.fat_per_100g,",
    "  fiber_per_100g    = EXCLUDED.fiber_per_100g,",
    "  category          = EXCLUDED.category,",
    "  source            = EXCLUDED.source;",
    '',
  ]

  const sqlOut = path.join(process.cwd(), 'supabase', '005_seed_taco_foods.sql')
  fs.writeFileSync(sqlOut, sqlLines.join('\n'), 'utf8')
  console.log(`✓ Escrito: ${sqlOut}`)
  console.log('\nPróximos passos:')
  console.log('  1. Revise lib/foods-data.ts e faça git commit')
  console.log('  2. Execute supabase/005_seed_taco_foods.sql no SQL Editor do Supabase')
  console.log('     para atualizar bases de dados já existentes.')
}

main().catch((err) => { console.error(err); process.exit(1) })
