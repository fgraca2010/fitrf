import { Food } from '@/types'

export const TBCA_FOODS: Omit<Food, 'id' | 'created_by'>[] = [
  // Cereais e Derivados
  { name: 'Arroz branco cozido', calories_per_100g: 128, protein_per_100g: 2.5, carbs_per_100g: 28.1, fat_per_100g: 0.1, fiber_per_100g: 1.6, category: 'cereais', source: 'tbca' },
  { name: 'Arroz integral cozido', calories_per_100g: 124, protein_per_100g: 2.6, carbs_per_100g: 25.8, fat_per_100g: 1.0, fiber_per_100g: 2.7, category: 'cereais', source: 'tbca' },
  { name: 'Pão francês', calories_per_100g: 300, protein_per_100g: 9.4, carbs_per_100g: 58.6, fat_per_100g: 3.1, fiber_per_100g: 2.3, category: 'cereais', source: 'tbca' },
  { name: 'Pão integral', calories_per_100g: 253, protein_per_100g: 8.6, carbs_per_100g: 48.0, fat_per_100g: 3.3, fiber_per_100g: 5.0, category: 'cereais', source: 'tbca' },
  { name: 'Macarrão cozido', calories_per_100g: 149, protein_per_100g: 4.5, carbs_per_100g: 30.3, fat_per_100g: 0.5, fiber_per_100g: 1.6, category: 'cereais', source: 'tbca' },
  { name: 'Macarrão integral cozido', calories_per_100g: 137, protein_per_100g: 5.3, carbs_per_100g: 26.5, fat_per_100g: 0.8, fiber_per_100g: 3.2, category: 'cereais', source: 'tbca' },
  { name: 'Aveia em flocos', calories_per_100g: 394, protein_per_100g: 13.9, carbs_per_100g: 66.6, fat_per_100g: 8.5, fiber_per_100g: 9.1, category: 'cereais', source: 'tbca' },
  { name: 'Tapioca (goma)', calories_per_100g: 358, protein_per_100g: 0.2, carbs_per_100g: 88.4, fat_per_100g: 0.2, fiber_per_100g: 0.9, category: 'cereais', source: 'tbca' },
  { name: 'Farinha de mandioca torrada', calories_per_100g: 361, protein_per_100g: 1.4, carbs_per_100g: 87.9, fat_per_100g: 0.3, fiber_per_100g: 6.4, category: 'cereais', source: 'tbca' },
  { name: 'Cuscuz de milho cozido', calories_per_100g: 127, protein_per_100g: 2.7, carbs_per_100g: 28.1, fat_per_100g: 0.4, fiber_per_100g: 1.7, category: 'cereais', source: 'tbca' },
  { name: 'Granola', calories_per_100g: 432, protein_per_100g: 9.2, carbs_per_100g: 67.2, fat_per_100g: 15.0, fiber_per_100g: 5.8, category: 'cereais', source: 'tbca' },

  // Leguminosas
  { name: 'Feijão carioca cozido', calories_per_100g: 76, protein_per_100g: 4.8, carbs_per_100g: 13.6, fat_per_100g: 0.5, fiber_per_100g: 8.5, category: 'leguminosas', source: 'tbca' },
  { name: 'Feijão preto cozido', calories_per_100g: 77, protein_per_100g: 4.5, carbs_per_100g: 14.0, fat_per_100g: 0.5, fiber_per_100g: 8.4, category: 'leguminosas', source: 'tbca' },
  { name: 'Lentilha cozida', calories_per_100g: 93, protein_per_100g: 6.3, carbs_per_100g: 16.7, fat_per_100g: 0.4, fiber_per_100g: 7.9, category: 'leguminosas', source: 'tbca' },
  { name: 'Grão-de-bico cozido', calories_per_100g: 164, protein_per_100g: 8.9, carbs_per_100g: 27.4, fat_per_100g: 2.6, fiber_per_100g: 7.6, category: 'leguminosas', source: 'tbca' },
  { name: 'Ervilha cozida', calories_per_100g: 81, protein_per_100g: 5.4, carbs_per_100g: 14.0, fat_per_100g: 0.4, fiber_per_100g: 6.0, category: 'leguminosas', source: 'tbca' },
  { name: 'Soja cozida', calories_per_100g: 141, protein_per_100g: 12.9, carbs_per_100g: 11.5, fat_per_100g: 5.7, fiber_per_100g: 9.3, category: 'leguminosas', source: 'tbca' },

  // Carnes e Aves
  { name: 'Frango - peito grelhado', calories_per_100g: 163, protein_per_100g: 31.5, carbs_per_100g: 0.0, fat_per_100g: 3.6, fiber_per_100g: 0.0, category: 'carnes_aves', source: 'tbca' },
  { name: 'Frango - coxa assada', calories_per_100g: 192, protein_per_100g: 22.0, carbs_per_100g: 0.0, fat_per_100g: 11.3, fiber_per_100g: 0.0, category: 'carnes_aves', source: 'tbca' },
  { name: 'Frango - sobrecoxa grelhada', calories_per_100g: 213, protein_per_100g: 18.0, carbs_per_100g: 0.0, fat_per_100g: 15.5, fiber_per_100g: 0.0, category: 'carnes_aves', source: 'tbca' },
  { name: 'Carne bovina - patinho grelhado', calories_per_100g: 171, protein_per_100g: 26.0, carbs_per_100g: 0.0, fat_per_100g: 7.0, fiber_per_100g: 0.0, category: 'carnes_aves', source: 'tbca' },
  { name: 'Carne bovina - alcatra grelhada', calories_per_100g: 183, protein_per_100g: 28.0, carbs_per_100g: 0.0, fat_per_100g: 7.8, fiber_per_100g: 0.0, category: 'carnes_aves', source: 'tbca' },
  { name: 'Carne bovina - acém cozido', calories_per_100g: 223, protein_per_100g: 22.5, carbs_per_100g: 0.0, fat_per_100g: 14.2, fiber_per_100g: 0.0, category: 'carnes_aves', source: 'tbca' },
  { name: 'Carne bovina - contrafilé grelhado', calories_per_100g: 208, protein_per_100g: 28.5, carbs_per_100g: 0.0, fat_per_100g: 10.5, fiber_per_100g: 0.0, category: 'carnes_aves', source: 'tbca' },
  { name: 'Carne suína - lombo assado', calories_per_100g: 196, protein_per_100g: 27.2, carbs_per_100g: 0.0, fat_per_100g: 9.5, fiber_per_100g: 0.0, category: 'carnes_aves', source: 'tbca' },
  { name: 'Carne suína - pernil assado', calories_per_100g: 240, protein_per_100g: 24.8, carbs_per_100g: 0.0, fat_per_100g: 15.3, fiber_per_100g: 0.0, category: 'carnes_aves', source: 'tbca' },
  { name: 'Peru - peito assado', calories_per_100g: 135, protein_per_100g: 29.0, carbs_per_100g: 0.0, fat_per_100g: 1.7, fiber_per_100g: 0.0, category: 'carnes_aves', source: 'tbca' },

  // Peixes e Frutos do Mar
  { name: 'Tilápia grelhada', calories_per_100g: 96, protein_per_100g: 20.1, carbs_per_100g: 0.0, fat_per_100g: 1.7, fiber_per_100g: 0.0, category: 'peixes', source: 'tbca' },
  { name: 'Atum em água (lata)', calories_per_100g: 128, protein_per_100g: 28.0, carbs_per_100g: 0.0, fat_per_100g: 1.1, fiber_per_100g: 0.0, category: 'peixes', source: 'tbca' },
  { name: 'Salmão grelhado', calories_per_100g: 208, protein_per_100g: 20.0, carbs_per_100g: 0.0, fat_per_100g: 13.4, fiber_per_100g: 0.0, category: 'peixes', source: 'tbca' },
  { name: 'Sardinha em óleo (lata)', calories_per_100g: 208, protein_per_100g: 24.6, carbs_per_100g: 0.0, fat_per_100g: 11.5, fiber_per_100g: 0.0, category: 'peixes', source: 'tbca' },
  { name: 'Camarão cozido', calories_per_100g: 99, protein_per_100g: 20.9, carbs_per_100g: 0.2, fat_per_100g: 1.7, fiber_per_100g: 0.0, category: 'peixes', source: 'tbca' },
  { name: 'Merluza grelhada', calories_per_100g: 82, protein_per_100g: 17.8, carbs_per_100g: 0.0, fat_per_100g: 0.9, fiber_per_100g: 0.0, category: 'peixes', source: 'tbca' },

  // Ovos
  { name: 'Ovo inteiro cozido', calories_per_100g: 146, protein_per_100g: 13.3, carbs_per_100g: 0.6, fat_per_100g: 9.5, fiber_per_100g: 0.0, category: 'ovos', source: 'tbca' },
  { name: 'Ovo inteiro mexido', calories_per_100g: 176, protein_per_100g: 12.0, carbs_per_100g: 0.6, fat_per_100g: 13.9, fiber_per_100g: 0.0, category: 'ovos', source: 'tbca' },
  { name: 'Clara de ovo cozida', calories_per_100g: 48, protein_per_100g: 10.9, carbs_per_100g: 0.7, fat_per_100g: 0.0, fiber_per_100g: 0.0, category: 'ovos', source: 'tbca' },

  // Laticínios
  { name: 'Leite integral', calories_per_100g: 61, protein_per_100g: 3.2, carbs_per_100g: 4.8, fat_per_100g: 3.2, fiber_per_100g: 0.0, category: 'laticinios', source: 'tbca' },
  { name: 'Leite desnatado', calories_per_100g: 35, protein_per_100g: 3.4, carbs_per_100g: 5.0, fat_per_100g: 0.1, fiber_per_100g: 0.0, category: 'laticinios', source: 'tbca' },
  { name: 'Iogurte natural integral', calories_per_100g: 66, protein_per_100g: 3.8, carbs_per_100g: 7.6, fat_per_100g: 1.8, fiber_per_100g: 0.0, category: 'laticinios', source: 'tbca' },
  { name: 'Iogurte grego integral', calories_per_100g: 97, protein_per_100g: 9.0, carbs_per_100g: 3.6, fat_per_100g: 5.0, fiber_per_100g: 0.0, category: 'laticinios', source: 'tbca' },
  { name: 'Queijo minas frescal', calories_per_100g: 264, protein_per_100g: 17.4, carbs_per_100g: 3.0, fat_per_100g: 20.2, fiber_per_100g: 0.0, category: 'laticinios', source: 'tbca' },
  { name: 'Queijo cottage', calories_per_100g: 98, protein_per_100g: 11.1, carbs_per_100g: 3.4, fat_per_100g: 4.5, fiber_per_100g: 0.0, category: 'laticinios', source: 'tbca' },
  { name: 'Requeijão cremoso', calories_per_100g: 257, protein_per_100g: 8.8, carbs_per_100g: 4.1, fat_per_100g: 23.5, fiber_per_100g: 0.0, category: 'laticinios', source: 'tbca' },
  { name: 'Queijo muçarela', calories_per_100g: 289, protein_per_100g: 21.6, carbs_per_100g: 2.0, fat_per_100g: 22.0, fiber_per_100g: 0.0, category: 'laticinios', source: 'tbca' },
  { name: 'Whey protein (pó)', calories_per_100g: 380, protein_per_100g: 80.0, carbs_per_100g: 6.0, fat_per_100g: 4.0, fiber_per_100g: 0.0, category: 'laticinios', source: 'tbca' },

  // Vegetais e Legumes
  { name: 'Alface', calories_per_100g: 11, protein_per_100g: 1.3, carbs_per_100g: 1.7, fat_per_100g: 0.2, fiber_per_100g: 1.8, category: 'vegetais', source: 'tbca' },
  { name: 'Tomate', calories_per_100g: 15, protein_per_100g: 1.1, carbs_per_100g: 3.1, fat_per_100g: 0.2, fiber_per_100g: 1.2, category: 'vegetais', source: 'tbca' },
  { name: 'Cenoura crua', calories_per_100g: 34, protein_per_100g: 1.3, carbs_per_100g: 7.7, fat_per_100g: 0.1, fiber_per_100g: 3.2, category: 'vegetais', source: 'tbca' },
  { name: 'Brócolis cozido', calories_per_100g: 27, protein_per_100g: 2.9, carbs_per_100g: 3.7, fat_per_100g: 0.4, fiber_per_100g: 3.0, category: 'vegetais', source: 'tbca' },
  { name: 'Espinafre cozido', calories_per_100g: 21, protein_per_100g: 3.0, carbs_per_100g: 2.4, fat_per_100g: 0.3, fiber_per_100g: 2.2, category: 'vegetais', source: 'tbca' },
  { name: 'Couve manteiga crua', calories_per_100g: 34, protein_per_100g: 3.1, carbs_per_100g: 5.8, fat_per_100g: 0.7, fiber_per_100g: 2.0, category: 'vegetais', source: 'tbca' },
  { name: 'Abobrinha cozida', calories_per_100g: 21, protein_per_100g: 1.4, carbs_per_100g: 3.7, fat_per_100g: 0.4, fiber_per_100g: 1.0, category: 'vegetais', source: 'tbca' },
  { name: 'Batata cozida', calories_per_100g: 52, protein_per_100g: 1.2, carbs_per_100g: 11.9, fat_per_100g: 0.1, fiber_per_100g: 1.8, category: 'vegetais', source: 'tbca' },
  { name: 'Batata-doce cozida', calories_per_100g: 77, protein_per_100g: 1.3, carbs_per_100g: 18.0, fat_per_100g: 0.1, fiber_per_100g: 2.2, category: 'vegetais', source: 'tbca' },
  { name: 'Mandioca cozida', calories_per_100g: 125, protein_per_100g: 0.6, carbs_per_100g: 30.0, fat_per_100g: 0.3, fiber_per_100g: 1.9, category: 'vegetais', source: 'tbca' },
  { name: 'Chuchu cozido', calories_per_100g: 19, protein_per_100g: 0.5, carbs_per_100g: 4.3, fat_per_100g: 0.1, fiber_per_100g: 1.8, category: 'vegetais', source: 'tbca' },
  { name: 'Couve-flor cozida', calories_per_100g: 18, protein_per_100g: 1.7, carbs_per_100g: 3.0, fat_per_100g: 0.1, fiber_per_100g: 2.0, category: 'vegetais', source: 'tbca' },
  { name: 'Berinjela assada', calories_per_100g: 24, protein_per_100g: 0.9, carbs_per_100g: 5.2, fat_per_100g: 0.2, fiber_per_100g: 2.5, category: 'vegetais', source: 'tbca' },
  { name: 'Pepino', calories_per_100g: 13, protein_per_100g: 0.7, carbs_per_100g: 2.9, fat_per_100g: 0.1, fiber_per_100g: 0.5, category: 'vegetais', source: 'tbca' },
  { name: 'Cebola crua', calories_per_100g: 40, protein_per_100g: 1.1, carbs_per_100g: 9.2, fat_per_100g: 0.1, fiber_per_100g: 1.7, category: 'vegetais', source: 'tbca' },
  { name: 'Alho', calories_per_100g: 149, protein_per_100g: 6.4, carbs_per_100g: 33.1, fat_per_100g: 0.5, fiber_per_100g: 2.1, category: 'vegetais', source: 'tbca' },
  { name: 'Milho cozido', calories_per_100g: 86, protein_per_100g: 3.2, carbs_per_100g: 18.7, fat_per_100g: 1.2, fiber_per_100g: 2.7, category: 'vegetais', source: 'tbca' },

  // Frutas
  { name: 'Banana prata', calories_per_100g: 98, protein_per_100g: 1.3, carbs_per_100g: 26.0, fat_per_100g: 0.1, fiber_per_100g: 1.9, category: 'frutas', source: 'tbca' },
  { name: 'Maçã', calories_per_100g: 56, protein_per_100g: 0.3, carbs_per_100g: 15.0, fat_per_100g: 0.2, fiber_per_100g: 1.3, category: 'frutas', source: 'tbca' },
  { name: 'Laranja', calories_per_100g: 47, protein_per_100g: 0.9, carbs_per_100g: 11.8, fat_per_100g: 0.1, fiber_per_100g: 0.8, category: 'frutas', source: 'tbca' },
  { name: 'Mamão papaia', calories_per_100g: 40, protein_per_100g: 0.5, carbs_per_100g: 10.3, fat_per_100g: 0.1, fiber_per_100g: 1.8, category: 'frutas', source: 'tbca' },
  { name: 'Melancia', calories_per_100g: 30, protein_per_100g: 0.6, carbs_per_100g: 7.6, fat_per_100g: 0.2, fiber_per_100g: 0.4, category: 'frutas', source: 'tbca' },
  { name: 'Abacaxi', calories_per_100g: 50, protein_per_100g: 0.5, carbs_per_100g: 13.1, fat_per_100g: 0.1, fiber_per_100g: 1.0, category: 'frutas', source: 'tbca' },
  { name: 'Manga', calories_per_100g: 64, protein_per_100g: 0.4, carbs_per_100g: 17.0, fat_per_100g: 0.3, fiber_per_100g: 1.8, category: 'frutas', source: 'tbca' },
  { name: 'Morango', calories_per_100g: 30, protein_per_100g: 0.9, carbs_per_100g: 7.7, fat_per_100g: 0.3, fiber_per_100g: 2.0, category: 'frutas', source: 'tbca' },
  { name: 'Uva', calories_per_100g: 69, protein_per_100g: 0.6, carbs_per_100g: 18.1, fat_per_100g: 0.2, fiber_per_100g: 0.9, category: 'frutas', source: 'tbca' },
  { name: 'Abacate', calories_per_100g: 96, protein_per_100g: 1.2, carbs_per_100g: 6.0, fat_per_100g: 8.4, fiber_per_100g: 6.3, category: 'frutas', source: 'tbca' },
  { name: 'Melão', calories_per_100g: 29, protein_per_100g: 0.7, carbs_per_100g: 7.4, fat_per_100g: 0.1, fiber_per_100g: 0.3, category: 'frutas', source: 'tbca' },
  { name: 'Pêra', calories_per_100g: 55, protein_per_100g: 0.4, carbs_per_100g: 14.9, fat_per_100g: 0.1, fiber_per_100g: 3.1, category: 'frutas', source: 'tbca' },

  // Gorduras e Óleos
  { name: 'Azeite de oliva extravirgem', calories_per_100g: 884, protein_per_100g: 0.0, carbs_per_100g: 0.0, fat_per_100g: 100.0, fiber_per_100g: 0.0, category: 'gorduras', source: 'tbca' },
  { name: 'Óleo de soja', calories_per_100g: 884, protein_per_100g: 0.0, carbs_per_100g: 0.0, fat_per_100g: 100.0, fiber_per_100g: 0.0, category: 'gorduras', source: 'tbca' },
  { name: 'Manteiga', calories_per_100g: 717, protein_per_100g: 0.9, carbs_per_100g: 0.0, fat_per_100g: 81.0, fiber_per_100g: 0.0, category: 'gorduras', source: 'tbca' },
  { name: 'Óleo de coco', calories_per_100g: 884, protein_per_100g: 0.0, carbs_per_100g: 0.0, fat_per_100g: 100.0, fiber_per_100g: 0.0, category: 'gorduras', source: 'tbca' },
  { name: 'Pasta de amendoim integral', calories_per_100g: 598, protein_per_100g: 25.1, carbs_per_100g: 19.1, fat_per_100g: 50.4, fiber_per_100g: 6.4, category: 'gorduras', source: 'tbca' },

  // Bebidas
  { name: 'Suco de laranja natural', calories_per_100g: 45, protein_per_100g: 0.7, carbs_per_100g: 10.9, fat_per_100g: 0.1, fiber_per_100g: 0.2, category: 'bebidas', source: 'tbca' },
  { name: 'Café sem açúcar', calories_per_100g: 2, protein_per_100g: 0.3, carbs_per_100g: 0.0, fat_per_100g: 0.0, fiber_per_100g: 0.0, category: 'bebidas', source: 'tbca' },
  { name: 'Leite de coco', calories_per_100g: 197, protein_per_100g: 2.0, carbs_per_100g: 2.8, fat_per_100g: 21.3, fiber_per_100g: 2.2, category: 'bebidas', source: 'tbca' },
]
