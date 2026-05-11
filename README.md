# FitRF – Planejador de Dieta e Marmitas

App web para planejamento alimentar, controle de marmitas e acompanhamento calórico — com banco de dados de alimentos brasileiro baseado na [TBCA](https://www.tbca.net.br/).

## Funcionalidades

- **Dashboard** – anel calórico diário + barras de macros (proteína, carboidratos, gordura)
- **Diário Alimentar** – registro de refeições por tipo (café da manhã, almoço, jantar…)
- **Banco de Alimentos** – +80 alimentos brasileiros pré-carregados (TBCA) + cadastro de alimentos personalizados
- **Marmitas** – crie e salve conjuntos de alimentos com totais nutricionais; registre no diário com 1 clique
- **Planejador Semanal** – atribua marmitas a cada dia/refeição da semana e registre em massa no diário
- **Perfil** – metas calóricas e de macros individuais por usuário

## Deploy gratuito (Vercel + Supabase)

### 1. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) → **New project**
2. Copie a **Project URL** e a **anon public key** em *Settings → API*
3. Abra o **SQL Editor** e execute o conteúdo de [`supabase/schema.sql`](./supabase/schema.sql)

### 2. Fazer deploy na Vercel

1. Acesse [vercel.com](https://vercel.com) → **Add New Project** → importe este repositório do GitHub
2. Em **Environment Variables** adicione:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
3. Clique **Deploy** — pronto!

### 3. Cadastrar usuários

- Acesse o app → clique **Cadastre-se**
- Crie uma conta para você e outra para sua esposa
- Os dados são individuais por usuário (cada um tem suas marmitas e diário)

## Rodando localmente

```bash
# Copiar variáveis de ambiente
cp .env.local.example .env.local
# Preencher NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local

npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Stack

- **Next.js 16** (App Router + TypeScript)
- **Supabase** (PostgreSQL + Auth)
- **Tailwind CSS**

## Banco de alimentos

Os dados nutricionais estão em [`lib/foods-data.ts`](./lib/foods-data.ts) e são baseados na Tabela Brasileira de Composição de Alimentos (TBCA). São carregados automaticamente no primeiro cadastro. Você também pode adicionar alimentos personalizados pelo app.
