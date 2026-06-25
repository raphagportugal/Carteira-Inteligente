import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const providerError = requestUrl.searchParams.get("error");

  if (code && !providerError) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL("/auth/update-password", requestUrl.origin));
    }
  }

  const recoverUrl = new URL("/recuperar-senha", requestUrl.origin);
  recoverUrl.searchParams.set(
    "error",
    "Não foi possível validar o link de recuperação. Solicite um novo e-mail.",
  );
  return NextResponse.redirect(recoverUrl);
}
