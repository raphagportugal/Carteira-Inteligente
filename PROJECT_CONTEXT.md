# Contexto do Projeto — Carteira Inteligente

> Agentes de IA devem ler este arquivo integralmente antes de analisar, planejar ou alterar o projeto. Depois, consultem o `README.md`, a documentação relevante e o código afetado. Não presumam que itens do roadmap já estão implementados.

## Visão do produto

A Carteira Inteligente é uma aplicação SaaS de finanças pessoais que ajuda o usuário a entender quanto possui disponível, antecipar o fluxo de caixa e tomar decisões alinhadas aos seus objetivos. O produto reúne contas, movimentações, compromissos, investimentos e planejamento em uma visão financeira prática, com o posicionamento **“Organize. Planeje. Conquiste.”**

Domínio de produção: `https://acarteirainteligente.com.br`.

## Stack

- **Aplicação:** Next.js 15 (App Router), React 19 e TypeScript.
- **Interface:** Tailwind CSS e Lucide React.
- **Backend e dados:** Supabase (PostgreSQL, Auth, Server Actions e Row Level Security).
- **Hospedagem:** Vercel.
- **E-mail transacional:** templates do Supabase Auth com entrega por SMTP/Resend.
- **Autenticação social:** Google OAuth por meio do Supabase Auth.
- **Código e colaboração:** Git e GitHub.

## Funcionalidades implementadas

- Landing page, páginas legais e contato.
- Cadastro e login por e-mail/senha, confirmação de e-mail, recuperação de senha e Google OAuth.
- Área autenticada protegida por middleware e validação de sessão no servidor.
- Dashboard com receitas, despesas, saldo, capacidade de poupança, categorias, histórico e leituras automáticas.
- Movimentações com criação, edição, exclusão, busca, filtros e agrupamento mensal.
- Contas bancárias, saldo centralizado e transferências entre contas sem distorcer receitas e despesas.
- Cartões de crédito, ciclos de fechamento/vencimento, próxima fatura e compras refletidas na data correta do fluxo de caixa.
- Parcelamentos, mensalidades, entradas futuras, financiamentos, empréstimos e planos personalizados.
- Projeção de fluxo de caixa para seis meses e compromissos dos próximos 90 dias.
- Objetivos financeiros e planejamento mensal por categoria.
- Investimentos e patrimônio, com posição manual, aportes, saques e alocação em objetivos.
- Perfil, configurações, onboarding, estados vazios, feedbacks e loading states.
- Validação no cliente e no servidor e isolamento dos dados de cada usuário via RLS.

Upload de PDF, integração bancária e inteligência artificial ainda não fazem parte da versão atual.

## Infraestrutura atual

- O frontend e as Server Actions são executados em Next.js e publicados na Vercel.
- O Supabase concentra PostgreSQL, autenticação, sessões e políticas RLS.
- O schema de referência está em `supabase/schema.sql`; evoluções incrementais estão em `supabase/migrations`.
- As variáveis da aplicação são `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`, configuradas localmente em `.env.local` e na Vercel.
- O Google OAuth é configurado no Google Cloud e no provedor Google do Supabase; o callback da aplicação é tratado por `/auth/callback`.
- Os e-mails de autenticação usam os templates documentados em `docs/email-templates.md`. A entrega por Resend é configurada como SMTP no Supabase, não diretamente no código Next.js.
- O repositório remoto fica no GitHub e a branch de produção é `main`.

## Decisões de produto

- A entrada de dados é manual nesta fase; não há integração bancária nem importação por PDF.
- O fluxo de caixa é orientado pela data de impacto financeiro. Compras no cartão usam o vencimento da fatura, preservando a data original da compra no histórico.
- Transferências entre contas não contam como receita ou despesa.
- A regra principal é: `Sobra de caixa = Entradas - Saídas - Valor investido`.
- A posição atual de investimentos e o valor de bens patrimoniais são informados manualmente.
- Aportes atuais e futuros reduzem o caixa; aportes históricos não alteram o caixa presente.
- Bens patrimoniais não impactam o fluxo de caixa.
- Movimentações reais podem liquidar mensalidades e evitar dupla contagem.
- O cronograma de financiamentos é uma previsão; não é um motor completo de amortização.
- Segurança e privacidade exigem validação de sessão, filtro por `user_id` e RLS como segunda camada.
- Mudanças de banco devem ser aditivas e preservar dados existentes.

## Fluxo Git

1. Atualize a `main` local antes de começar.
2. Crie uma branch curta e descritiva a partir da `main`, por exemplo `feat/trial-14-dias`, `fix/google-login` ou `docs/developer-setup`.
3. Faça alterações focadas e valide com `npm run lint`, `npm run typecheck` e `npm run build`.
4. Crie commits pequenos, claros e no imperativo.
5. Envie a branch ao GitHub e abra um Pull Request para `main`.
6. Revise o diff e aguarde as verificações antes do merge.
7. Faça o merge pelo GitHub e remova a branch concluída.

Não faça push direto na `main` e não misture refatorações não relacionadas ao objetivo da branch.

## Roadmap

Ordem planejada para os próximos ciclos:

1. **Trial de 14 dias:** período gratuito, estados de acesso e expiração.
2. **CPF:** coleta, validação, armazenamento seguro e adequação dos fluxos legais.
3. **Billing:** cobrança, planos, checkout, webhooks e conciliação de status.
4. **Gestão de assinatura:** consulta, alteração, cancelamento, renovação e portal do cliente.
5. **IA V1:** primeira experiência de inteligência artificial baseada nos dados financeiros, com escopo, consentimento e limites claramente definidos.

Esses itens são roadmap, não funcionalidades disponíveis. Antes de implementá-los, registre decisões de produto, segurança, privacidade, provedor e modelo de dados.
