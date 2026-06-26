# Templates de E-mail do Supabase Auth

Use este documento como referência para configurar manualmente os e-mails em:

`Supabase Dashboard -> Authentication -> Emails -> Templates`

Cole o assunto sugerido no campo de assunto e o HTML correspondente no editor do template.

Os templates usam HTML simples, CSS inline e preservam o placeholder `{{ .ConfirmationURL }}` do Supabase para manter links de confirmação, recuperação, magic link, troca de e-mail e convite funcionando.

## Template Base

Estrutura visual reutilizada em todas as variações:

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{TITLE}}</title>
  </head>
  <body style="margin:0; padding:0; background-color:#F8FAFC; font-family:Arial, Helvetica, sans-serif; color:#0F172A;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#F8FAFC; margin:0; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px; width:100%; background-color:#FFFFFF; border:1px solid #E2E8F0; border-radius:24px; overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 20px 32px; text-align:left;">
                <a href="https://acarteirainteligente.com.br" style="text-decoration:none;">
                  <img src="https://acarteirainteligente.com.br/brand/Logo-Horizontal-Fundo-Transparente.svg" width="220" alt="Carteira Inteligente" style="display:block; max-width:220px; width:100%; height:auto; border:0; outline:none;">
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 32px 32px;">
                <p style="margin:0 0 12px 0; color:#16A34A; font-size:12px; line-height:18px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase;">Carteira Inteligente</p>
                <h1 style="margin:0; color:#0F172A; font-size:28px; line-height:36px; font-weight:800;">{{TITLE}}</h1>
                <div style="margin-top:18px; color:#475569; font-size:16px; line-height:26px;">
                  {{BODY}}
                </div>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:28px;">
                  <tr>
                    <td bgcolor="#22C55E" style="border-radius:14px;">
                      <a href="{{ .ConfirmationURL }}" style="display:inline-block; padding:14px 22px; color:#0F172A; font-size:15px; line-height:20px; font-weight:700; text-decoration:none; border-radius:14px;">{{BUTTON}}</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:24px 0 0 0; color:#64748B; font-size:13px; line-height:22px;">Se o botão não funcionar, copie e cole este link no navegador:</p>
                <p style="margin:6px 0 0 0; color:#64748B; font-size:12px; line-height:20px; word-break:break-all;">{{ .ConfirmationURL }}</p>
              </td>
            </tr>
            <tr>
              <td style="background-color:#F8FAFC; padding:24px 32px; border-top:1px solid #E2E8F0;">
                <p style="margin:0; color:#0F172A; font-size:14px; line-height:22px; font-weight:700;">Carteira Inteligente</p>
                <p style="margin:2px 0 14px 0; color:#64748B; font-size:13px; line-height:20px;">Organize. Planeje. Conquiste.</p>
                <p style="margin:0 0 14px 0; color:#64748B; font-size:12px; line-height:20px;">Você está recebendo este e-mail porque possui uma conta ou iniciou uma ação na Carteira Inteligente.</p>
                <p style="margin:0; color:#64748B; font-size:12px; line-height:20px;">
                  <a href="https://acarteirainteligente.com.br" style="color:#16A34A; text-decoration:none; font-weight:700;">Página inicial</a>
                  <span style="color:#CBD5E1;"> · </span>
                  <a href="https://acarteirainteligente.com.br/privacy" style="color:#16A34A; text-decoration:none; font-weight:700;">Política de Privacidade</a>
                  <span style="color:#CBD5E1;"> · </span>
                  <a href="https://acarteirainteligente.com.br/terms" style="color:#16A34A; text-decoration:none; font-weight:700;">Termos de Uso</a>
                  <span style="color:#CBD5E1;"> · </span>
                  <a href="https://acarteirainteligente.com.br/contact" style="color:#16A34A; text-decoration:none; font-weight:700;">Contato</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

## Confirm Signup

Template do Supabase: `Confirm signup`

Assunto sugerido:

```text
Confirme seu e-mail na Carteira Inteligente
```

HTML:

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Confirme seu e-mail</title>
  </head>
  <body style="margin:0; padding:0; background-color:#F8FAFC; font-family:Arial, Helvetica, sans-serif; color:#0F172A;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#F8FAFC; margin:0; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px; width:100%; background-color:#FFFFFF; border:1px solid #E2E8F0; border-radius:24px; overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 20px 32px; text-align:left;">
                <a href="https://acarteirainteligente.com.br" style="text-decoration:none;">
                  <img src="https://acarteirainteligente.com.br/brand/Logo-Horizontal-Fundo-Transparente.svg" width="220" alt="Carteira Inteligente" style="display:block; max-width:220px; width:100%; height:auto; border:0; outline:none;">
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 32px 32px;">
                <p style="margin:0 0 12px 0; color:#16A34A; font-size:12px; line-height:18px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase;">Bem-vindo</p>
                <h1 style="margin:0; color:#0F172A; font-size:28px; line-height:36px; font-weight:800;">Confirme seu e-mail</h1>
                <div style="margin-top:18px; color:#475569; font-size:16px; line-height:26px;">
                  <p style="margin:0 0 14px 0;">Sua conta na Carteira Inteligente está quase pronta.</p>
                  <p style="margin:0;">Confirme seu e-mail para começar a organizar sua vida financeira, acompanhar seu fluxo de caixa e planejar seus objetivos com mais clareza.</p>
                </div>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:28px;">
                  <tr>
                    <td bgcolor="#22C55E" style="border-radius:14px;">
                      <a href="{{ .ConfirmationURL }}" style="display:inline-block; padding:14px 22px; color:#0F172A; font-size:15px; line-height:20px; font-weight:700; text-decoration:none; border-radius:14px;">Confirmar meu e-mail</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:24px 0 0 0; color:#64748B; font-size:13px; line-height:22px;">Se o botão não funcionar, copie e cole este link no navegador:</p>
                <p style="margin:6px 0 0 0; color:#64748B; font-size:12px; line-height:20px; word-break:break-all;">{{ .ConfirmationURL }}</p>
              </td>
            </tr>
            <tr>
              <td style="background-color:#F8FAFC; padding:24px 32px; border-top:1px solid #E2E8F0;">
                <p style="margin:0; color:#0F172A; font-size:14px; line-height:22px; font-weight:700;">Carteira Inteligente</p>
                <p style="margin:2px 0 14px 0; color:#64748B; font-size:13px; line-height:20px;">Organize. Planeje. Conquiste.</p>
                <p style="margin:0 0 14px 0; color:#64748B; font-size:12px; line-height:20px;">Você está recebendo este e-mail porque possui uma conta ou iniciou uma ação na Carteira Inteligente.</p>
                <p style="margin:0; color:#64748B; font-size:12px; line-height:20px;">
                  <a href="https://acarteirainteligente.com.br" style="color:#16A34A; text-decoration:none; font-weight:700;">Página inicial</a>
                  <span style="color:#CBD5E1;"> · </span>
                  <a href="https://acarteirainteligente.com.br/privacy" style="color:#16A34A; text-decoration:none; font-weight:700;">Política de Privacidade</a>
                  <span style="color:#CBD5E1;"> · </span>
                  <a href="https://acarteirainteligente.com.br/terms" style="color:#16A34A; text-decoration:none; font-weight:700;">Termos de Uso</a>
                  <span style="color:#CBD5E1;"> · </span>
                  <a href="https://acarteirainteligente.com.br/contact" style="color:#16A34A; text-decoration:none; font-weight:700;">Contato</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

## Recovery / Reset Password

Template do Supabase: `Reset Password`

Assunto sugerido:

```text
Redefina sua senha
```

HTML:

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Redefina sua senha</title>
  </head>
  <body style="margin:0; padding:0; background-color:#F8FAFC; font-family:Arial, Helvetica, sans-serif; color:#0F172A;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#F8FAFC; margin:0; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px; width:100%; background-color:#FFFFFF; border:1px solid #E2E8F0; border-radius:24px; overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 20px 32px; text-align:left;">
                <a href="https://acarteirainteligente.com.br" style="text-decoration:none;">
                  <img src="https://acarteirainteligente.com.br/brand/Logo-Horizontal-Fundo-Transparente.svg" width="220" alt="Carteira Inteligente" style="display:block; max-width:220px; width:100%; height:auto; border:0; outline:none;">
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 32px 32px;">
                <p style="margin:0 0 12px 0; color:#16A34A; font-size:12px; line-height:18px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase;">Recuperação de acesso</p>
                <h1 style="margin:0; color:#0F172A; font-size:28px; line-height:36px; font-weight:800;">Redefina sua senha</h1>
                <div style="margin-top:18px; color:#475569; font-size:16px; line-height:26px;">
                  <p style="margin:0 0 14px 0;">Recebemos uma solicitação para redefinir a senha da sua conta.</p>
                  <p style="margin:0;">Clique no botão abaixo para criar uma nova senha. Se você não solicitou essa alteração, pode ignorar este e-mail.</p>
                </div>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:28px;">
                  <tr>
                    <td bgcolor="#22C55E" style="border-radius:14px;">
                      <a href="{{ .ConfirmationURL }}" style="display:inline-block; padding:14px 22px; color:#0F172A; font-size:15px; line-height:20px; font-weight:700; text-decoration:none; border-radius:14px;">Criar nova senha</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:24px 0 0 0; color:#64748B; font-size:13px; line-height:22px;">Se o botão não funcionar, copie e cole este link no navegador:</p>
                <p style="margin:6px 0 0 0; color:#64748B; font-size:12px; line-height:20px; word-break:break-all;">{{ .ConfirmationURL }}</p>
              </td>
            </tr>
            <tr>
              <td style="background-color:#F8FAFC; padding:24px 32px; border-top:1px solid #E2E8F0;">
                <p style="margin:0; color:#0F172A; font-size:14px; line-height:22px; font-weight:700;">Carteira Inteligente</p>
                <p style="margin:2px 0 14px 0; color:#64748B; font-size:13px; line-height:20px;">Organize. Planeje. Conquiste.</p>
                <p style="margin:0 0 14px 0; color:#64748B; font-size:12px; line-height:20px;">Você está recebendo este e-mail porque possui uma conta ou iniciou uma ação na Carteira Inteligente.</p>
                <p style="margin:0; color:#64748B; font-size:12px; line-height:20px;">
                  <a href="https://acarteirainteligente.com.br" style="color:#16A34A; text-decoration:none; font-weight:700;">Página inicial</a>
                  <span style="color:#CBD5E1;"> · </span>
                  <a href="https://acarteirainteligente.com.br/privacy" style="color:#16A34A; text-decoration:none; font-weight:700;">Política de Privacidade</a>
                  <span style="color:#CBD5E1;"> · </span>
                  <a href="https://acarteirainteligente.com.br/terms" style="color:#16A34A; text-decoration:none; font-weight:700;">Termos de Uso</a>
                  <span style="color:#CBD5E1;"> · </span>
                  <a href="https://acarteirainteligente.com.br/contact" style="color:#16A34A; text-decoration:none; font-weight:700;">Contato</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

## Magic Link

Template do Supabase: `Magic Link`

Assunto sugerido:

```text
Seu link de acesso à Carteira Inteligente
```

HTML:

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Seu link de acesso</title>
  </head>
  <body style="margin:0; padding:0; background-color:#F8FAFC; font-family:Arial, Helvetica, sans-serif; color:#0F172A;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#F8FAFC; margin:0; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px; width:100%; background-color:#FFFFFF; border:1px solid #E2E8F0; border-radius:24px; overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 20px 32px; text-align:left;">
                <a href="https://acarteirainteligente.com.br" style="text-decoration:none;">
                  <img src="https://acarteirainteligente.com.br/brand/Logo-Horizontal-Fundo-Transparente.svg" width="220" alt="Carteira Inteligente" style="display:block; max-width:220px; width:100%; height:auto; border:0; outline:none;">
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 32px 32px;">
                <p style="margin:0 0 12px 0; color:#16A34A; font-size:12px; line-height:18px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase;">Acesso seguro</p>
                <h1 style="margin:0; color:#0F172A; font-size:28px; line-height:36px; font-weight:800;">Seu link de acesso</h1>
                <div style="margin-top:18px; color:#475569; font-size:16px; line-height:26px;">
                  <p style="margin:0 0 14px 0;">Use o link abaixo para entrar na sua conta da Carteira Inteligente.</p>
                  <p style="margin:0;">Por segurança, este link expira após um período determinado. Se você não solicitou este acesso, ignore o e-mail.</p>
                </div>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:28px;">
                  <tr>
                    <td bgcolor="#22C55E" style="border-radius:14px;">
                      <a href="{{ .ConfirmationURL }}" style="display:inline-block; padding:14px 22px; color:#0F172A; font-size:15px; line-height:20px; font-weight:700; text-decoration:none; border-radius:14px;">Entrar na minha conta</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:24px 0 0 0; color:#64748B; font-size:13px; line-height:22px;">Se o botão não funcionar, copie e cole este link no navegador:</p>
                <p style="margin:6px 0 0 0; color:#64748B; font-size:12px; line-height:20px; word-break:break-all;">{{ .ConfirmationURL }}</p>
              </td>
            </tr>
            <tr>
              <td style="background-color:#F8FAFC; padding:24px 32px; border-top:1px solid #E2E8F0;">
                <p style="margin:0; color:#0F172A; font-size:14px; line-height:22px; font-weight:700;">Carteira Inteligente</p>
                <p style="margin:2px 0 14px 0; color:#64748B; font-size:13px; line-height:20px;">Organize. Planeje. Conquiste.</p>
                <p style="margin:0 0 14px 0; color:#64748B; font-size:12px; line-height:20px;">Você está recebendo este e-mail porque possui uma conta ou iniciou uma ação na Carteira Inteligente.</p>
                <p style="margin:0; color:#64748B; font-size:12px; line-height:20px;">
                  <a href="https://acarteirainteligente.com.br" style="color:#16A34A; text-decoration:none; font-weight:700;">Página inicial</a>
                  <span style="color:#CBD5E1;"> · </span>
                  <a href="https://acarteirainteligente.com.br/privacy" style="color:#16A34A; text-decoration:none; font-weight:700;">Política de Privacidade</a>
                  <span style="color:#CBD5E1;"> · </span>
                  <a href="https://acarteirainteligente.com.br/terms" style="color:#16A34A; text-decoration:none; font-weight:700;">Termos de Uso</a>
                  <span style="color:#CBD5E1;"> · </span>
                  <a href="https://acarteirainteligente.com.br/contact" style="color:#16A34A; text-decoration:none; font-weight:700;">Contato</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

## Change Email Address

Template do Supabase: `Change Email Address`

Assunto sugerido:

```text
Confirme seu novo e-mail
```

HTML:

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Confirme seu novo e-mail</title>
  </head>
  <body style="margin:0; padding:0; background-color:#F8FAFC; font-family:Arial, Helvetica, sans-serif; color:#0F172A;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#F8FAFC; margin:0; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px; width:100%; background-color:#FFFFFF; border:1px solid #E2E8F0; border-radius:24px; overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 20px 32px; text-align:left;">
                <a href="https://acarteirainteligente.com.br" style="text-decoration:none;">
                  <img src="https://acarteirainteligente.com.br/brand/Logo-Horizontal-Fundo-Transparente.svg" width="220" alt="Carteira Inteligente" style="display:block; max-width:220px; width:100%; height:auto; border:0; outline:none;">
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 32px 32px;">
                <p style="margin:0 0 12px 0; color:#16A34A; font-size:12px; line-height:18px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase;">Alteração de e-mail</p>
                <h1 style="margin:0; color:#0F172A; font-size:28px; line-height:36px; font-weight:800;">Confirme seu novo e-mail</h1>
                <div style="margin-top:18px; color:#475569; font-size:16px; line-height:26px;">
                  <p style="margin:0 0 14px 0;">Foi solicitada uma alteração de e-mail na sua conta da Carteira Inteligente.</p>
                  <p style="margin:0;">Para confirmar o novo endereço, clique no botão abaixo. Se você não solicitou essa alteração, ignore este e-mail.</p>
                </div>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:28px;">
                  <tr>
                    <td bgcolor="#22C55E" style="border-radius:14px;">
                      <a href="{{ .ConfirmationURL }}" style="display:inline-block; padding:14px 22px; color:#0F172A; font-size:15px; line-height:20px; font-weight:700; text-decoration:none; border-radius:14px;">Confirmar novo e-mail</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:24px 0 0 0; color:#64748B; font-size:13px; line-height:22px;">Se o botão não funcionar, copie e cole este link no navegador:</p>
                <p style="margin:6px 0 0 0; color:#64748B; font-size:12px; line-height:20px; word-break:break-all;">{{ .ConfirmationURL }}</p>
              </td>
            </tr>
            <tr>
              <td style="background-color:#F8FAFC; padding:24px 32px; border-top:1px solid #E2E8F0;">
                <p style="margin:0; color:#0F172A; font-size:14px; line-height:22px; font-weight:700;">Carteira Inteligente</p>
                <p style="margin:2px 0 14px 0; color:#64748B; font-size:13px; line-height:20px;">Organize. Planeje. Conquiste.</p>
                <p style="margin:0 0 14px 0; color:#64748B; font-size:12px; line-height:20px;">Você está recebendo este e-mail porque possui uma conta ou iniciou uma ação na Carteira Inteligente.</p>
                <p style="margin:0; color:#64748B; font-size:12px; line-height:20px;">
                  <a href="https://acarteirainteligente.com.br" style="color:#16A34A; text-decoration:none; font-weight:700;">Página inicial</a>
                  <span style="color:#CBD5E1;"> · </span>
                  <a href="https://acarteirainteligente.com.br/privacy" style="color:#16A34A; text-decoration:none; font-weight:700;">Política de Privacidade</a>
                  <span style="color:#CBD5E1;"> · </span>
                  <a href="https://acarteirainteligente.com.br/terms" style="color:#16A34A; text-decoration:none; font-weight:700;">Termos de Uso</a>
                  <span style="color:#CBD5E1;"> · </span>
                  <a href="https://acarteirainteligente.com.br/contact" style="color:#16A34A; text-decoration:none; font-weight:700;">Contato</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

## Invite User

Template do Supabase: `Invite User`

Assunto sugerido:

```text
Você foi convidado para a Carteira Inteligente
```

HTML:

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Você foi convidado</title>
  </head>
  <body style="margin:0; padding:0; background-color:#F8FAFC; font-family:Arial, Helvetica, sans-serif; color:#0F172A;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#F8FAFC; margin:0; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px; width:100%; background-color:#FFFFFF; border:1px solid #E2E8F0; border-radius:24px; overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 20px 32px; text-align:left;">
                <a href="https://acarteirainteligente.com.br" style="text-decoration:none;">
                  <img src="https://acarteirainteligente.com.br/brand/Logo-Horizontal-Fundo-Transparente.svg" width="220" alt="Carteira Inteligente" style="display:block; max-width:220px; width:100%; height:auto; border:0; outline:none;">
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 32px 32px;">
                <p style="margin:0 0 12px 0; color:#16A34A; font-size:12px; line-height:18px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase;">Convite</p>
                <h1 style="margin:0; color:#0F172A; font-size:28px; line-height:36px; font-weight:800;">Você foi convidado</h1>
                <div style="margin-top:18px; color:#475569; font-size:16px; line-height:26px;">
                  <p style="margin:0 0 14px 0;">Você recebeu um convite para acessar a Carteira Inteligente.</p>
                  <p style="margin:0;">Clique no botão abaixo para aceitar o convite e começar a organizar sua vida financeira com mais clareza.</p>
                </div>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:28px;">
                  <tr>
                    <td bgcolor="#22C55E" style="border-radius:14px;">
                      <a href="{{ .ConfirmationURL }}" style="display:inline-block; padding:14px 22px; color:#0F172A; font-size:15px; line-height:20px; font-weight:700; text-decoration:none; border-radius:14px;">Aceitar convite</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:24px 0 0 0; color:#64748B; font-size:13px; line-height:22px;">Se o botão não funcionar, copie e cole este link no navegador:</p>
                <p style="margin:6px 0 0 0; color:#64748B; font-size:12px; line-height:20px; word-break:break-all;">{{ .ConfirmationURL }}</p>
              </td>
            </tr>
            <tr>
              <td style="background-color:#F8FAFC; padding:24px 32px; border-top:1px solid #E2E8F0;">
                <p style="margin:0; color:#0F172A; font-size:14px; line-height:22px; font-weight:700;">Carteira Inteligente</p>
                <p style="margin:2px 0 14px 0; color:#64748B; font-size:13px; line-height:20px;">Organize. Planeje. Conquiste.</p>
                <p style="margin:0 0 14px 0; color:#64748B; font-size:12px; line-height:20px;">Você está recebendo este e-mail porque possui uma conta ou iniciou uma ação na Carteira Inteligente.</p>
                <p style="margin:0; color:#64748B; font-size:12px; line-height:20px;">
                  <a href="https://acarteirainteligente.com.br" style="color:#16A34A; text-decoration:none; font-weight:700;">Página inicial</a>
                  <span style="color:#CBD5E1;"> · </span>
                  <a href="https://acarteirainteligente.com.br/privacy" style="color:#16A34A; text-decoration:none; font-weight:700;">Política de Privacidade</a>
                  <span style="color:#CBD5E1;"> · </span>
                  <a href="https://acarteirainteligente.com.br/terms" style="color:#16A34A; text-decoration:none; font-weight:700;">Termos de Uso</a>
                  <span style="color:#CBD5E1;"> · </span>
                  <a href="https://acarteirainteligente.com.br/contact" style="color:#16A34A; text-decoration:none; font-weight:700;">Contato</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

## Observações de Aplicação

1. No painel do Supabase, abra `Authentication -> Emails -> Templates`.
2. Escolha o template correspondente.
3. Cole o assunto sugerido no campo de assunto.
4. Cole o HTML completo no editor do template.
5. Envie um e-mail de teste pelo Supabase antes de publicar.
6. Não substitua `{{ .ConfirmationURL }}` por uma URL fixa. Esse placeholder é gerado pelo Supabase para cada ação.

