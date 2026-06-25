"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

type PasswordFieldProps = {
  label?: string;
  name: string;
  autoComplete: string;
  placeholder?: string;
  minLength?: number;
};

export function PasswordField({
  label = "Senha",
  name,
  autoComplete,
  placeholder = "Mínimo de 6 caracteres",
  minLength = 6,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      <span className="relative block">
        <Lock className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-stone-400" />
        <input
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          minLength={minLength}
          placeholder={placeholder}
          className="focus-ring h-12 w-full rounded-xl border border-stone-200 bg-white pl-12 pr-12 text-sm placeholder:text-stone-400"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="focus-ring absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-stone-400 hover:text-slate-700"
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={visible}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </span>
    </label>
  );
}
