import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { createClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Chave da API Gemini não configurada. Adicione GEMINI_API_KEY nas variáveis de ambiente.' },
      { status: 503 }
    )
  }

  const body = await req.json()
  const {
    targetCalories,
    restrictions = '',
    preferences = '',
    mealType = 'almoço',
  } = body

  // Buscar banco de alimentos para passar ao modelo
  const { data: foods } = await supabase
    .from('foods')
    .select('name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, category')
    .order('name')

  const foodList = (foods || [])
    .map((f) =>
      `- ${f.name}: ${f.calories_per_100g} kcal, P ${f.protein_per_100g}g, C ${f.carbs_per_100g}g, G ${f.fat_per_100g}g (por 100g)`
    )
    .join('\n')

  const prompt = `Você é um nutricionista especializado em marmitas fitness brasileiras.

O usuário quer montar uma marmita para ${mealType} com aproximadamente ${targetCalories} kcal.
${restrictions ? `Restrições/alergias: ${restrictions}` : ''}
${preferences ? `Preferências: ${preferences}` : ''}

Banco de alimentos disponível no app:
${foodList}

Sugira 3 opções de marmita diferentes (variedade de sabores e proteínas), usando SOMENTE alimentos da lista acima.
Para cada marmita inclua:
1. Um nome criativo
2. Lista de ingredientes com quantidade em gramas
3. Totais nutricionais calculados (kcal, proteína, carb, gordura)
4. Breve dica nutricional

Responda SOMENTE com JSON válido neste formato exato (sem markdown, sem texto antes ou depois):
{
  "sugestoes": [
    {
      "nome": "Nome da Marmita",
      "ingredientes": [
        { "alimento": "Nome exato do alimento da lista", "gramas": 150 }
      ],
      "totais": { "calorias": 520, "proteina": 42, "carboidrato": 45, "gordura": 12 },
      "dica": "Texto curto com dica nutricional"
    }
  ]
}`

  try {
    const genai = new GoogleGenAI({ apiKey })
    const result = await genai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    })

    const text = result.text ?? ''
    // Extrair JSON da resposta (às vezes vem com backticks)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Resposta inválida do modelo')

    const data = JSON.parse(jsonMatch[0])
    return NextResponse.json(data)
  } catch (err) {
    console.error('Gemini error:', err)
    return NextResponse.json(
      { error: 'Erro ao gerar sugestões. Tente novamente.' },
      { status: 500 }
    )
  }
}
