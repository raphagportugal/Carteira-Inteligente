export function bankThemeMapper(bank: string) {
  const themes: Record<string, { background: string; foreground: string }> = {
    Itaú: { background: "#000b40", foreground: "#ffffff" },
    Nubank: { background: "#820ad1", foreground: "#ffffff" },
    Santander: { background: "#cf2e2e", foreground: "#ffffff" },
    "Banco do Brasil": { background: "#f9dd16", foreground: "#111827" },
    Bradesco: { background: "#cc092f", foreground: "#ffffff" },
    Inter: { background: "#ff7a00", foreground: "#ffffff" },
    "Caixa Econômica": { background: "#005ca5", foreground: "#ffffff" },
    "C6 Bank": { background: "#242424", foreground: "#ffffff" },
    "XP Investimentos": { background: "#000000", foreground: "#ffffff" },
    "Banco Safra": { background: "#1e2044", foreground: "#ffffff" },
    Outro: { background: "#0f172a", foreground: "#ffffff" },
  };
  return themes[bank] ?? themes.Outro;
}
