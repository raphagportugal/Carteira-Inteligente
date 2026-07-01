# Configuração do ambiente de desenvolvimento

Este guia prepara um ambiente Windows com PowerShell. Execute os comandos na ordem indicada.

## 1. Ferramentas

### Git

Instale pelo [site oficial do Git](https://git-scm.com/download/win) ou com:

```powershell
winget install --id Git.Git -e
```

Feche e reabra o terminal e confirme:

```powershell
git --version
```

### NVM e Node.js

No Windows, instale o [nvm-windows](https://github.com/coreybutler/nvm-windows/releases). Depois, abra um novo PowerShell e instale uma versão LTS do Node.js 20 ou superior:

```powershell
nvm install 24.18.0
nvm use 24.18.0
node --version
npm --version
```

Se o projeto passar a declarar uma versão específica em `.nvmrc` ou `package.json`, use essa versão.

### Visual Studio Code

Instale pelo [site oficial](https://code.visualstudio.com/) ou com:

```powershell
winget install --id Microsoft.VisualStudioCode -e
```

### GitHub CLI

Instale a [GitHub CLI](https://cli.github.com/) e autentique:

```powershell
winget install --id GitHub.cli -e
gh auth login
gh auth status
```

## 2. Clonar o projeto

Com Git:

```powershell
git clone https://github.com/raphagportugal/Carteira-Inteligente.git
Set-Location Carteira-Inteligente
```

Ou com a GitHub CLI:

```powershell
gh repo clone raphagportugal/Carteira-Inteligente
Set-Location Carteira-Inteligente
```

## 3. Variáveis de ambiente

Crie o arquivo local a partir do exemplo:

```powershell
Copy-Item .env.example .env.local
```

Preencha `.env.local` sem colocar aspas, barra final ou caminho adicional:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_OU_PUBLISHABLE
```

Obtenha os dados no painel do Supabase nas configurações de API do projeto. Nunca use uma chave `service_role` em uma variável `NEXT_PUBLIC_*`, nunca publique `.env.local` e nunca copie valores reais para documentação ou commits.

O app não usa atualmente `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` ou `RESEND_API_KEY` em `.env.local`. As credenciais Google ficam no Google Cloud e no provedor Google do Supabase; as credenciais Resend ficam na configuração de SMTP do Supabase.

## 4. Instalar e executar

Instale as dependências:

```powershell
npm install
```

Inicie o servidor:

```powershell
npm run dev
```

Acesse `http://localhost:3000`.

Antes de abrir um Pull Request, valide:

```powershell
npm run lint
npm run typecheck
npm run build
```

## 5. Fluxo Git e GitHub

Atualize a branch principal e crie sua branch:

```powershell
git switch main
git pull --ff-only origin main
git switch -c feat/nome-curto
```

Revise e registre alterações focadas:

```powershell
git status
git diff
git add caminho/do/arquivo
git commit -m "Adiciona descrição objetiva"
```

Envie a branch e abra o Pull Request:

```powershell
git push -u origin feat/nome-curto
gh pr create --base main --fill
```

Após aprovação e verificações concluídas, faça o merge pelo GitHub. Com a GitHub CLI:

```powershell
gh pr merge --squash --delete-branch
git switch main
git pull --ff-only origin main
```

Não faça push direto na `main`. Não inclua `.env.local`, segredos ou mudanças sem relação com o objetivo do PR.

## 6. Troubleshooting

### PowerShell bloqueia o `npm`

Se aparecer `npm.ps1 cannot be loaded because running scripts is disabled`, prefira liberar scripts assinados para o usuário atual:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

Feche e reabra o PowerShell. Se a política for administrada pela organização, use temporariamente `npm.cmd install` e `npm.cmd run dev` ou peça suporte ao administrador; não enfraqueça a política da máquina inteira.

### `NEXT_PUBLIC_SUPABASE_URL` com caminho errado

A URL deve terminar no domínio do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
```

Não acrescente `/rest/v1`, `/auth/v1`, `/dashboard`, barra final ou qualquer outro caminho. Após editar `.env.local`, reinicie `npm run dev`.

### Google Login local

No Supabase:

- habilite o provedor Google em **Authentication > Providers**;
- mantenha o **Site URL** de produção;
- adicione `http://localhost:3000/**` às URLs de redirecionamento.

No Google Cloud, garanta que `http://localhost:3000` esteja nas origens autorizadas quando necessário e use a URI de callback exibida pelo Supabase para o provedor Google, normalmente `https://SEU_PROJECT_REF.supabase.co/auth/v1/callback`. A aplicação retorna pelo callback local `/auth/callback`. Confira também se o usuário de teste está autorizado quando a tela de consentimento do Google ainda não foi publicada.

Erros de `redirect_uri_mismatch` indicam divergência exata de protocolo, domínio, porta, caminho ou barra final entre Google Cloud e Supabase.

### Resend / SMTP

O envio de e-mails de autenticação passa pelo Supabase. Configure no painel do Supabase o SMTP personalizado com os dados fornecidos pelo Resend:

- host SMTP;
- porta;
- usuário;
- senha ou credencial SMTP;
- nome e endereço do remetente de um domínio verificado.

Não adicione `RESEND_API_KEY` ao `.env.local`: não há integração direta do SDK do Resend no código atual. Verifique o domínio e os registros DNS no Resend, teste os templates descritos em `docs/email-templates.md` e consulte os logs de Auth do Supabase e de entrega do Resend. Em desenvolvimento, limites do serviço padrão do Supabase, remetente não verificado, credenciais SMTP incorretas ou bloqueios de spam podem impedir a entrega.
